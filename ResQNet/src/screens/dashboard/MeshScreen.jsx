import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Alert, Switch, ActivityIndicator, Animated,
} from 'react-native';
import {
  Radio, Wifi, WifiOff, Users, Send, Download,
  RefreshCw, Circle, ArrowUpCircle, ChevronRight,
} from 'lucide-react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  startMesh,
  stopMesh,
  isMeshActive,
  addMeshListener,
  getRelayedReports,
  getOutgoingReports,
  syncRelayedReports,
  getPeerCount,
  getMeshStatus,
} from '../../services/meshService';

// ─── Status colours ──────────────────────────────────────────────────
const STATUS_META = {
  idle:         { color: '#94a3b8', bg: '#f1f5f9', label: 'Idle',         dot: '#94a3b8' },
  starting:     { color: '#f59e0b', bg: '#fffbeb', label: 'Starting…',    dot: '#f59e0b' },
  scanning:     { color: '#3b82f6', bg: '#eff6ff', label: 'Scanning',     dot: '#3b82f6' },
  broadcasting: { color: '#8b5cf6', bg: '#f5f3ff', label: 'Broadcasting', dot: '#8b5cf6' },
  active:       { color: '#10b981', bg: '#ecfdf5', label: 'Active',       dot: '#10b981' },
};

