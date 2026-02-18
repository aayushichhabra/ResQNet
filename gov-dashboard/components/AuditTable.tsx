// components/AuditTable.tsx
"use client";
import React, { useMemo, useState } from "react";
import type { AuditLog } from "../mock/audit";

export default function AuditTable({ rows }: { rows: AuditLog[] }) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const roles = useMemo(
    () => ["all", ...Array.from(new Set(rows.map((r) => r.role ?? "Unknown")))],
    [rows]
  );

  const filtered = rows.filter((r) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      r.user.toLowerCase().includes(q) ||
      (r.action || "").toLowerCase().includes(q) ||
      (r.details || "").toLowerCase().includes(q);

    const matchesRole = roleFilter === "all" || (r.role ?? "Unknown") === roleFilter;
    return matchesQuery && matchesRole;
  });

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <input
          className="border p-2 rounded flex-1"
          placeholder="Search by user, action, details..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="border p-2 rounded" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-sm">Time</th>
              <th className="p-3 text-sm">User</th>
              <th className="p-3 text-sm">Role</th>
              <th className="p-3 text-sm">Action</th>
              <th className="p-3 text-sm">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-sm text-gray-500">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 text-sm">{new Date(r.timestamp).toLocaleString()}</td>
                  <td className="p-3 text-sm">{r.user}</td>
                  <td className="p-3 text-sm">{r.role ?? "Unknown"}</td>
                  <td className="p-3 text-sm">{r.action}</td>
                  <td className="p-3 text-sm text-gray-600">{r.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
