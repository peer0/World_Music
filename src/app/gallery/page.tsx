"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WorldGrid } from "@/components/gallery/WorldGrid";

interface World {
  id: string; title: string; artist: string; thumbnailUrl: string | null; createdAt: string;
}

export default function GalleryPage() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = "demo-user";
    fetch(`/api/gallery?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => setWorlds(data.worlds))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">내 세계</h1>
          <Link href="/create" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">새 세계 만들기</Link>
        </div>
        {loading ? (
          <div className="text-center py-16 text-gray-500 animate-pulse">로딩 중...</div>
        ) : (
          <WorldGrid worlds={worlds} />
        )}
      </div>
    </div>
  );
}
