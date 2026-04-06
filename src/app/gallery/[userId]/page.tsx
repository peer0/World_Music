"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WorldGrid } from "@/components/gallery/WorldGrid";

interface World {
  id: string; title: string; artist: string; thumbnailUrl: string | null; createdAt: string;
}

export default function SharedGalleryPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/gallery?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => setWorlds(data.worlds))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">갤러리</h1>
        {loading ? (
          <div className="text-center py-16 text-gray-500 animate-pulse">로딩 중...</div>
        ) : (
          <WorldGrid worlds={worlds} emptyMessage="이 갤러리에는 아직 세계가 없습니다" />
        )}
      </div>
    </div>
  );
}
