// mock/reports.ts
export const reportsTrend = [
  { name: "2025-11-25", value: 12 },
  { name: "2025-11-26", value: 18 },
  { name: "2025-11-27", value: 10 },
  { name: "2025-11-28", value: 24 },
  { name: "2025-11-29", value: 30 },
  { name: "2025-11-30", value: 22 },
  { name: "2025-12-01", value: 34 },
  { name: "2025-12-02", value: 28 },
  { name: "2025-12-03", value: 31 },
  { name: "2025-12-04", value: 29 },
  { name: "2025-12-05", value: 35 },
  { name: "2025-12-06", value: 40 },
  { name: "2025-12-07", value: 38 },
  { name: "2025-12-08", value: 45 },
];

export const reportsByStatus = [
  { name: "Open", value: 24 },
  { name: "In Progress", value: 18 },
  { name: "Closed", value: 52 },
];

export const recentReports = [
  { id: "R-501", title: "Flood near Bridge A", status: "Open", priority: "High", date: "2025-12-10", location: "Sector 5" },
  { id: "R-502", title: "Collapsed wall", status: "In Progress", priority: "High", date: "2025-12-10", location: "Ward 12" },
  { id: "R-503", title: "Power outage", status: "Open", priority: "Medium", date: "2025-12-09", location: "Block C" },
  { id: "R-504", title: "Water contamination", status: "Closed", priority: "High", date: "2025-12-08", location: "Ward 4" },
  { id: "R-505", title: "Temporary shelter requested", status: "Open", priority: "Medium", date: "2025-12-07", location: "Community Hall" },
];
