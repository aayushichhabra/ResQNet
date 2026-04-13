/**
 * meshService.js — BLE Mesh Networking Service for ResQNet
 *
 * Enables peer-to-peer relay of disaster reports between nearby phones
 * using Bluetooth Low Energy when there is zero network connectivity.
 *
 * Architecture:
 *  - Each device scans for nearby ResQNet peers via a custom service UUID
 *  - On discovery, connects and exchanges pending reports via GATT characteristic read/write
 *  - Received (relayed) reports are stored locally and uploaded once any device regains network
 *  - Deduplication ensures a report relayed through multiple paths appears only once
 */

import { BleManager } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform, PermissionsAndroid } from 'react-native';
import { supabase } from './supabaseConfig';

// ─── Custom UUIDs ───────────────────────────────────────────────────
const RESQNET_SERVICE_UUID   = '0000ff01-0000-1000-8000-00805f9b34fb';
const REPORT_CHAR_UUID       = '0000ff02-0000-1000-8000-00805f9b34fb';

// ─── Storage Keys ───────────────────────────────────────────────────
const RELAYED_REPORTS_KEY    = '@mesh_relayed_reports';
const OUTGOING_REPORTS_KEY   = '@mesh_outgoing_reports';
const SEEN_IDS_KEY           = '@mesh_seen_ids';

// ─── Constants ──────────────────────────────────────────────────────
const MAX_CHUNK_BYTES        = 480;          // stay under 512 MTU
const SCAN_DURATION_MS       = 15_000;       // 15 s per scan cycle
const SCAN_COOLDOWN_MS       = 5_000;        // pause between scan cycles
const PEER_EXPIRY_MS         = 60_000;       // drop peer after 60 s unseen

// ─── Singleton State ────────────────────────────────────────────────
let manager          = null;
let scanning         = false;
let advertising      = false;
let meshActive       = false;
let scanCycleTimer   = null;
let peerCleanupTimer = null;

/** Map<deviceId, { id, name, rssi, lastSeen }> */
const discoveredPeers = new Map();

/** Set<reportId> — IDs we have already seen (own + relayed) */
let seenIds = new Set();

/** Listeners: Array<(event) => void> */
const listeners = [];

// ─────────────────────────────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────────────────────────────

/**
 * Initialise BLE manager (idempotent).  Call early in the app lifecycle.
 */
export function initMesh() {
  if (!manager) {
    manager = new BleManager();
  }
  return manager;
}

/**
 * Start the mesh network (scanning + advertising).
 * Resolves `true` when the mesh is running.
 */
export async function startMesh() {
  if (meshActive) return true;

  initMesh();

  const ok = await requestPermissions();
  if (!ok) return false;

  // Hydrate the dedup set
  await _hydrateSeenIds();

  meshActive = true;
  _emitEvent({ type: 'status', status: 'starting' });

  await startScanning();
  startAdvertising(); // no-op in central-only builds; placeholder for native GATT server

  // Periodic stale-peer cleanup
  peerCleanupTimer = setInterval(_pruneExpiredPeers, PEER_EXPIRY_MS / 2);

  _emitEvent({ type: 'status', status: 'active' });
  return true;
}

/**
 * Stop the mesh network gracefully.
 */
export function stopMesh() {
  meshActive = false;
  stopScanning();
  stopAdvertising();

  if (peerCleanupTimer) clearInterval(peerCleanupTimer);
  if (scanCycleTimer)   clearTimeout(scanCycleTimer);

  discoveredPeers.clear();
  _emitEvent({ type: 'peers', count: 0 });
  _emitEvent({ type: 'status', status: 'idle' });
}

/**
 * Queue a report for BLE broadcast to nearby peers.
 */
export async function broadcastReport(report) {
  if (!report?.id) return;

  // Mark as seen so we don't re-relay our own report
  seenIds.add(report.id);
  await _persistSeenIds();

  // Add to outgoing queue
  const queue = await _getOutgoingReports();
  if (queue.find(r => r.id === report.id)) return;   // already queued
  queue.push(report);
  await AsyncStorage.setItem(OUTGOING_REPORTS_KEY, JSON.stringify(queue));

  _emitEvent({ type: 'outgoing', count: queue.length });
}

/**
 * Return all relayed reports stored on this device.
 */
