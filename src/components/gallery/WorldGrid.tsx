import { WorldCard } from "./WorldCard";

interface World {
  id: string; title: string; artist: string; thumbnailUrl: string | null; createdAt: string;
}

interface WorldGridProps {
  worlds: World[];
  emptyMessage?: string;
}

export function WorldGrid({ worlds, emptyMessage = "아직 만든 세계가 없습니다" }: WorldGridProps) {
  if (worlds.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-4xl mb-4">🌑</p>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {worlds.map((world) => <WorldCard key={world.id} {...world} />)}
    </div>
  );
}
