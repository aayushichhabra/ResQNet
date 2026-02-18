// mock/audit.ts
export type AuditLog = {
  id: string;
  timestamp: string; // ISO string
  user: string;
  role?: string;
  action: string;
  details?: string;
};

export const auditLogs: AuditLog[] = [
  { id: "a1", timestamp: "2025-12-11T09:12:00Z", user: "Inspector R. Kumar", role: "Police", action: "Viewed report", details: "Report #r-210 viewed" },
  { id: "a2", timestamp: "2025-12-11T09:20:12Z", user: "Dr. Mehta", role: "Medical", action: "Updated status", details: "Marked patient cluster as critical" },
  { id: "a3", timestamp: "2025-12-11T10:03:45Z", user: "Admin", role: "System", action: "Broadcast sent", details: "SMS to zone A/B/C" },
  { id: "a4", timestamp: "2025-12-11T11:00:00Z", user: "Officer Sharma", role: "Police", action: "Assigned resource", details: "Dispatched 2 ambulances to Sector 5" },
  { id: "a5", timestamp: "2025-12-11T11:15:33Z", user: "Analyst", role: "Data", action: "Downloaded CSV", details: "Export of last 24h reports" },
];
