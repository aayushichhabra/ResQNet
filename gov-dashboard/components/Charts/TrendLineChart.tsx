"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function TrendLineChart({ data }: { data: any[] }) {
  return (
    <div className="bg-white p-4 shadow rounded border">
      <h3 className="font-semibold mb-3">Predicted Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#2563eb" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
