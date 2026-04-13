import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  Alert, ActivityIndicator, Modal
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Camera, MapPin, X, WifiOff, CloudUpload } from 'lucide-react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../services/supabaseConfig';
import { auth } from '../../services/firebaseConfig';
import { broadcastReport } from '../../services/meshService';

export default function ReportScreen() {
  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const wasOfflineRef = useRef(false);
  const submittingRef = useRef(false);

  const [type, setType] = useState('Flood');
  const [details, setDetails] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [location, setLocation] = useState(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // --- 1. INITIALIZATION & OFFLINE LISTENER ---
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !state.isConnected;

      // ✅ Sync ONLY when going from offline → online AND not submitting
      if (state.isConnected && wasOfflineRef.current && !submittingRef.current) {
        processOfflineQueue();
      }

      wasOfflineRef.current = offline;
      setIsOffline(offline);
    });

    getLocation();
    return () => unsubscribe();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    } catch (e) {
      console.log('Location Error', e);
    }
  };

  // --- 2. CAMERA FUNCTIONS ---
  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera access is needed.');
        return;
      }
    }
    setIsCameraOpen(true);
  };

  const takePicture = async () => {
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      setPhotoUri(photo.uri);
      setIsCameraOpen(false);
    } catch {
      Alert.alert('Error', 'Failed to capture image.');
    }
  };

  // --- 3. OFFLINE QUEUE PROCESSOR (SILENT) ---
  const processOfflineQueue = async () => {
    try {
      const storedReports = await AsyncStorage.getItem('offline_reports');
      if (!storedReports) return;

      const queue = JSON.parse(storedReports);
      if (!queue.length) return;

      const remaining = [];

      for (const report of queue) {
        try {
          const desc =
            report.details || report.description || 'No details provided';

          await uploadReportToSupabase(
            desc,
            report.photoUri,
            report.coords,
            report.userEmail,
            report.type
          );
        } catch {
          remaining.push(report);
        }
      }

      if (remaining.length === 0) {
        await AsyncStorage.removeItem('offline_reports');
      } else {
        await AsyncStorage.setItem(
          'offline_reports',
          JSON.stringify(remaining)
        );
      }
    } catch (e) {
      console.log('Queue error', e);
    }
  };

  // --- FORM RESET HELPER ---
  const resetForm = () => {
    setType('Flood');
    setDetails('');
    setPhotoUri(null);
  };

  // --- 4. UPLOAD FUNCTION ---
  const uploadReportToSupabase = async (desc, imgUri, coords, email, reportType) => {
    let evidenceUrl = null;
    let photoFailed = false;

    if (imgUri) {
      try {
        const fileName = `${Date.now()}.jpg`;
        const formData = new FormData();
        formData.append('file', {
          uri: imgUri,
          name: fileName,
          type: 'image/jpeg',
        });

        const { error } = await supabase.storage
          .from('reports')
          .upload(fileName, formData);

        if (!error) {
          const { data } = supabase.storage
            .from('reports')
            .getPublicUrl(fileName);
          evidenceUrl = data.publicUrl;
        } else {
          console.warn('Photo upload error:', error.message);
          photoFailed = true;
        }
      } catch (e) {
        console.warn('Photo upload failed:', e);
        photoFailed = true;
      }
    }

    const { error } = await supabase.from('reports').insert({
      details: desc,
      type: reportType,
      evidence_url: evidenceUrl,
      latitude: coords.latitude,
      longitude: coords.longitude,
      user_email: email,
      status: 'Pending',
      created_at: new Date().toISOString(),
    });

    if (error) throw error;
    return { photoFailed };
  };

  // --- 5. SUBMIT HANDLER ---
  const handleSubmit = async () => {
    if (loading) return;
    submittingRef.current = true;

    if (!details.trim() && !photoUri) {
      Alert.alert('Missing Details', 'Please provide details or a photo.');
      submittingRef.current = false;
      return;
    }

    setLoading(true);

    try {
      const net = await NetInfo.fetch();
      const email = auth.currentUser?.email || 'anonymous';
      const coords = location || { latitude: 0, longitude: 0 };

      // OFFLINE
      if (!net.isConnected) {
        const report = {
          id: Date.now().toString(),
          details: details.trim(),
          type,
          photoUri,
          coords,
          userEmail: email,
        };

        const queue = JSON.parse(
          (await AsyncStorage.getItem('offline_reports')) || '[]'
        );
        queue.push(report);
        await AsyncStorage.setItem('offline_reports', JSON.stringify(queue));

        // Queue for P2P Mesh Broadcast
        await broadcastReport(report);

        Alert.alert('Saved Offline', 'Will auto-submit when online or relayed via mesh.');
        setLoading(false);
        submittingRef.current = false;
        resetForm();
        return;
      }

      // ONLINE
      const result = await uploadReportToSupabase(details.trim(), photoUri, coords, email, type);
      if (result?.photoFailed) {
        Alert.alert('Report Sent', 'Report submitted, but the photo could not be uploaded. Text details were saved.');
      } else {
        Alert.alert('Success', 'Report submitted successfully.');
      }
      setLoading(false);
      submittingRef.current = false;
      resetForm();
    } catch (e) {
      Alert.alert('Saved', 'Report will retry automatically.');
      setLoading(false);
      submittingRef.current = false;
    }
  };
  
  return (
    <View className="flex-1 bg-[#f8fafc]">
      {/* Header */}
      <View className="pt-14 pb-4 px-6 bg-white border-b border-slate-200 flex-row items-center gap-3">
        <Text className="text-xl font-bold text-slate-800">Report Incident</Text>
      </View>

      <ScrollView className="p-5" contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Offline Banner */}
        {isOffline && (
          <View className="bg-orange-100 border border-orange-200 p-3 rounded-xl flex-row items-center mb-6">
            <WifiOff size={20} color="#ea580c" />
            <Text className="text-orange-700 font-bold ml-2">You are Offline</Text>
            <Text className="text-orange-600 text-xs ml-auto">Reports queued</Text>
          </View>
        )}

        {/* Location Card */}
        <View className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex-row items-center">
          <View className="bg-blue-100 p-2 rounded-full">
            <MapPin size={20} color="#2563eb" />
          </View>
          <View className="ml-3">
             <Text className="font-bold text-slate-800">Current Device Location</Text>
             <Text className="text-xs text-slate-400">
               {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Fetching GPS..."}
             </Text>
          </View>
        </View>

        {/* Incident Type Selector */}
        <Text className="font-bold text-slate-500 text-xs uppercase mb-2 ml-1">Incident Type</Text>
        <View className="flex-row gap-2 flex-wrap mb-6">
          {['Flood', 'Fire', 'Landslide', 'Medical', 'Blocked Road'].map(t => (
            <TouchableOpacity 
              key={t} 
              onPress={() => setType(t)}
              className={`px-4 py-3 rounded-xl border ${type === t ? 'bg-red-600 border-red-600' : 'bg-white border-slate-200'}`}
            >
              <Text className={`font-bold ${type === t ? 'text-white' : 'text-slate-600'}`}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Details Input */}
        <Text className="font-bold text-slate-500 text-xs uppercase mb-2 ml-1">Details</Text>
        <TextInput 
          value={details}
          onChangeText={setDetails}
          placeholder="Describe the situation (e.g. 'Trapped on roof, water rising')..."
          multiline
          numberOfLines={4}
          className="bg-white p-4 rounded-xl border border-slate-200 text-slate-800 text-base mb-6 h-32"
          textAlignVertical="top"
        />

        {/* Camera / Photo Section */}
        {photoUri ? (
          <View className="mb-6 relative">
            <Image 
              source={{ uri: photoUri }} 
              className="w-full h-48 rounded-xl bg-slate-200 border border-slate-200"
              resizeMode="cover"
            />
            <TouchableOpacity 
              onPress={() => setPhotoUri(null)}
              className="absolute top-2 right-2 bg-black/50 p-2 rounded-full"
            >
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            onPress={openCamera}
            className="bg-slate-50 border-2 border-dashed border-slate-300 p-4 rounded-xl flex-row items-center justify-center gap-2 mb-6 h-16"
          >
             <Camera size={20} color="#94a3b8" />
             <Text className="text-slate-500 font-bold">Add Photo Evidence</Text>
          </TouchableOpacity>
        )}

        {/* Submit Button */}
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={loading}
          className={`rounded-xl py-4 items-center flex-row justify-center shadow-lg ${isOffline ? 'bg-slate-800' : 'bg-red-600'}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              {isOffline ? <CloudUpload size={20} color="white" style={{marginRight: 8}} /> : null}
              <Text className="text-white font-bold text-lg">
                {isOffline ? 'Save Report Offline' : 'Submit Report'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {isOffline && (
           <Text className="text-center text-slate-400 text-xs mt-3 px-8">
             Report will be stored locally and uploaded automatically when connection is restored.
           </Text>
        )}
      </ScrollView>

      {/* --- Camera Modal --- */}
      <Modal visible={isCameraOpen} animationType="slide" onRequestClose={() => setIsCameraOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <CameraView style={{ flex: 1 }} ref={cameraRef} facing="back">
            <View className="flex-1 justify-end pb-12 px-8">
              <View className="flex-row justify-between items-center">
                
                {/* Cancel */}
                <TouchableOpacity onPress={() => setIsCameraOpen(false)} className="bg-black/40 p-3 rounded-full">
                  <Text className="text-white font-bold">Cancel</Text>
                </TouchableOpacity>

                {/* Capture */}
                <TouchableOpacity 
                  onPress={takePicture}
                  className="w-20 h-20 rounded-full border-4 border-white justify-center items-center bg-white/20"
                >
                  <View className="w-16 h-16 rounded-full bg-white" />
                </TouchableOpacity>

                {/* Dummy View for spacing */}
                <View className="w-16" /> 
                
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>

    </View>
  );
}