export default function MeshScreen() {
  // ─── State ──────────────────────────────────────────────────────────
  const [enabled, setEnabled]       = useState(isMeshActive());
  const [status, setStatus]         = useState(getMeshStatus());
  const [peerCount, setPeerCount]   = useState(getPeerCount());
  const [outgoing, setOutgoing]     = useState([]);
  const [relayed, setRelayed]       = useState([]);
  const [syncing, setSyncing]       = useState(false);
  const [isOnline, setIsOnline]     = useState(true);
  const pulseAnim                   = useRef(new Animated.Value(1)).current;

  // ─── Network listener ──────────────────────────────────────────────
  useEffect(() => {
    const unsub = NetInfo.addEventListener(s => setIsOnline(!!s.isConnected));
    return () => unsub();
  }, []);

  // ─── Mesh event listener ───────────────────────────────────────────
  useEffect(() => {
    const unsub = addMeshListener(event => {
      switch (event.type) {
        case 'status':   setStatus(event.status); break;
        case 'peers':    setPeerCount(event.count); break;
        case 'relayed':  _refreshLists(); break;
        case 'outgoing': _refreshLists(); break;
        default: break;
      }
    });
    _refreshLists();
    return unsub;
  }, []);

  // ─── Pulse animation for active state ──────────────────────────────
  useEffect(() => {
    if (enabled && status !== 'idle') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 1000, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [enabled, status]);

  // ─── Helpers ────────────────────────────────────────────────────────
  const _refreshLists = useCallback(async () => {
    const [o, r] = await Promise.all([getOutgoingReports(), getRelayedReports()]);
    setOutgoing(o);
    setRelayed(r);
  }, []);

  const handleToggle = async (val) => {
    if (val) {
      const ok = await startMesh();
      if (!ok) {
        Alert.alert('Bluetooth Required', 'Please enable Bluetooth and grant permissions to use mesh networking.');
        return;
      }
      setEnabled(true);
    } else {
      stopMesh();
      setEnabled(false);
    }
  };

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const result = await syncRelayedReports();
      if (result.offline) {
        Alert.alert('Offline', 'Cannot sync — you are still offline.');
      } else if (result.uploaded > 0) {
        Alert.alert('Synced!', `${result.uploaded} relayed report(s) uploaded to the server.`);
      } else {
        Alert.alert('Nothing to Sync', 'No pending relayed reports to upload.');
      }
      await _refreshLists();
    } catch {
      Alert.alert('Sync Error', 'Failed to upload relayed reports.');
    }
    setSyncing(false);
  };

  // ─── Derived ────────────────────────────────────────────────────────
  const meta = STATUS_META[status] || STATUS_META.idle;

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-[#f8fafc]">

      {/* ── Header ────────────────────────────────────────────────── */}
      <View className="pt-14 pb-4 px-6 bg-white border-b border-slate-200 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Radio size={22} color="#258cf4" />
          <Text className="text-xl font-bold text-slate-800">Mesh Network</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{ false: '#e2e8f0', true: '#93c5fd' }}
          thumbColor={enabled ? '#2563eb' : '#f4f4f5'}
        />
      </View>

      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Hero Status Card ────────────────────────────────────── */}
        <View className="bg-white rounded-2xl border border-slate-200 p-6 mb-5 items-center">
          {/* Pulsing icon ring */}
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }],
              backgroundColor: meta.bg,
              borderRadius: 999,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <Radio size={44} color={meta.color} strokeWidth={1.8} />
          </Animated.View>

          {/* Status pill */}
          <View
            style={{ backgroundColor: meta.bg }}
            className="flex-row items-center gap-2 px-4 py-2 rounded-full mb-2"
          >
            <Circle size={8} color={meta.dot} fill={meta.dot} />
            <Text style={{ color: meta.color }} className="font-bold text-sm">
              {meta.label}
            </Text>
          </View>

          <Text className="text-slate-400 text-xs text-center mt-1 px-6">
            {enabled
              ? 'Your device is broadcasting and scanning for nearby ResQNet peers.'
              : 'Enable the mesh to relay reports via Bluetooth when offline.'}
          </Text>
        </View>

        {/* ── Stats Row ───────────────────────────────────────────── */}
        <View className="flex-row gap-3 mb-5">
          {/* Nearby Peers */}
          <View className="flex-1 bg-white rounded-xl border border-slate-200 p-4 items-center">
            <Users size={22} color="#3b82f6" />
            <Text className="text-2xl font-bold text-slate-800 mt-2">{peerCount}</Text>
            <Text className="text-[10px] text-slate-400 font-bold uppercase mt-1">Nearby Peers</Text>
          </View>

          {/* Outgoing */}
          <View className="flex-1 bg-white rounded-xl border border-slate-200 p-4 items-center">
            <Send size={22} color="#8b5cf6" />
            <Text className="text-2xl font-bold text-slate-800 mt-2">{outgoing.length}</Text>
            <Text className="text-[10px] text-slate-400 font-bold uppercase mt-1">Broadcasting</Text>
          </View>

          {/* Relayed Received */}
          <View className="flex-1 bg-white rounded-xl border border-slate-200 p-4 items-center">
            <Download size={22} color="#10b981" />
            <Text className="text-2xl font-bold text-slate-800 mt-2">{relayed.length}</Text>
            <Text className="text-[10px] text-slate-400 font-bold uppercase mt-1">Received</Text>
          </View>
        </View>

        {/* ── Network indicator ────────────────────────────────────── */}
        <View
          className={`flex-row items-center gap-2 p-3 rounded-xl mb-5 border ${
            isOnline
              ? 'bg-emerald-50 border-emerald-100'
              : 'bg-orange-50 border-orange-100'
          }`}
        >
          {isOnline
            ? <Wifi size={18} color="#10b981" />
            : <WifiOff size={18} color="#ea580c" />}
          <Text
            className={`text-sm font-bold ${isOnline ? 'text-emerald-700' : 'text-orange-700'}`}
          >
            {isOnline ? 'Network Available' : 'You Are Offline'}
          </Text>
          {isOnline && relayed.length > 0 && (
            <Text className="text-emerald-600 text-xs ml-auto">Ready to sync ↑</Text>
          )}
        </View>

        {/* ── Sync Button ─────────────────────────────────────────── */}
        {relayed.length > 0 && (
          <TouchableOpacity
            onPress={handleSync}
            disabled={syncing}
            className={`rounded-xl py-4 flex-row items-center justify-center gap-2 mb-5 ${
              isOnline ? 'bg-blue-600' : 'bg-slate-300'
            }`}
            activeOpacity={0.8}
          >
            {syncing ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <ArrowUpCircle size={20} color="white" />
                <Text className="text-white font-bold text-base">
                  Upload {relayed.length} Relayed Report{relayed.length !== 1 ? 's' : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* ── Relayed Reports List ────────────────────────────────── */}
        {relayed.length > 0 && (
          <>
            <Text className="font-bold text-slate-500 text-xs uppercase mb-2 ml-1">
              Received Reports
            </Text>
            {relayed.map((r, idx) => (
              <View
                key={r.id || idx}
                className="bg-white border border-slate-200 rounded-xl p-4 mb-2 flex-row items-center"
              >
                <View className="bg-emerald-50 p-2 rounded-full mr-3">
                  <Download size={16} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-slate-800 text-sm" numberOfLines={1}>
                    {r.type || 'Unknown'} — {r.details || 'No details'}
                  </Text>
                  <Text className="text-slate-400 text-xs mt-0.5">
                    From: {r.userEmail || r.user_email || 'peer'} • Relayed{' '}
                    {r.relayedAt ? new Date(r.relayedAt).toLocaleTimeString() : ''}
                  </Text>
                </View>
                <ChevronRight size={16} color="#cbd5e1" />
              </View>
            ))}
          </>
        )}

        {/* ── Empty State ─────────────────────────────────────────── */}
        {enabled && relayed.length === 0 && outgoing.length === 0 && (
          <View className="items-center py-8">
            <RefreshCw size={32} color="#cbd5e1" />
            <Text className="text-slate-400 font-bold mt-3">No Reports Yet</Text>
            <Text className="text-slate-300 text-xs text-center mt-1 px-12">
              Submit a report while offline and it will appear here for mesh broadcast.
              Reports from nearby peers will also show up.
            </Text>
          </View>
        )}

        {/* ── Disabled Empty State ────────────────────────────────── */}
        {!enabled && (
          <View className="items-center py-8">
            <Radio size={32} color="#e2e8f0" />
            <Text className="text-slate-300 font-bold mt-3">Mesh Disabled</Text>
            <Text className="text-slate-300 text-xs text-center mt-1 px-12">
              Toggle the switch above to start relaying emergency reports to nearby devices via Bluetooth.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
