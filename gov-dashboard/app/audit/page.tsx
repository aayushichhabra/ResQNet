"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAuditLogs() {
      // 1. Fetching recent reports from Supabase
      const { data, error } = await supabase
        .from('reports')
        .select('id, type, details, created_at, user_email')
        .order('created_at', { ascending: false });

      if (data) setLogs(data);
    }
    fetchAuditLogs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">System Audit Trail</h1>
      
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User/Reporter</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action/Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">
                  No activity logs found in database.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800 uppercase">
                      {log.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {log.user_email || "System/Anonymous"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}