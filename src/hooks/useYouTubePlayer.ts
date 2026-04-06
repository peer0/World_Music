"use client";

import { useState, useCallback, useRef, useEffect } from "react";

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: Record<string, (event: YTEvent) => void>;
        }
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTEvent {
  data: number;
  target: YTPlayer;
}

interface YTPlayer {
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

export type PlayerState = "loading" | "ready" | "playing" | "paused" | "ended" | "error";

export function useYouTubePlayer(elementId: string) {
  const [state, setState] = useState<PlayerState>("loading");
  const [progress, setProgress] = useState(0);
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadVideo = useCallback(
    (videoId: string) => {
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);

        window.onYouTubeIframeAPIReady = () => {
          createPlayer(videoId);
        };
      } else {
        createPlayer(videoId);
      }

      function createPlayer(vid: string) {
        if (playerRef.current) {
          playerRef.current.destroy();
        }

        playerRef.current = new window.YT.Player(elementId, {
          videoId: vid,
          playerVars: { autoplay: 0, controls: 1, modestbranding: 1 },
          events: {
            onReady: () => setState("ready"),
            onStateChange: (event: YTEvent) => {
              switch (event.data) {
                case window.YT.PlayerState.PLAYING:
                  setState("playing");
                  startProgressTracking();
                  break;
                case window.YT.PlayerState.PAUSED:
                  setState("paused");
                  stopProgressTracking();
                  break;
                case window.YT.PlayerState.ENDED:
                  setState("ended");
                  setProgress(1.0);
                  stopProgressTracking();
                  break;
              }
            },
            onError: () => setState("error"),
          },
        });
      }
    },
    [elementId]
  );

  function startProgressTracking() {
    stopProgressTracking();
    intervalRef.current = setInterval(() => {
      if (playerRef.current) {
        const current = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        if (duration > 0) {
          setProgress(current / duration);
        }
      }
    }, 100);
  }

  function stopProgressTracking() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      stopProgressTracking();
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  return { state, progress, loadVideo };
}
