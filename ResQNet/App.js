import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Alert, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting } from 'expo-quick-actions/router';
import * as Location from 'expo-location';
import { supabase } from './src/services/supabaseConfig';
import { auth } from './src/services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

// Screen Imports
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import HomeScreen from './src/screens/dashboard/HomeScreen';
import MapScreen from './src/screens/dashboard/MapScreen';
import ReportScreen from './src/screens/dashboard/ReportScreen';
import ProfileScreen from './src/screens/dashboard/ProfileScreen';
import ManualScreen from './src/screens/dashboard/ManualScreen';
import MeshScreen from './src/screens/dashboard/MeshScreen';
import { BottomTab } from './src/navigation/BottomTab';

export default function App() {
  const [screen, setScreen] = useState('loading'); // Start with loading to check auth
  const [activeTab, setActiveTab] = useState('home');
  const sosCooldownRef = useRef(false);

  // --- AUTH STATE PERSISTENCE ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setScreen('app');
      } else {
        setScreen('onboarding');
      }
    });
    return () => unsubscribe();
  }, []);

  // --- 1. REGISTER SHORTCUT ---
  useEffect(() => {
    QuickActions.setItems([
      {
        id: 'sos_trigger',
        title: '🚨 SEND SOS',
        subtitle: 'Emergency Broadcast',
        icon: 'compose',
      },
    ]);
  }, []);

  // --- 2. HANDLE SHORTCUT ---
  const activeAction = useQuickActionRouting();

  useEffect(() => {
    if (activeAction?.id === 'sos_trigger') {
      handleQuickSOS();
    }
  }, [activeAction]);

  const handleQuickSOS = async () => {
    if (sosCooldownRef.current) {
      Alert.alert("SOS Already Sent", "Please wait before sending another SOS.");
      return;
    }
    console.log("Quick Action Logic Triggered!");
    
    const userEmail = auth.currentUser?.email || 'UNREGISTERED_SOS_USER';

    try {
      Alert.alert("🚀 Triggering SOS...", "Fetching location in background...");
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Error", "Permission denied");
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});

      const { error } = await supabase.from('reports').insert({
        user_email: userEmail,
        type: 'SOS',
        details: 'TRIGGERED VIA HOME SCREEN SHORTCUT (URGENT)',
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (!error) {
        Alert.alert("🚨 SOS SENT", "Emergency beacon broadcasted successfully to Rescue Teams.");
        // 30-second cooldown
        sosCooldownRef.current = true;
        setTimeout(() => { sosCooldownRef.current = false; }, 30000);
        if (auth.currentUser) {
            setScreen('app'); 
            setActiveTab('home');
        }
      }
    } catch (e) {
      Alert.alert("SOS Error", e.message);
    }
  };

  const renderContent = () => {
    if (screen === 'loading') {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
          <ActivityIndicator size="large" color="#258cf4" />
        </View>
      );
    }
    if (screen === 'onboarding') return <OnboardingScreen onFinish={() => setScreen('login')} />;
    if (screen === 'login') return <LoginScreen onLogin={() => setScreen('app')} />;

    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {activeTab === 'home' && <HomeScreen onNavigate={(tab) => setActiveTab(tab)} />}
          {activeTab === 'map' && <MapScreen />}
          {activeTab === 'manual' && <ManualScreen />}
          {activeTab === 'mesh' && <MeshScreen />}
          {activeTab === 'report' && <ReportScreen />}
          {activeTab === 'profile' && <ProfileScreen onLogout={() => setScreen('login')} />}
        </View>
        <BottomTab active={activeTab} onChange={setActiveTab} />
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: 'white', position: 'relative' }}>
        {renderContent()}

        {/* --- VISIBLE PANIC BUTTON (Available on Login Screen) --- */}
        {screen === 'login' && (
          <TouchableOpacity 
            onPress={handleQuickSOS}
            style={{
              position: 'absolute',
              top: 60,
              right: 20,
              backgroundColor: '#ef4444',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 50,
              zIndex: 999,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Text style={{ fontSize: 16 }}>🚨</Text>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
              EMERGENCY SOS
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaProvider>
  );
}