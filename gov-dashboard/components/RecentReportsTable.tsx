// components/RecentReportsTable.tsx
"use client";
import React from "react";

type R = { id: string; title: string; status: string; priority: string; date: string; location: string };

export default function RecentReportsTable({ rows }: { rows: R[] }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="text-sm text-gray-500 mb-2">Recent reports</div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="text-left text-sm text-gray-600 border-b">
              <th className="py-2">ID</th>
              <th className="py-2">Title</th>
              <th className="py-2">Location</th>
              <th className="py-2">Priority</th>
              <th className="py-2">Status</th>
              <th className="py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="py-2 font-mono text-sm">{r.id}</td>
                <td className="py-2">{r.title}</td>
                <td className="py-2">{r.location}</td>
                <td className="py-2">{r.priority}</td>
                <td className="py-2">{r.status}</td>
                <td className="py-2">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
