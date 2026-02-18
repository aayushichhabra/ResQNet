// components/CaseCard.tsx
"use client";
import React from "react";
import { CaseItem } from "../mock/cases";

export default function CaseCard({ c }: { c: CaseItem }) {
  const color =
    c.priority === "High" ? "bg-red-100 border-red-400" :
    c.priority === "Medium" ? "bg-yellow-100 border-yellow-400" :
    "bg-green-100 border-green-400";

  return (
    <div className={`border ${color} rounded p-3`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-gray-500">{c.id}</div>
          <h3 className="font-semibold text-lg">{c.title}</h3>
          <div className="text-sm text-gray-600">{c.location}</div>
        </div>
        <div className="text-right">
          <div className="text-sm">Status</div>
          <div className="font-medium">{c.status}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
        <div>Priority: <span className="font-medium">{c.priority}</span></div>
        <div>{new Date(c.reportedAt).toLocaleString()}</div>
      </div>

      {c.assignedTo && <div className="mt-2 text-sm">Assigned: {c.assignedTo}</div>}
      {c.notes && <div className="mt-1 text-sm text-gray-700">{c.notes}</div>}
    </div>
  );
}
