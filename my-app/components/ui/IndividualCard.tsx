interface IndividualCardProps {
  name: string;
  image?: string;
  stars?: number;
  onClick?: () => void;
}

export default function IndividualCard({ name, image, stars, onClick }: IndividualCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 shadow-xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group relative"
    >
      {stars !== undefined && (
        <div className="absolute top-3 right-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
          <span>⭐</span>
          <span>{stars}</span>
        </div>
      )}

      <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center overflow-hidden border-2 border-purple-100 group-hover:scale-105 transition-transform">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">👤</span>
        )}
      </div>

      <span className="font-semibold text-slate-800 text-sm text-center line-clamp-1">
        {name}
      </span>
    </div>
  );
}