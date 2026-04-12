import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Shield, AlertTriangle, Navigation } from 'lucide-react-native';
import { Button } from '../components/UIComponents';

export default function OnboardingScreen({ onFinish }) {
  const [step, setStep] = useState(0);
  const slides = [
    { icon: Shield, title: "ResQNet", desc: "Disaster Response Network" },
    { icon: AlertTriangle, title: "Instant SOS", desc: "Broadcast your location to rescue teams." },
    { icon: Navigation, title: "Safe Routes", desc: "Find safe shelters nearby." }
  ];

  const CurrentIcon = slides[step].icon;

  return (
    <View className="flex-1 bg-white justify-center p-8">
      <View className="items-center mb-10">
        <View className="w-40 h-40 bg-blue-50 rounded-full items-center justify-center mb-8">
          <CurrentIcon size={80} color="#258cf4" />
        </View>
        <Text className="text-3xl font-bold text-slate-900 mb-2">{slides[step].title}</Text>
        <Text className="text-slate-500 text-center text-lg">{slides[step].desc}</Text>
      </View>
      
      <Button fullWidth onPress={() => step < 2 ? setStep(step + 1) : onFinish()}>
        {step === 2 ? "Get Started" : "Next"}
      </Button>
    </View>
  );
}