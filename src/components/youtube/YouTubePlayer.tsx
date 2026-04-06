"use client";

import { useEffect } from "react";
import { useYouTubePlayer, type PlayerState } from "@/hooks/useYouTubePlayer";

interface YouTubePlayerProps {
  videoId: string;
  onProgressChange: (progress: number) => void;
  onStateChange: (state: PlayerState) => void;
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function YouTubePlayer({
  videoId,
  onProgressChange,
  onStateChange,
}: YouTubePlayerProps) {
  const { state, progress, loadVideo } = useYouTubePlayer("yt-player");

  useEffect(() => {
    loadVideo(videoId);
  }, [videoId, loadVideo]);

  useEffect(() => {
    onProgressChange(progress);
  }, [progress, onProgressChange]);

  useEffect(() => {
    onStateChange(state);
  }, [state, onStateChange]);

  return (
    <div className="w-full">
      <div
        id="yt-player"
        className="w-full aspect-video rounded-lg overflow-hidden"
      />
    </div>
  );
}
