import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Home, MapPin, Camera, User, BookOpen, Radio } from 'lucide-react-native';

export const BottomTab = ({ active, onChange }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'map', icon: MapPin, label: 'Map' },
    { id: 'manual', icon: BookOpen, label: 'Manual' },
    { id: 'mesh', icon: Radio, label: 'Mesh' },
    { id: 'report', icon: Camera, label: 'Report' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <View 
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-8 pt-4 flex-row justify-around shadow-2xl"
      style={{ zIndex: 50, elevation: 5 }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onChange(tab.id)}
            className="items-center"
            activeOpacity={0.7}
          >
            <View className={`p-3 rounded-2xl mb-1 ${isActive ? 'bg-blue-50' : ''}`}>
              <Icon size={24} color={isActive ? '#258cf4' : '#94a3b8'} strokeWidth={isActive ? 2.5 : 2} />
            </View>
            <Text className={`text-[10px] font-bold ${isActive ? 'text-[#258cf4]' : 'text-slate-400'}`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};