// components/PredictionCard.tsx
export default function PredictionCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white shadow rounded p-4 border">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-2xl text-blue-600 font-bold">{value}</p>
    </div>
  );
}
