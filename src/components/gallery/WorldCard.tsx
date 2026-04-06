import Link from "next/link";

interface WorldCardProps {
  id: string; title: string; artist: string; thumbnailUrl: string | null; createdAt: string;
}

export function WorldCard({ id, title, artist, thumbnailUrl, createdAt }: WorldCardProps) {
  return (
    <Link href={`/world/${id}`}>
      <div className="group bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-600 transition-colors">
        <div className="aspect-video bg-gray-800 relative overflow-hidden">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <span className="text-4xl">🌍</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-white truncate">{title}</h3>
          <p className="text-sm text-gray-400 truncate">{artist}</p>
          <p className="text-xs text-gray-600 mt-1">{new Date(createdAt).toLocaleDateString("ko-KR")}</p>
        </div>
      </div>
    </Link>
  );
}
