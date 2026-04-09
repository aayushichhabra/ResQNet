import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Header } from '../../components/UIComponents';
import { supabase } from '../../services/supabaseConfig'; 
import { CloudOff, Download, Navigation, X, ArrowRight, CornerUpRight, CornerUpLeft, ArrowUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Navigation State
  const [routeCoords, setRouteCoords] = useState([]); 
  const [steps, setSteps] = useState([]); // Turn-by-turn instructions
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;
  const wasOfflineRef = useRef(false);
  const locationRef = useRef(null);

  // Fetch location once on mount
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let loc = await Location.getCurrentPositionAsync({});
      const region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setLocation(region);
      locationRef.current = region;
      loadShelterData();
    })();
  }, []);

  // Refetch shelters only on offline → online transition
  useEffect(() => {
    if (netInfo.isConnected && wasOfflineRef.current) {
      loadShelterData();
    }
    wasOfflineRef.current = !netInfo.isConnected;
  }, [netInfo.isConnected]);

  const loadShelterData = async () => {
    if (isOffline) {
      try {
        const cachedData = await AsyncStorage.getItem('safety_packet_shelters');
        if (cachedData) setShelters(JSON.parse(cachedData));
      } catch (e) { console.log("Cache Error", e); }
    } else {
      const { data, error } = await supabase.from('shelters').select('*');
      if (data) setShelters(data);
    }
  };

  // --- OSRM ROUTING LOGIC ---
  const fetchRoute = async (destination) => {
    setIsNavigating(true);
    setLoading(true);

    try {
      // 1. Try Offline Route First
      if (isOffline) {
        const cachedRouteKey = `route_${destination.id}`;
        const cachedRoute = await AsyncStorage.getItem(cachedRouteKey);
        
        if (cachedRoute) {
          const parsed = JSON.parse(cachedRoute);
          setRouteCoords(parsed.coords);
          setSteps(parsed.steps);
          setLoading(false);
          return;
        } else {
          Alert.alert("Offline", "No saved route to this location. Please go online to cache it.");
          setLoading(false);
          return;
        }
      }

      // 2. Fetch Online from OSRM
      const start = `${location.longitude},${location.latitude}`;
      const end = `${destination.longitude},${destination.latitude}`;
      const url = `http://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson&steps=true`;
      
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.routes && json.routes.length > 0) {
        const route = json.routes[0];
        const points = route.geometry.coordinates.map(p => ({ latitude: p[1], longitude: p[0] }));
        
        // Parse Steps for UI
        const instructions = route.legs[0].steps.map(step => ({
           instruction: step.maneuver.type + ' ' + (step.maneuver.modifier || ''),
           name: step.name || "road",
           distance: Math.round(step.distance) + 'm'
        }));

        setRouteCoords(points);
        setSteps(instructions);

        // Cache this specific route for later!
        const cachePayload = JSON.stringify({ coords: points, steps: instructions });
        await AsyncStorage.setItem(`route_${destination.id}`, cachePayload);

      } else {
        Alert.alert("Error", "No route found.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not fetch route.");
    } finally {
      setLoading(false);
    }
  };

  const cancelNavigation = () => {
    setIsNavigating(false);
    setRouteCoords([]);
    setSteps([]);
    setSelectedShelter(null);
  };

  const downloadSafetyPacket = async () => {
    if (isOffline) return;
    setLoading(true);
    try {
      // 1. Save Shelters
      const { data } = await supabase.from('shelters').select('*');
      if (!data || data.length === 0) {
        Alert.alert("No Data", "No shelters found to cache.");
        setLoading(false);
        return;
      }
      await AsyncStorage.setItem('safety_packet_shelters', JSON.stringify(data));
      
      // 2. Pre-Cache Routes to ALL Shelters
      const loc = locationRef.current || location;
      if (!loc) {
        Alert.alert("Error", "Location not available. Cannot cache routes.");
        setLoading(false);
        return;
      }

      let routesSaved = 0;
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      for (const shelter of data) {
        try {
          const start = `${loc.longitude},${loc.latitude}`;
          const end = `${shelter.longitude},${shelter.latitude}`;
          const url = `http://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson&steps=true`;
          
          const response = await fetch(url);
          const json = await response.json();
          
          if (json.routes && json.routes.length > 0) {
            const route = json.routes[0];
            const points = route.geometry.coordinates.map(p => ({ latitude: p[1], longitude: p[0] }));
            const instructions = route.legs[0].steps.map(step => ({
              instruction: step.maneuver.type + ' ' + (step.maneuver.modifier || ''),
              name: step.name || "road",
              distance: Math.round(step.distance) + 'm'
            }));

            const cachePayload = JSON.stringify({ coords: points, steps: instructions });
            await AsyncStorage.setItem(`route_${shelter.id}`, cachePayload);
            routesSaved++;
          }
          // Small delay to avoid OSRM rate-limiting
          await delay(500);
        } catch (e) {
          console.warn(`Failed to cache route for shelter ${shelter.name}:`, e);
        }
      }

      Alert.alert("Success", `Safety Packet Downloaded! ${routesSaved}/${data.length} routes cached.`);
    } catch (e) {
      Alert.alert("Error", "Download failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header title="Safe Routes" />
      
      {isOffline && (
        <View className="bg-amber-500 p-2 flex-row justify-center items-center gap-2">
          <CloudOff size={20} color="white" />
          <Text className="text-white font-bold text-xs">OFFLINE MODE</Text>
        </View>
      )}

      {/* NAVIGATION HEADER (Turn-by-Turn UI) */}
      {isNavigating && steps.length > 0 && (
        <View className="absolute top-24 left-4 right-4 bg-[#258cf4] p-4 rounded-xl shadow-lg z-50 flex-row items-center gap-4">
           <View className="bg-white/20 p-2 rounded-full">
              <CornerUpRight size={32} color="white" />
           </View>
           <View className="flex-1">
              <Text className="text-white font-bold text-lg capitalize">{steps[0].instruction} onto {steps[0].name}</Text>
              <Text className="text-blue-100 font-bold">{steps[0].distance}</Text>
           </View>
           <TouchableOpacity onPress={cancelNavigation}>
              <X size={24} color="white" />
           </TouchableOpacity>
        </View>
      )}

      {location ? (
        <View style={{ flex: 1 }}>
          <MapView 
            style={{ width: '100%', height: '100%' }}
            initialRegion={location}
            showsUserLocation={true}
            provider={PROVIDER_DEFAULT}
            onPress={() => !isNavigating && setSelectedShelter(null)}
          >
            {Array.isArray(shelters) && shelters.map((shelter) => (
              <Marker 
                key={shelter.id}
                coordinate={{ latitude: shelter.latitude, longitude: shelter.longitude }}
                title={shelter.name}
                pinColor={isOffline ? "orange" : "green"}
                onPress={(e) => {
                    e.stopPropagation();
                    setSelectedShelter(shelter);
                }}
              />
            ))}

            {routeCoords.length > 0 && (
              <Polyline 
                coordinates={routeCoords}
                strokeColor="#258cf4"
                strokeWidth={5}
              />
            )}
          </MapView>

          {/* NAVIGATE BUTTON (Start) */}
          {selectedShelter && !isNavigating && (
            <TouchableOpacity 
              onPress={() => fetchRoute(selectedShelter)}
              style={{ 
                position: 'absolute', 
                bottom: 120, 
                left: 20, 
                right: 20, 
                backgroundColor: '#258cf4', 
                padding: 15, 
                borderRadius: 15, 
                flexDirection: 'row', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: 10,
                zIndex: 999, 
                elevation: 10
              }}
            >
              {loading ? <ActivityIndicator color="white"/> : <Navigation size={20} color="white" />}
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                Get Directions
              </Text>
            </TouchableOpacity>
          )}

          {/* DOWNLOAD BUTTON */}
          {!isNavigating && (
            <TouchableOpacity 
              onPress={downloadSafetyPacket}
              style={{ 
                position: 'absolute', 
                bottom: 180, 
                right: 20, 
                backgroundColor: 'white', 
                padding: 15, 
                borderRadius: 50, 
                elevation: 5,
                borderWidth: 1,
                borderColor: '#e2e8f0'
              }}
            >
              <Download size={24} color="#258cf4" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#258cf4" />
          <Text className="text-slate-500 mt-4">Locating...</Text>
        </View>
      )}
    </View>
  );
}