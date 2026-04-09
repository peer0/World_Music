"use client";

import { useState } from "react";
import { extractVideoId } from "@/components/youtube/YouTubePlayer";

interface LetterEditorProps {
  onSubmit: (data: {
    letter: string;
    songTitle: string;
    artist: string;
    youtubeUrl: string;
    worldModelMode: "classic" | "dynamic" | "generative";
  }) => void;
  isLoading: boolean;
}

export function LetterEditor({ onSubmit, isLoading }: LetterEditorProps) {
  const [letter, setLetter] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [worldModelMode, setWorldModelMode] = useState<"classic" | "dynamic" | "generative">("dynamic");
  const [urlError, setUrlError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      setUrlError("올바른 YouTube URL을 입력해주세요");
      return;
    }
    setUrlError("");
    onSubmit({ letter, songTitle, artist, youtubeUrl, worldModelMode });
  }

  const isValid = letter.trim() && songTitle.trim() && artist.trim() && youtubeUrl.trim();

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">노래 제목</label>
          <input type="text" value={songTitle} onChange={(e) => setSongTitle(e.target.value)}
            placeholder="노래 제목을 입력하세요"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">아티스트</label>
          <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)}
            placeholder="아티스트 이름을 입력하세요"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">YouTube URL</label>
          <input type="text" value={youtubeUrl} onChange={(e) => { setYoutubeUrl(e.target.value); setUrlError(""); }}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          {urlError && <p className="mt-1 text-sm text-red-400">{urlError}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">편지</label>
        <p className="text-xs text-gray-500 mb-2">이 노래가 안겨주는 세계를 자유롭게 묘사해보세요. 느끼는 분위기, 감정, 풍경...</p>
        <textarea value={letter} onChange={(e) => setLetter(e.target.value)}
          placeholder="이 노래를 들으면 떠오르는 세계를 편지로 써보세요..."
          rows={10}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">World Model 모드</label>
        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setWorldModelMode("classic")}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              worldModelMode === "classic"
                ? "border-purple-500 bg-purple-500/20 text-white"
                : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"
            }`}
          >
            Classic
          </button>
          <button
            type="button"
            onClick={() => setWorldModelMode("dynamic")}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              worldModelMode === "dynamic"
                ? "border-purple-500 bg-purple-500/20 text-white"
                : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"
            }`}
          >
            Dynamic
          </button>
          <button
            type="button"
            onClick={() => setWorldModelMode("generative")}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              worldModelMode === "generative"
                ? "border-purple-500 bg-purple-500/20 text-white"
                : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"
            }`}
          >
            Generative
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Classic: 정적 세계, Dynamic: 곡 진행에 따라 분위기 변화, Generative: 더 공격적인 world-model 변화
        </p>
      </div>
      <button type="submit" disabled={!isValid || isLoading}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors">
        {isLoading ? "세계를 만들고 있습니다..." : "세계 만들기"}
      </button>
    </form>
  );
}
