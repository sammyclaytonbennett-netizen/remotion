import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = frame / durationInFrames;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 8,
        backgroundColor: "rgba(255,255,255,0.25)",
        zIndex: 100,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress * 100}%`,
          background: "linear-gradient(90deg, #FFD700, #FF6B35)",
          borderRadius: "0 4px 4px 0",
          transition: "none",
        }}
      />
    </div>
  );
};
