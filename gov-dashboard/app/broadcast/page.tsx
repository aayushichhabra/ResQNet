"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

export default function BroadcastPage() {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [alertHistory, setAlertHistory] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      // Fetch unique emails from reports table
      const { data: reports } = await supabase.from('reports').select('user_email');
      if (reports) {
        const emailList = Array.from(new Set(reports.map(r => r.user_email).filter(Boolean)));
        setRecipients(emailList as string[]);
      }

      // Fetch existing Alert History from database
      const { data: alerts } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });
      if (alerts) setAlertHistory(alerts);
    }
    fetchData();
  }, []);

  const handleSend = async () => {
    if (!message) return;
    setSending(true);

    // Save alert details to Supabase
    const { error } = await supabase.from('alerts').insert([
      { 
        message: message, 
        recipient_count: recipients.length,
        title: "Emergency Update", 
        level: "High" 
      }
    ]);

    if (!error) {
      alert("Alert saved!");
      setMessage("");
      // Refresh local history list
      const { data } = await supabase.from('alerts').select('*').order('created_at', { ascending: false });
      if (data) setAlertHistory(data);
    }
    setSending(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* THE SEND BOX */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Send Alert to Citizens</h2>
        <div className="mb-4 text-sm text-gray-500">
          Potential Recipients: {recipients.length}
        </div>
        <textarea 
          className="w-full p-2 border rounded h-32 mb-4" 
          placeholder="Type emergency update here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button 
          onClick={handleSend} 
          disabled={sending || !message}
          className="bg-red-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
        >
          {sending ? "Sending..." : "Broadcast Alert"}
        </button>
      </div>

      {/* THE HISTORY SECTION */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Broadcast History</h2>
        <div className="space-y-4">
          {alertHistory.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No past alerts found.</p>
          ) : (
            alertHistory.map((alert) => (
              <div key={alert.id} className="border-l-4 border-red-600 bg-gray-50 p-3 rounded">
                <p className="font-medium text-gray-800">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Sent on {new Date(alert.created_at).toLocaleString()} to {alert.recipient_count} people
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}