import { TikTokPage } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EnhancedPage } from "./EnhancedPage";

export const EnhancedSubtitlePage: React.FC<{
  readonly page: TikTokPage;
}> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 280, mass: 0.8 },
    durationInFrames: 6,
  });

  return (
    <AbsoluteFill>
      <EnhancedPage enterProgress={enter} page={page} />
    </AbsoluteFill>
  );
};
