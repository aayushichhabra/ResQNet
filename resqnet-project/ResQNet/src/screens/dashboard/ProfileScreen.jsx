import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Header } from '../../components/UIComponents';
import { LogOut, ChevronRight, User, Bell, Save, X, AlertTriangle, Clock } from 'lucide-react-native';
import { getAuth, updateProfile } from 'firebase/auth';
import { supabase } from '../../services/supabaseConfig.js'; 
import HistoryScreen from './HistoryScreen.jsx';

export default function ProfileScreen({ onLogout }) {
  const auth = getAuth();
  const user = auth.currentUser;

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || "");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // --- NOTIFICATION STATE ---
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Function to Save Name to Firebase
  const handleUpdateProfile = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }
    setLoading(true);
    try {
      await updateProfile(user, { displayName: newName });
      setIsEditing(false);
      Alert.alert("Success", "Profile Updated Successfully!");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- FETCH NOTIFICATIONS (ALERTS HISTORY) ---
  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    setShowNotifications(true);
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (e) {
      Alert.alert("Error", "Could not load notifications.");
    } finally {
      setLoadingNotifs(false);
    }
  };

  const displayName = user?.displayName || "ResQNet User";
  const email = user?.email || "No Email";
  const initials = displayName ? displayName.split(" ").map((n)=>n[0]).join("").substring(0,2).toUpperCase() : "RU";

  // --- RENDER HISTORY SCREEN IF ACTIVE ---
  if (showHistory) {
    return <HistoryScreen onBack={() => setShowHistory(false)} />;
  }

  return (
    <View className="flex-1 bg-[#f8fafc]">
      <Header title="My Profile" />
      <View className="p-5">
        
        {/* User Card (Editable) */}
        <View className="bg-white p-6 rounded-3xl shadow-sm mb-6">
          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 bg-slate-200 rounded-full items-center justify-center border-4 border-white shadow-sm">
              <Text className="text-xl font-bold text-slate-500">{initials}</Text>
            </View>
            
            <View className="flex-1">
              {isEditing ? (
                <TextInput 
                  value={newName}
                  onChangeText={setNewName}
                  className="border-b-2 border-[#258cf4] text-lg font-bold text-slate-900 pb-1 mb-1"
                  autoFocus
                />
              ) : (
                <Text className="text-lg font-bold text-slate-900">{displayName}</Text>
              )}
              <Text className="text-slate-500 text-sm">{email}</Text>
            </View>
          </View>

          {/* Save / Cancel Actions */}
          {isEditing && (
            <View className="flex-row justify-end gap-3 mt-4">
              <TouchableOpacity onPress={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 rounded-lg">
                <Text className="font-bold text-slate-500">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateProfile} className="px-4 py-2 bg-[#258cf4] rounded-lg flex-row gap-2 items-center">
                {loading ? <ActivityIndicator color="white" size="small" /> : <Save size={16} color="white" />}
                <Text className="font-bold text-white">Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View className="space-y-3">
           <TouchableOpacity 
             onPress={() => setIsEditing(true)} 
             className="bg-white p-4 rounded-2xl border border-slate-200 flex-row justify-between items-center active:bg-slate-50"
           >
              <View className="flex-row items-center gap-3">
                 <View className="bg-blue-50 p-2 rounded-full"><User size={20} color="#258cf4"/></View>
                 <Text className="font-bold text-slate-700">Edit Profile Details</Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
           </TouchableOpacity>

           {/* --- NEW BUTTON: MY REPORTS --- */}
           <TouchableOpacity onPress={() => setShowHistory(true)} className="bg-white p-4 rounded-2xl border border-slate-200 flex-row justify-between items-center active:bg-slate-50">
              <View className="flex-row items-center gap-3">
                 <View className="bg-purple-50 p-2 rounded-full"><Clock size={20} color="#9333ea"/></View>
                 <Text className="font-bold text-slate-700">My Past Reports</Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
           </TouchableOpacity>

           {/* NOTIFICATIONS BUTTON - Now opens modal */}
           <TouchableOpacity 
             onPress={fetchNotifications}
             className="bg-white p-4 rounded-2xl border border-slate-200 flex-row justify-between items-center active:bg-slate-50"
           >
              <View className="flex-row items-center gap-3">
                 <View className="bg-orange-50 p-2 rounded-full"><Bell size={20} color="#f97316"/></View>
                 <Text className="font-bold text-slate-700">Notifications History</Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
           </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={() => {
            auth.signOut();
            onLogout();
          }} 
          className="mt-6 bg-red-50 p-4 rounded-xl flex-row items-center justify-center active:bg-red-100"
        >
          <LogOut size={20} color="#dc2626" />
          <Text className="text-red-600 font-bold ml-2">Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* --- NOTIFICATIONS MODAL --- */}
      <Modal visible={showNotifications} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-[#f8fafc]">
          <View className="p-4 border-b border-slate-200 bg-white flex-row justify-between items-center">
            <Text className="text-lg font-bold text-slate-900">Alert History</Text>
            <TouchableOpacity onPress={() => setShowNotifications(false)} className="bg-slate-100 p-2 rounded-full">
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          {loadingNotifs ? (
            <ActivityIndicator size="large" color="#258cf4" className="mt-10" />
          ) : (
            <ScrollView className="p-4">
              {notifications.length === 0 ? (
                <Text className="text-center text-slate-400 mt-10">No history available.</Text>
              ) : (
                notifications.map((alert) => (
                  <View key={alert.id} className="bg-white p-4 rounded-xl border border-slate-200 mb-3 flex-row gap-3">
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${alert.level === 'critical' ? 'bg-red-100' : 'bg-blue-100'}`}>
                      <AlertTriangle size={20} color={alert.level === 'critical' ? '#dc2626' : '#2563eb'} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-slate-800">{alert.title}</Text>
                      
                      {/* --- UPDATED: Show the message/subtext here --- */}
                      {alert.message && (
                        <Text className="text-sm text-slate-600 mt-1">{alert.message}</Text>
                      )}

                      <Text className="text-xs text-slate-500 mt-1">
                        {new Date(alert.created_at).toLocaleDateString()} • {new Date(alert.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

    </View>
  );
}