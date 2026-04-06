"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LetterEditor } from "@/components/editor/LetterEditor";

export default function CreatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(data: { letter: string; songTitle: string; artist: string; youtubeUrl: string }) {
    setIsLoading(true);
    setError("");
    try {
      const userId = "demo-user";
      const res = await fetch("/api/world/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "세계 생성에 실패했습니다");
      }
      const result = await res.json();
      router.push(`/world/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">세계 만들기</h1>
          <p className="text-gray-400">노래에서 느끼는 세계를 편지로 써보세요</p>
        </div>
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">{error}</div>
        )}
        <LetterEditor onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