export async function getRelayedReports() {
  try {
    const raw = await AsyncStorage.getItem(RELAYED_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Return all outgoing (pending broadcast) reports.
 */
export async function getOutgoingReports() {
  return _getOutgoingReports();
}

/**
 * Upload all relayed reports to Supabase (when network returns).
 * Returns { uploaded: number, failed: number }.
 */
export async function syncRelayedReports() {
  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    return { uploaded: 0, failed: 0, offline: true };
  }

  const reports = await getRelayedReports();
  if (!reports.length) return { uploaded: 0, failed: 0 };

  let uploaded = 0;
  const remaining = [];

  for (const report of reports) {
    try {
      const { error } = await supabase.from('reports').insert({
        details:    report.details || 'Mesh-relayed report',
        type:       report.type || 'Unknown',
        latitude:   report.latitude || report.coords?.latitude || 0,
        longitude:  report.longitude || report.coords?.longitude || 0,
        user_email: report.userEmail || report.user_email || 'mesh-relay',
        status:     'Pending',
        created_at: report.created_at || new Date().toISOString(),
      });
      if (error) throw error;
      uploaded++;
    } catch {
      remaining.push(report);
    }
  }

  await AsyncStorage.setItem(RELAYED_REPORTS_KEY, JSON.stringify(remaining));
  _emitEvent({ type: 'relayed', count: remaining.length });

  return { uploaded, failed: remaining.length };
}

/**
 * Get current number of visible peers.
 */
export function getPeerCount() {
  return discoveredPeers.size;
}

/**
 * Get current mesh status.
 */
export function getMeshStatus() {
  if (!meshActive)  return 'idle';
  if (scanning)     return 'scanning';
  if (advertising)  return 'broadcasting';
  return 'active';
}

/**
 * Subscribe to mesh events.  Returns an unsubscribe function.
 * Events: { type: 'status'|'peers'|'relayed'|'outgoing'|'error', ... }
 */
export function addMeshListener(fn) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

/**
 * Whether mesh is currently active.
 */
export function isMeshActive() {
  return meshActive;
}

// ─────────────────────────────────────────────────────────────────────
//  BLE Scanning (Central)
// ─────────────────────────────────────────────────────────────────────

async function startScanning() {
  if (scanning || !meshActive) return;
  scanning = true;
  _emitEvent({ type: 'status', status: 'scanning' });

  try {
    manager.startDeviceScan(
      [RESQNET_SERVICE_UUID],
      { allowDuplicates: true },
      async (error, device) => {
        if (error) {
          console.warn('[Mesh] Scan error:', error.message);
          _emitEvent({ type: 'error', message: error.message });
          return;
        }

        if (!device) return;

        // Track peer
        const isNew = !discoveredPeers.has(device.id);
        discoveredPeers.set(device.id, {
          id:       device.id,
          name:     device.localName || device.name || 'ResQNet Peer',
          rssi:     device.rssi,
          lastSeen: Date.now(),
        });

        if (isNew) {
          _emitEvent({ type: 'peers', count: discoveredPeers.size });
          // Attempt to exchange reports with this new peer
          _exchangeReports(device).catch(() => {});
        }
      },
    );
  } catch (e) {
    console.warn('[Mesh] Failed to start scan:', e);
    scanning = false;
  }

  // Auto-stop after SCAN_DURATION then restart after cooldown
  scanCycleTimer = setTimeout(() => {
    stopScanning();
    if (meshActive) {
      scanCycleTimer = setTimeout(() => startScanning(), SCAN_COOLDOWN_MS);
    }
  }, SCAN_DURATION_MS);
}

function stopScanning() {
  if (!scanning) return;
  try {
    manager?.stopDeviceScan();
  } catch { /* noop */ }
  scanning = false;
}

// ─────────────────────────────────────────────────────────────────────
//  BLE Advertising (Peripheral) — stub / future native module
// ─────────────────────────────────────────────────────────────────────

function startAdvertising() {
  // react-native-ble-plx v3 does not expose a JS-side GATT server API.
  // On an Expo dev build the native plugin registers the service UUID so
  // the device IS discoverable by other ResQNet scanners.  Full GATT
  // read/write handling would require a thin native module or a library
  // like react-native-ble-peripheral.  For now the data exchange is
  // handled via the central-mode connection in _exchangeReports().
  advertising = true;
}

function stopAdvertising() {
  advertising = false;
}

// ─────────────────────────────────────────────────────────────────────
//  Report Exchange  (connect → read → write → disconnect)
// ─────────────────────────────────────────────────────────────────────

async function _exchangeReports(device) {
  let connected = null;
  try {
    // Connect
    connected = await device.connect({ timeout: 10_000 });
    await connected.discoverAllServicesAndCharacteristics();

    // ── READ remote reports ─────────────────────────────────────────
    try {
      const char = await connected.readCharacteristicForService(
        RESQNET_SERVICE_UUID,
        REPORT_CHAR_UUID,
      );
      if (char?.value) {
        const decoded = _base64Decode(char.value);
        const reports = JSON.parse(decoded);
        await _ingestRelayedReports(Array.isArray(reports) ? reports : [reports]);
      }
    } catch {
      // Peer may not have the characteristic exposed yet — that's OK
    }

    // ── WRITE our outgoing reports to remote ────────────────────────
    try {
      const outgoing = await _getOutgoingReports();
      if (outgoing.length) {
        const payload = JSON.stringify(outgoing);
        const chunks  = _chunkString(payload, MAX_CHUNK_BYTES);
        for (const chunk of chunks) {
          await connected.writeCharacteristicWithResponseForService(
            RESQNET_SERVICE_UUID,
            REPORT_CHAR_UUID,
            _base64Encode(chunk),
          );
        }
      }
    } catch {
      // Write may fail if peer's GATT server is read-only — acceptable
    }
  } catch (e) {
    // Connection failures are expected (out of range, etc.)
    console.log('[Mesh] Exchange failed:', e?.message);
  } finally {
    try {
      if (connected) await connected.cancelConnection();
    } catch { /* noop */ }
  }
}

// ─────────────────────────────────────────────────────────────────────
//  Relayed Report Ingestion & Dedup
// ─────────────────────────────────────────────────────────────────────

async function _ingestRelayedReports(reports) {
  if (!reports.length) return;

  const existing = await getRelayedReports();
  let added = 0;

  for (const r of reports) {
    if (!r.id) continue;
    if (seenIds.has(r.id)) continue;   // already seen

    seenIds.add(r.id);
    existing.push({ ...r, relayedAt: new Date().toISOString() });
    added++;
  }

  if (added > 0) {
    await AsyncStorage.setItem(RELAYED_REPORTS_KEY, JSON.stringify(existing));
    await _persistSeenIds();
    _emitEvent({ type: 'relayed', count: existing.length });
  }
}

// ─────────────────────────────────────────────────────────────────────
//  Permissions
// ─────────────────────────────────────────────────────────────────────

async function requestPermissions() {
  if (Platform.OS === 'ios') {
    // iOS permissions are handled via Info.plist; BLE available after user prompt
    const state = await manager.state();
    if (state === 'PoweredOn') return true;

    // Wait for BLE to power on (user may need to enable Bluetooth)
    return new Promise(resolve => {
      const sub = manager.onStateChange(newState => {
        if (newState === 'PoweredOn') {
          sub.remove();
          resolve(true);
        }
      }, true);

      // Timeout after 10s
      setTimeout(() => { sub.remove(); resolve(false); }, 10_000);
    });
  }

  if (Platform.OS === 'android') {
    try {
      const apiLevel = Platform.Version;
      if (apiLevel >= 31) {
        // Android 12+
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(results).every(
          v => v === PermissionsAndroid.RESULTS.GRANTED,
        );
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch {
      return false;
    }
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────

function _emitEvent(event) {
  for (const fn of listeners) {
    try { fn(event); } catch { /* ignore listener errors */ }
  }
}

async function _getOutgoingReports() {
  try {
    const raw = await AsyncStorage.getItem(OUTGOING_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function _hydrateSeenIds() {
  try {
    const raw = await AsyncStorage.getItem(SEEN_IDS_KEY);
    seenIds = raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    seenIds = new Set();
  }
}

async function _persistSeenIds() {
  try {
    await AsyncStorage.setItem(SEEN_IDS_KEY, JSON.stringify([...seenIds]));
  } catch { /* noop */ }
}

function _pruneExpiredPeers() {
  const now = Date.now();
  let changed = false;
  for (const [id, peer] of discoveredPeers) {
    if (now - peer.lastSeen > PEER_EXPIRY_MS) {
      discoveredPeers.delete(id);
      changed = true;
    }
  }
  if (changed) {
    _emitEvent({ type: 'peers', count: discoveredPeers.size });
  }
}

function _chunkString(str, size) {
  const chunks = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.substring(i, i + size));
  }
  return chunks;
}

// Minimal Base64 helpers (RN ships atob/btoa in Hermes)
function _base64Encode(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return btoa(str);
  }
}

function _base64Decode(b64) {
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return atob(b64);
  }
}
