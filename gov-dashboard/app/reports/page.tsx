"use client"; 

import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase"; 
import SummaryCard from "../../components/SummaryCard";
import ReportsLineChart from "../../components/Charts/ReportsLineChart";
import StatusDonut from "../../components/Charts/StatusDonut";
import RecentReportsTable from "../../components/RecentReportsTable";

// Mock data remains for the visual charts 
import { reportsTrend, reportsByStatus } from "../../mock/reports";

export default function ReportsPage() {
  const [dbReports, setDbReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      // 1. Fetching live reports from Supabase 
      const { data, error } = await supabase
        .from('reports') 
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase Error:", error.message);
      } else if (data) {
        // 2. Transforming DB rows for the UI components 
        const formattedData = data.map((report: any) => ({
          id: report.id.slice(0, 8), 
          title: report.details || "No Details Provided", 
          priority: "Medium", 
          status: report.type || "General", 
          email: report.user_email
        }));
        setDbReports(formattedData);
      }
      setLoading(false);
    }

    fetchReports();
  }, []);

  // 3. Dynamic logic based on live database state 
  const total = dbReports.length;
  const critical = dbReports.filter(r => r.priority === "High").length;
  const uniqueUsers = new Set(dbReports.map(r => r.email)).size;

  if (loading) return <div className="text-gray-500 italic">Connecting to Government Database...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Reports & Analytics</h1>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Total Reports" value={String(total)} />
        <SummaryCard title="Recent Type" value={dbReports[0]?.status || "N/A"} />
        <SummaryCard title="Active Users" value={String(uniqueUsers)} />
        <SummaryCard title="Critical" value={String(critical)} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <ReportsLineChart data={reportsTrend} />
        </div>
        <div>
          <StatusDonut data={reportsByStatus} />
        </div>
      </div>

      {/* Detailed Reports Table */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold mb-4">Detailed Incident Log</h2>
        <RecentReportsTable rows={dbReports} />
      </div>
    </div>
  );
}