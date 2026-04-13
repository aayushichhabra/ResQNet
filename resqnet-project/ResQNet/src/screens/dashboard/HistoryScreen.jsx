import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { supabase } from '../../services/supabaseConfig';
import { auth } from '../../services/firebaseConfig';
import { Clock, MapPin, AlertTriangle, ChevronRight, CheckCircle, Loader } from 'lucide-react-native';

export default function HistoryScreen({ onBack }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) {
        setLoading(false);
        return;
    }

    try {
      // Fetch status column as well
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (e) {
      console.log("Error fetching history:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  // Helper for Status UI
  const getStatusStyle = (status) => {
    const s = status ? status.toLowerCase() : 'pending';
    switch (s) {
      case 'resolved':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Resolved', icon: <CheckCircle size={14} color="#15803d"/> };
      case 'active':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Active', icon: <Loader size={14} color="#1d4ed8"/> };
      default:
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending', icon: <Clock size={14} color="#a16207"/> };
    }
  };

  return (
    <View className="flex-1 bg-[#f8fafc]">
      <View className="bg-white pt-12 pb-4 px-4 border-b border-slate-200 flex-row items-center gap-3">
        <TouchableOpacity onPress={onBack}>
          <ChevronRight size={24} className="rotate-180" color="#334155"/>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900">Your Reports</Text>
      </View>

      <ScrollView 
        className="p-4" 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#258cf4" className="mt-10" />
        ) : reports.length === 0 ? (
          <View className="items-center justify-center mt-20 opacity-50">
            <Clock size={64} color="#cbd5e1" />
            <Text className="mt-4 text-slate-500 font-medium">No reports found.</Text>
          </View>
        ) : (
          reports.map((report) => {
            const statusStyle = getStatusStyle(report.status);
            return (
              <View key={report.id} className="bg-white p-4 rounded-xl border border-slate-200 mb-3 shadow-sm">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className={`p-2 rounded-full ${report.type === 'SOS' ? 'bg-red-100' : 'bg-blue-100'}`}>
                      {report.type === 'SOS' ? <AlertTriangle size={16} color="#dc2626"/> : <MapPin size={16} color="#2563eb"/>}
                    </View>
                    <View>
                      <Text className="font-bold text-slate-800 text-base">{report.type}</Text>
                      <Text className="text-xs text-slate-400">{new Date(report.created_at).toLocaleString()}</Text>
                    </View>
                  </View>
                  
                  {/* Dynamic Status Badge */}
                  <View className={`flex-row items-center gap-1 px-3 py-1 rounded-full ${statusStyle.bg}`}>
                    {statusStyle.icon}
                    <Text className={`text-xs font-bold uppercase ${statusStyle.text}`}>{statusStyle.label}</Text>
                  </View>
                </View>
                
                {report.details && (
                  <Text className="text-slate-600 text-sm mt-1 bg-slate-50 p-2 rounded-lg">
                    {report.details}
                  </Text>
                )}
                
                <View className="flex-row items-center mt-3 pt-3 border-t border-slate-100">
                  <MapPin size={14} color="#94a3b8" />
                  <Text className="text-xs text-slate-400 ml-1">
                    Lat: {report.latitude?.toFixed(4)}, Long: {report.longitude?.toFixed(4)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}