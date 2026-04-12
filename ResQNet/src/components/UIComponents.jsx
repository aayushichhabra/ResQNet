import React from 'react';
import { TouchableOpacity, Text, TextInput, View } from 'react-native';
import { styled } from 'nativewind';

// Reusable Button
export const Button = ({ children, onPress, variant = 'primary', fullWidth = false }) => {
  const baseClass = "flex items-center justify-center rounded-xl h-14 px-6";
  const variants = {
    primary: "bg-[#258cf4] shadow-sm",
    outline: "border border-slate-300 bg-transparent",
    danger: "bg-red-600"
  };
  
  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`${baseClass} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      <Text className={`font-bold text-lg ${variant === 'outline' ? 'text-slate-700' : 'text-white'}`}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

// Reusable Input (Updated to accept props)
export const Input = ({ label, placeholder, icon: Icon, secureTextEntry, value, onChangeText }) => (
  <View className="mb-4 space-y-2">
    {label && <Text className="text-sm font-bold text-slate-700 ml-1">{label}</Text>}
    <View className="relative">
      {Icon && (
        <View className="absolute left-4 top-4 z-10">
          <Icon size={20} color="#94a3b8" />
        </View>
      )}
      <TextInput 
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        className={`w-full h-14 bg-white border border-slate-200 rounded-xl text-slate-800 ${Icon ? 'pl-12' : 'px-4'}`}
        placeholderTextColor="#94a3b8"
      />
    </View>
  </View>
);

// Header Component
export const Header = ({ title, rightAction }) => (
  <View className="bg-white pt-14 pb-4 px-5 border-b border-slate-100 flex-row justify-between items-center">
    <Text className="text-xl font-bold text-slate-900">{title}</Text>
    {rightAction}
  </View>
);