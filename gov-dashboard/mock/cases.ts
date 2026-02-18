// mock/cases.ts
export type CaseItem = {
  id: string;
  title: string;
  status: "Open" | "In Progress" | "Closed";
  priority: "Low" | "Medium" | "High";
  reportedAt: string; // ISO
  location: string;
  assignedTo?: string;
  notes?: string;
};

export const casesData: CaseItem[] = [
  {
    id: "C-1001",
    title: "Flooding - Sector 5",
    status: "Open",
    priority: "High",
    reportedAt: "2025-12-10T09:30:00Z",
    location: "Sector 5",
    assignedTo: "Unit A",
    notes: "Water level rising near bridge.",
  },
  {
    id: "C-1002",
    title: "Collapsed wall - Ward 12",
    status: "In Progress",
    priority: "High",
    reportedAt: "2025-12-10T10:45:00Z",
    location: "Ward 12",
    assignedTo: "Unit B",
    notes: "Evacuation underway.",
  },
  {
    id: "C-1003",
    title: "Power outage - Block C",
    status: "Open",
    priority: "Medium",
    reportedAt: "2025-12-10T11:05:00Z",
    location: "Block C",
    assignedTo: "Utility Team",
  },
  {
    id: "C-1004",
    title: "Medical assistance required",
    status: "Closed",
    priority: "High",
    reportedAt: "2025-12-09T21:20:00Z",
    location: "Sector 2",
    assignedTo: "Medical Team",
  },
  {
    id: "C-1005",
    title: "Blocked road - Sector 7",
    status: "In Progress",
    priority: "Low",
    reportedAt: "2025-12-10T07:10:00Z",
    location: "Sector 7",
    assignedTo: "Public Works",
  },
  {
    id: "C-1006",
    title: "Water contamination report",
    status: "Open",
    priority: "Medium",
    reportedAt: "2025-12-08T14:00:00Z",
    location: "Ward 4",
  },
  {
    id: "C-1007",
    title: "Missing person report",
    status: "In Progress",
    priority: "High",
    reportedAt: "2025-12-10T02:30:00Z",
    location: "Block D",
    assignedTo: "Search Team",
  },
  {
    id: "C-1008",
    title: "Temporary shelter required",
    status: "Open",
    priority: "Medium",
    reportedAt: "2025-12-10T12:00:00Z",
    location: "Community Hall",
    notes: "Request for blankets and food packs.",
  },
];
