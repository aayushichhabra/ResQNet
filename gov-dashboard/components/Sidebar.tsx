import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4 hidden md:block">
      <div className="mb-6 text-xl font-bold">ResQNet</div>
      <nav className="space-y-2 text-sm">
        <Link className="block px-3 py-2 rounded hover:bg-gray-100" href="/dashboard">Overview</Link>
        <Link className="block px-3 py-2 rounded hover:bg-gray-100" href="/cases">Cases</Link>
        <Link className="block px-3 py-2 rounded hover:bg-gray-100" href="/reports">Reports</Link>
        <Link className="block px-3 py-2 rounded hover:bg-gray-100" href="/broadcast">Broadcast</Link>
        <Link className="block px-3 py-2 rounded hover:bg-gray-100" href="/audit">Audit Trail</Link>
        <Link className="block px-3 py-2 rounded hover:bg-gray-100" href="/predictions">Predictions</Link>
      </nav>
    </aside>
  );
}