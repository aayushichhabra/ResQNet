import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Header } from '../../components/UIComponents';
import { Phone, BookOpen, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Section = ({ title, content, isOpen, onToggle }) => (
  <View className="mb-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
    <TouchableOpacity onPress={onToggle} className="p-4 flex-row justify-between items-center bg-slate-50">
      <Text className="font-bold text-slate-800 text-base">{title}</Text>
      {isOpen ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
    </TouchableOpacity>
    {isOpen && (
      <View className="p-4 border-t border-slate-100">
        <Text className="text-slate-600 leading-relaxed">{content}</Text>
      </View>
    )}
  </View>
);

const Helpline = ({ name, number }) => (
  <TouchableOpacity 
    onPress={() => Linking.openURL(`tel:${number}`)}
    className="flex-row items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100 mb-3"
  >
    <View className="flex-row items-center gap-3">
      <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
        <Phone size={20} color="#16a34a" />
      </View>
      <View>
        <Text className="font-bold text-slate-800">{name}</Text>
        <Text className="text-green-700 font-bold">{number}</Text>
      </View>
    </View>
    <Text className="text-xs font-bold text-green-600 bg-white px-3 py-1 rounded-full">CALL</Text>
  </TouchableOpacity>
);

export default function ManualScreen() {
  const [openSection, setOpenSection] = useState(null);
  const [manualData, setManualData] = useState(defaultManual); // Start with default

  useEffect(() => {
    loadOfflineManual();
  }, []);

  const loadOfflineManual = async () => {
    try {
      const cached = await AsyncStorage.getItem('safety_packet_manual');
      if (cached) {
        setManualData(JSON.parse(cached));
      }
    } catch (e) {
      console.log("Using default manual");
    }
  };

  return (
    <View className="flex-1 bg-[#f8fafc]">
      <Header title="Safety Manual" />
      <ScrollView className="p-5" contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Helper Banner */}
        <View className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 flex-row gap-3">
          <BookOpen size={24} color="#2563eb" />
          <View className="flex-1">
            <Text className="font-bold text-blue-900">Offline Ready</Text>
            <Text className="text-blue-700 text-xs mt-1">
              This guide is stored on your device. You can access it without internet.
            </Text>
          </View>
        </View>

        <Text className="text-slate-500 font-bold text-xs uppercase mb-3 ml-1">Emergency Contacts</Text>
        {manualData.contacts.map((c, i) => <Helpline key={i} {...c} />)}

        <Text className="text-slate-500 font-bold text-xs uppercase mb-3 mt-6 ml-1">Disaster Protocols</Text>
        {manualData.guides.map((g, i) => (
          <Section 
            key={i} 
            title={g.title} 
            content={g.content} 
            isOpen={openSection === i} 
            onToggle={() => setOpenSection(openSection === i ? null : i)} 
          />
        ))}

      </ScrollView>
    </View>
  );
}

// Default Data (Fallback)
const defaultManual = {
  contacts: [
    { name: "National Emergency", number: "112" },
    { name: "Ambulance", number: "102" },
    { name: "Fire Brigade", number: "101" },
    { name: "Disaster Management", number: "108" }
  ],
  guides: [
    { title: "⚡ Earthquake Safety", content: "DROP, COVER, and HOLD ON. Stay away from glass, windows, outside doors and walls. Do not use elevators." },
    { title: "🌊 Flood Protocol", content: "Turn off gas, power, and water. Move to higher ground immediately. Do not walk through moving water. Six inches of moving water can make you fall." },
    { title: "🔥 Fire Evacuation", content: "Stay low to the floor to avoid smoke. Touch doorknobs with the back of your hand before opening. If hot, do not open. Use stairs, not elevators." },
    { title: "🩹 Basic First Aid (CPR)", content: "1. Push hard and fast in the center of the chest.\n2. Give rescue breaths if trained.\n3. Continue until help arrives." }
  ]
};