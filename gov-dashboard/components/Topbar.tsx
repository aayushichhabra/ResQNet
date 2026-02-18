// components/Topbar.tsx
export default function Topbar({ title }: { title?: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
      <div className="text-lg font-semibold">{title ?? "Dashboard"}</div>
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600">Gov User</div>
      </div>
    </div>
  );
}
