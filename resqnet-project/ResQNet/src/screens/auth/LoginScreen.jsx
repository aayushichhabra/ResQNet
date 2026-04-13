import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Mail, Lock, Shield, User } from 'lucide-react-native';
import { Input, Button } from '../../components/UIComponents';

// --- CHANGED: Import from central config instead of re-initializing ---
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig'; 
// -------------------------------------------------------------------

export default function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    // Minimum password length (Firebase requires at least 6)
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match.");
        return;
      }
      if (!trimmedName) {
        Alert.alert("Error", "Please enter your name.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        await updateProfile(userCredential.user, { displayName: trimmedName });
        Alert.alert("Success", "Account created! Welcome, " + trimmedName);
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      }
      onLogin();
    } catch (error) {
      Alert.alert("Authentication Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#f8fafc] p-6 justify-center">
      <View className="items-center mb-6">
        <View className="w-16 h-16 bg-[#258cf4] rounded-2xl items-center justify-center mb-4 shadow-lg">
          <Shield size={32} color="white" />
        </View>
        <Text className="text-2xl font-bold text-slate-900">
          {isSignUp ? "Join ResQNet" : "Welcome Back"}
        </Text>
      </View>

      <View className="bg-white p-6 rounded-3xl shadow-sm mb-6">
        {isSignUp && (
          <Input 
            label="Full Name" 
            placeholder="John Doe" 
            icon={User} 
            value={name} 
            onChangeText={setName} 
          />
        )}

        <Input 
          label="Email Address" 
          placeholder="you@example.com" 
          icon={Mail} 
          value={email} 
          onChangeText={setEmail} 
        />
        
        <Input 
          label="Password" 
          placeholder="••••••••" 
          icon={Lock} 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
        />

        {isSignUp && (
          <Input 
            label="Confirm Password" 
            placeholder="••••••••" 
            icon={Lock} 
            secureTextEntry 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
          />
        )}
        
        {loading ? (
          <ActivityIndicator size="large" color="#258cf4" className="py-4" />
        ) : (
          <Button fullWidth onPress={handleAuth}>
            {isSignUp ? "Sign Up" : "Login Securely"}
          </Button>
        )}
      </View>
      
      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
         <Text className="text-center text-slate-500">
           {isSignUp ? "Already have an account? " : "New to ResQNet? "}
           <Text className="text-[#258cf4] font-bold">
             {isSignUp ? "Login" : "Create Account"}
           </Text>
         </Text>
      </TouchableOpacity>
    </View>
  );
}