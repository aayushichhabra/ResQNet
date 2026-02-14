import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

// --- 1. FIX LEAFLET ICONS ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- COMPONENT: Move Map to User ---
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 13); }, [lat, lng, map]);
  return null;
}

function App() {
  const [activeTab, setActiveTab] = useState('incidents');
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...' }); 
  const [userLocation, setUserLocation] = useState({ lat: 26.9124, lng: 75.7873 });
  const [reports, setReports] = useState([]);

  // --- AI PREDICTION STATE (Object for multiple types) ---
  const [predictions, setPredictions] = useState({
    ambulances: 0,
    fire_vans: 0,
    volunteers: 0 
  });

  // --- MANUAL RESOURCES STATE ---
  const [manualResources, setManualResources] = useState([
    { id: 101, name: 'Dr. Sharma', type: 'Personnel', status: 'Busy' },
  ]);

  // --- FETCH DATA ---
  const loadDashboardData = async () => {
    try {
      // 1. Fetch Reports
      const repRes = await fetch('http://localhost:5001/api/reports');
      const repData = await repRes.json();

      // 🛡️ SAFETY CHECK: Only use data if it is a list!
      if (Array.isArray(repData)) {
        setReports(repData);
      } else {
        console.error("Backend Error (Reports):", repData);
        setReports([]); // Keep it empty so map doesn't crash
      }

      // 2. Fetch AI Multi-Resource Prediction
      const aiRes = await fetch('http://localhost:5001/api/ai-predict');
      const aiData = await aiRes.json();

      // Update state with the full object { ambulances: X, fire_vans: Y, volunteers: Z }
        setPredictions(aiData.predictions);

    } catch (err) { console.error("Data Load Error", err); }
  };

  // --- INITIAL LOAD ---
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setUserLocation({ lat, lng });

          // Fetch Weather
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=7409e2e44f3d9bb3e711968df1a9c462`)
          .then(res => res.json())
          .then(data => setWeather({ temp: `${Math.round(data.main.temp)}°C`, condition: data.weather[0].main }));

          // Load App Data
          loadDashboardData();
      }, () => alert("Location access denied."));
    }
  }, []);

  // --- HANDLERS ---
  const handleStatusChange = async (id, newStatus) => {
    // Optimistic Update
    setReports(
      reports.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
    );

    try {
      await fetch(`http://localhost:5001/api/reports/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setTimeout(loadDashboardData, 500); // Refresh AI after update
      alert(`✅ Status updated to ${newStatus}`);
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const handleAddResource = () => {
    const newId = manualResources.length + 200;
    const newRes = { id: newId, name: `New Volunteer #${manualResources.length + 1}`, type: 'Personnel', status: 'Available' };
    setManualResources([...manualResources, newRes]);
  };

  const getStatusColor = (status) => {
      switch(status) {
        case 'Pending': return '#d32f2f';
        case 'Active': return '#f57c00';
        case 'Resolved': return '#388e3c';
        default: return 'grey';
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '400px', background: '#f8f9fa', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
        
        {/* HEADER */}
        <div style={{ padding: '20px', background: '#fff', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ color: '#d32f2f', margin: 0 }}>ResQNet AI</h2>
          <button onClick={loadDashboardData} style={{ padding: '5px 10px', cursor: 'pointer' }}>🔄 Refresh</button>
        </div>

        {/* WEATHER */}
        <div style={{ background: '#263238', color: 'white', padding: '15px' }}>
          <span>📍 Local Forecast: </span><strong>{weather.temp} ({weather.condition})</strong>
        </div>

        {/* 🤖 LIVE AI WIDGET (3 COLUMNS) */}
        <div style={{ padding: '15px', background: '#e3f2fd', borderBottom: '1px solid #90caf9' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>🤖 Live AI Predictions</h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px', textAlign: 'center' }}>
            {/* AMBULANCES */}
            <div style={{ background: 'white', padding: '10px', borderRadius: '4px' }}>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#d32f2f' }}>{predictions.ambulances}</div>
              <div style={{ fontSize: '0.7em', color: '#666' }}>Ambulances</div>
            </div>
            {/* FIRE VANS */}
            <div style={{ background: 'white', padding: '10px', borderRadius: '4px' }}>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#e65100' }}>{predictions.fire_vans}</div>
              <div style={{ fontSize: '0.7em', color: '#666' }}>Fire Vans</div>
            </div>
            {/* VOLUNTEERS */}
            <div style={{ background: 'white', padding: '10px', borderRadius: '4px' }}>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#1565c0' }}>{predictions.volunteers}</div>
              <div style={{ fontSize: '0.7em', color: '#666' }}>Vol Groups</div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #ccc' }}>
          <button onClick={() => setActiveTab('incidents')} style={{ flex: 1, padding: '15px', border: 'none', fontWeight: 'bold', borderBottom: activeTab === 'incidents' ? '3px solid #1976d2' : 'none' }}>🚨 Incidents</button>
          <button onClick={() => setActiveTab('resources')} style={{ flex: 1, padding: '15px', border: 'none', fontWeight: 'bold', borderBottom: activeTab === 'resources' ? '3px solid #1976d2' : 'none' }}>📦 Resources</button>
        </div>

        {/* CONTENT AREA */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f4f6f8' }}>
          
          {/* TAB 1: INCIDENTS */}
          {activeTab === 'incidents' && reports.map((r) => (
            <div key={r.id} style={{ marginBottom: '15px', padding: '15px', background: 'white', borderRadius: '8px', borderLeft: `5px solid ${getStatusColor(r.status)}` }}>
              <strong>{r.type}</strong> <span style={{fontSize:'0.8em', background:'#eee', padding:'2px 5px'}}>{r.status}</span>
              <p style={{ fontSize: '0.9em', color: '#666' }}>{r.description || 'No details'}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {r.status === 'Pending' && <button onClick={() => handleStatusChange(r.id, 'Active')} style={{ flex:1, background: '#1976d2', color: 'white', border: 'none', padding: '8px', cursor: 'pointer' }}>Dispatch Team</button>}
                {r.status === 'Active' && <button onClick={() => handleStatusChange(r.id, 'Resolved')} style={{ flex:1, background: '#388e3c', color: 'white', border: 'none', padding: '8px', cursor: 'pointer' }}>Mark Resolved</button>}
                </div>
              </div>
            ))}

          {/* TAB 2: RESOURCES */}
          {activeTab === "resources" && (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', marginBottom: '15px' }}>
                <thead style={{ background: '#eceff1' }}>
                  <tr><th style={{ padding: '10px', textAlign: 'left' }}>Asset</th><th style={{ padding: '10px', textAlign: 'left' }}>Status</th></tr>
                </thead>
                <tbody>
                  {/* 1. AUTO AMBULANCES */}
                  {[...Array(predictions.ambulances)].map((_, i) => (
                    <tr key={`amb-${i}`} style={{ borderBottom: '1px solid #eee', background: '#ffebee' }}>
                      <td style={{ padding: '10px' }}><strong>🚑 AI Ambulance #{i+1}</strong><br/><span style={{fontSize:'0.8em', color:'green'}}>Auto-Dispatched</span></td>
                      <td style={{ padding: '10px', color:'green', fontWeight:'bold' }}>En Route</td>
                    </tr>
                  ))}

                  {/* 2. AUTO FIRE VANS */}
                  {[...Array(predictions.fire_vans)].map((_, i) => (
                    <tr key={`fire-${i}`} style={{ borderBottom: '1px solid #eee', background: '#fff3e0' }}>
                      <td style={{ padding: '10px' }}><strong>🚒 AI Fire Van #{i+1}</strong><br/><span style={{fontSize:'0.8em', color:'#e65100'}}>Fire Alert</span></td>
                      <td style={{ padding: '10px', color:'#e65100', fontWeight:'bold' }}>Dispatched</td>
                    </tr>
                  ))}

                  {/* 3. AUTO VOLUNTEERS */}
                  {[...Array(predictions.volunteers)].map((_, i) => (
                    <tr
                      key={`vol-${i}`}
                      style={{
                        borderBottom: "1px solid #eee",
                        background: "#e3f2fd",
                      }}
                    >
                      <td style={{ padding: "10px" }}>
                        <strong>👥 AI Support Group #{i + 1}</strong>
                        <br />
                        <span style={{ fontSize: "0.8em", color: "#1565c0" }}>
                          Crowd Control
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          color: "#1565c0",
                          fontWeight: "bold",
                        }}
                      >
                        Active
                      </td>
                    </tr>
                  ))}

                  {/* 4. MANUAL RESOURCES */}
                  {manualResources.map(res => (
                    <tr key={res.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}><strong>{res.name}</strong><br/><span style={{ fontSize: '0.8em', color: '#888' }}>{res.type}</span></td>
                      <td style={{ padding: '10px' }}><span style={{ color: res.status === 'Available' ? 'green' : 'orange', fontWeight: 'bold' }}>{res.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={handleAddResource}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#546e7a",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                + Add Manual Resource
              </button>
            </>
          )}
        </div>
      </div>

      {/* MAP */}
      <div style={{ flex: 1 }}>
        <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />
          <Marker position={[userLocation.lat, userLocation.lng]}><Popup>HQ</Popup></Marker>
          {reports.map((r) => r.lat && <Marker key={r.id} position={[r.lat, r.lng]}><Popup>{r.type}</Popup></Marker>)}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;
