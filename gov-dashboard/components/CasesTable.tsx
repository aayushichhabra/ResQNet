// components/CasesTable.tsx
"use client";
import React, { useMemo, useState } from "react";
import { CaseItem } from "../mock/cases";

export default function CasesTable({ cases }: { cases: CaseItem[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "Open" | "In Progress" | "Closed">("");
  const [priorityFilter, setPriorityFilter] = useState<"" | "Low" | "Medium" | "High">("");

  const filtered = useMemo(() => {
    return cases.filter(c => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (priorityFilter && c.priority !== priorityFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        (c.assignedTo || "").toLowerCase().includes(q)
      );
    });
  }, [cases, query, statusFilter, priorityFilter]);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by id, title, location or assigned..."
          className="flex-1 border p-2 rounded"
        />
        <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value as any)} className="border p-2 rounded">
          <option value="">All status</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Closed</option>
        </select>
        <select value={priorityFilter} onChange={(e)=>setPriorityFilter(e.target.value as any)} className="border p-2 rounded">
          <option value="">All priority</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="text-left text-sm text-gray-600 border-b">
              <th className="py-2">ID</th>
              <th className="py-2">Title</th>
              <th className="py-2">Location</th>
              <th className="py-2">Status</th>
              <th className="py-2">Priority</th>
              <th className="py-2">Assigned</th>
              <th className="py-2">Reported</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="py-2">{c.id}</td>
                <td className="py-2">{c.title}</td>
                <td className="py-2">{c.location}</td>
                <td className="py-2">{c.status}</td>
                <td className="py-2">{c.priority}</td>
                <td className="py-2">{c.assignedTo || "-"}</td>
                <td className="py-2">{new Date(c.reportedAt).toLocaleString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-gray-500">No cases match your filters</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
