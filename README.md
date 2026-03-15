# 🚨 ResQNet – Offline-First Disaster Response Platform

> **Turning Logistical Paralysis into Proactive Rescue**

ResQNet is an **offline-first disaster response coordination platform** designed to eliminate rescue delays during emergencies. By connecting citizens, NGOs, and government authorities on a unified ecosystem, ResQNet ensures faster, more efficient, and data-driven disaster response—even during total communication blackouts.

---

## 🛑 The Challenge

During critical emergencies (floods, earthquakes, cyclones), the **Golden Hour (first 60 minutes)** is vital for saving lives. However, rescue operations are frequently delayed due to structural breakdowns:
- Cellular network and internet collapse.
- Power grid failures.
- Lack of real-time, last-mile victim tracking.

Existing systems heavily rely on stable internet connections and primarily focus on one-way alerts. When the infrastructure fails, victims enter a "blackout phase" and become digitally invisible. Between 2014 and 2024, India lost over ₹4.3 trillion due to disasters, highlighting the urgent need for a resilient coordination system.

## 💡 The Solution

ResQNet bridges the communication gap by enabling offline SOS reporting, bilateral communication, and real-time incident visibility. We ensure that **a disaster victim never becomes digitally invisible.** The ecosystem operates across three interconnected layers:

1. **📱 Citizen App:** Enables victims to report emergencies and share coordinates, storing data locally during blackouts and transmitting the moment connectivity returns.
2. **🏥 NGO Dashboard:** Acts as a decision center for rescue teams, utilizing live SOS monitoring, interactive geospatial maps, and victim clustering to prioritize deployments.
3. **🏛️ Government Dashboard:** Allows authorities to monitor high-level disaster trends, track affected populations, and optimize emergency resource allocation.

---

## ⚙️ Core Architecture

    📱 Citizen App (React Native / Expo)
            │
            ▼
    🌐 Backend API (Node.js + Express + Socket.IO)
            │
            ▼
    🗄️ Cloud Database (Supabase / PostgreSQL)
            │
            ▼
    💻 Dashboards (React + Vite + Leaflet Maps)

---

## ✨ Key Features

### Citizen Mobile Application
- **One-Tap SOS:** Instant distress signaling with automatic GPS location capture.
- **Offline-First Capabilities:** Data is stored locally during network outages and synced automatically when a connection is established.
- **Incident Categorization:** Specify the emergency type (e.g., flood, fire, landslide) for appropriate resource allocation.

### NGO Rescue Dashboard
- **Live Visualization:** Real-time distress signals mapped via OpenStreetMap and React Leaflet.
- **Incident Clustering:** Groups nearby SOS signals to identify high-danger zones and prioritize rescue operations.
- **Resource Prediction:** AI-assisted recommendations for deploying ambulances, boats, or fire units.

### Government Monitoring Dashboard
- **Strategic Overview:** Live analytics on disaster trends and affected regions.
- **Alert Broadcasting:** Push emergency advisories directly to the Citizen App.
- **Resource Management:** Monitor and allocate high-level rescue resources efficiently.

---

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend (Dashboards)** | React, Vite, React Leaflet, OpenStreetMap |
| **Frontend (Mobile)** | React Native, Expo |
| **Backend** | Node.js, Express.js, Socket.IO (Real-time updates) |
| **Database** | PostgreSQL, Supabase |
| **Tools & Control** | Git, GitHub, npm |

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### 1. Clone the Repository
    git clone https://github.com/YOUR_USERNAME/ResQNet.git
    cd ResQNet

### 2. Backend Setup
    cd resqnet-backend
    npm install
    node index.js

* The backend will run at: `http://localhost:5001`
* Test the database connection at: `http://localhost:5001/test-db`

### 3. NGO Dashboard Setup
    cd ../resqnet-ngo-dashboard
    npm install
    npm run dev

* Open your browser and navigate to: `http://localhost:5173`

### 4. Citizen App Setup
    cd ../citizen-app
    npm install
    npx expo start

* Run the app using the **Expo Go** mobile app, an Android Emulator, or an iOS Simulator.

*(Note: You will need to configure your `.env` files with your Supabase credentials before running the application.)*

---

## 📈 Status & Roadmap

**Current Achievements:**
- [x] Citizen mobile application built and tested.
- [x] NGO operational dashboard completed.
- [x] Government monitoring dashboard completed.

**Next Steps:**
- [ ] Implement real-time deployment with a live disaster simulation.

---

## 👥 Meet the Team

Developed collaboratively by:
* Aayushi Chhabra
* Ashi Bansal   
* Smarya Narang  
* Rhea Ahuja
* Navya Khanna   
* Priyal Kansal  

---

## 📚 References

* [NCRB – Accidental Deaths & Suicides in India (ADSI Report 2022)](https://ncrb.gov.in/)
* [UN Office for Disaster Risk Reduction (UNDRR)](https://www.undrr.org/)
* [NDMA / NDEM Disaster Response Systems](https://ndma.gov.in/)
* OpenStreetMap & PostGIS Documentation

---

*This project was developed as part of a Capstone / Project-Based Learning (PBL) academic curriculum.*
