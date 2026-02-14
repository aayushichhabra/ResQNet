<<<<<<< HEAD
import { useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
=======
import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Alert, TouchableOpacity, Text } from 'react-native';
import * as QuickActions from 'expo-quick-actions';
import * as Location from 'expo-location';
import { supabase } from './src/services/supabaseConfig';
import { auth } from './src/services/firebaseConfig';
>>>>>>> d110751c96ac894a062f9280d13d242bf387ccdf

// Screen Imports
import { BottomTab } from "./src/navigation/BottomTab";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import HomeScreen from "./src/screens/dashboard/HomeScreen";
import MapScreen from "./src/screens/dashboard/MapScreen";
import ProfileScreen from "./src/screens/dashboard/ProfileScreen";
import ReportScreen from "./src/screens/dashboard/ReportScreen";

export default function App() {
<<<<<<< HEAD
  const [screen, setScreen] = useState("onboarding"); // 'onboarding', 'login', 'app'
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    if (screen === "onboarding")
      return <OnboardingScreen onFinish={() => setScreen("login")} />;
    if (screen === "login")
      return <LoginScreen onLogin={() => setScreen("app")} />;
=======
  const [screen, setScreen] = useState('onboarding');
  const [activeTab, setActiveTab] = useState('home');

  // --- 1️⃣ REGISTER SHORTCUT ---
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

  // --- 2️⃣ HANDLE SHORTCUT (CLASSIC MODE - NO ROUTER) ---
  useEffect(() => {
    const subscription = QuickActions.addListener((action) => {
      if (action?.id === 'sos_trigger') {
        handleQuickSOS();
      }
    });

    return () => subscription.remove();
  }, []);

  const handleQuickSOS = async () => {
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
        Alert.alert(
          "🚨 SOS SENT",
          "Emergency beacon broadcasted successfully to Rescue Teams."
        );

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
    if (screen === 'onboarding')
      return <OnboardingScreen onFinish={() => setScreen('login')} />;

    if (screen === 'login')
      return <LoginScreen onLogin={() => setScreen('app')} />;
>>>>>>> d110751c96ac894a062f9280d13d242bf387ccdf

    // Dashboard Logic
    return (
<<<<<<< HEAD
      <View className="flex-1">
        <View className="flex-1">
          {activeTab === "home" && <HomeScreen onNavigate={() => {}} />}
          {activeTab === "map" && <MapScreen />}
          {activeTab === "manual" && <ManualScreen />}
          {activeTab === "report" && <ReportScreen />}
          {activeTab === "profile" && (
            <ProfileScreen onLogout={() => setScreen("login")} />
=======
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {activeTab === 'home' && (
            <HomeScreen onNavigate={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'map' && <MapScreen />}
          {activeTab === 'manual' && <ManualScreen />}
          {activeTab === 'report' && <ReportScreen />}
          {activeTab === 'profile' && (
            <ProfileScreen onLogout={() => setScreen('login')} />
>>>>>>> d110751c96ac894a062f9280d13d242bf387ccdf
          )}
        </View>

        <BottomTab active={activeTab} onChange={setActiveTab} />
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-white">
        {renderContent()}

<<<<<<< HEAD
        {/* --- VISIBLE PANIC BUTTON (Available on Login Screen) --- */}
        {screen === "login" && (
=======
        {/* 🚨 Visible Panic Button on Login Screen */}
        {screen === 'login' && (
>>>>>>> d110751c96ac894a062f9280d13d242bf387ccdf
          <TouchableOpacity
            onPress={handleQuickSOS}
            style={{
              position: "absolute",
              top: 60,
              right: 20,
              backgroundColor: "#ef4444",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 50,
              zIndex: 999,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 16 }}>🚨</Text>
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
              EMERGENCY SOS
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaProvider>
  );
}
