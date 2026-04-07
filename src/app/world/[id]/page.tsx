"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { WorldScene } from "@/components/world/WorldScene";
import { YouTubePlayer, extractVideoId } from "@/components/youtube/YouTubePlayer";
import type { WorldConfig } from "@/lib/types";
import { parseWorldConfig } from "@/lib/types";
import type { PlayerState } from "@/hooks/useYouTubePlayer";

interface WorldData {
  id: string; title: string; artist: string; youtubeUrl: string;
  letter: string; worldConfig: string; skyboxUrl: string | null;
  sceneImageUrl: string | null; depthMapUrl: string | null;
}

export default function WorldPage() {
  const params = useParams();
  const id = params.id as string;
  const [world, setWorld] = useState<WorldData | null>(null);
  const [config, setConfig] = useState<WorldConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [, setPlayerState] = useState<PlayerState>("loading");
  const [mode, setMode] = useState<"guided" | "free">("guided");
  const [showUI, setShowUI] = useState(true);

  useEffect(() => {
    async function loadWorld() {
      try {
        const res = await fetch(`/api/world/${id}`);
        if (!res.ok) throw new Error("세계를 찾을 수 없습니다");
        const data = await res.json();
        setWorld(data);
        setConfig(parseWorldConfig(data.worldConfig));
      } catch (err) {
        setError(err instanceof Error ? err.message : "로딩 실패");
      } finally {
        setLoading(false);
      }
    }
    loadWorld();
  }, [id]);

  const handleProgressChange = useCallback((p: number) => { setProgress(p); }, []);
  const handleStateChange = useCallback((state: PlayerState) => {
    setPlayerState(state);
    if (state === "ended") { setMode("free"); setShowUI(true); }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-pulse text-2xl">세계를 여는 중...</div>
      </div>
    );
  }

  if (error || !world || !config) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-400">
        {error || "세계를 찾을 수 없습니다"}
      </div>
    );
  }

  const videoId = extractVideoId(world.youtubeUrl);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <div className="absolute inset-0">
        <WorldScene
          config={config}
          skyboxUrl={world.skyboxUrl}
          sceneImageUrl={world.sceneImageUrl}
          depthMapUrl={world.depthMapUrl}
          progress={progress}
          mode={mode}
        />
      </div>
      {showUI && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="max-w-md mx-auto space-y-3">
            <div className="text-center text-white">
              <p className="text-lg font-medium">{world.title}</p>
              <p className="text-sm text-gray-400">{world.artist}</p>
            </div>
            {videoId && (
              <div className="w-full max-w-sm mx-auto opacity-90">
                <YouTubePlayer videoId={videoId} onProgressChange={handleProgressChange} onStateChange={handleStateChange} />
              </div>
            )}
            <div className="flex justify-center gap-3">
              <button onClick={() => setMode("guided")}
                className={`px-3 py-1 rounded text-sm transition-colors ${mode === "guided" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                가이드 여정
              </button>
              <button onClick={() => setMode("free")}
                className={`px-3 py-1 rounded text-sm transition-colors ${mode === "free" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                자유 탐험
              </button>
              <button onClick={() => setShowUI(false)}
                className="px-3 py-1 rounded text-sm bg-gray-800 text-gray-400 hover:bg-gray-700">
                UI 숨기기
              </button>
            </div>
            <p className="text-center text-xs text-gray-500 italic">{config.world.mood.description}</p>
          </div>
        </div>
      )}
      {!showUI && (
        <button onClick={() => setShowUI(true)}
          className="absolute bottom-4 right-4 px-3 py-1 rounded bg-black/50 text-gray-400 text-sm hover:bg-black/70">
          UI 보기
        </button>
      )}
    </div>
  );
}
