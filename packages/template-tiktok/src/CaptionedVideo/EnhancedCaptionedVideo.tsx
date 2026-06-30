import { Caption, createTikTokStyleCaptions } from "@remotion/captions";
import { parseMedia } from "@remotion/media-parser";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  cancelRender,
  getStaticFiles,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
  watchStaticFile,
} from "remotion";
import { z } from "zod";
import { loadFont } from "../load-font";
import { EnhancedSubtitlePage } from "./EnhancedSubtitlePage";
import { ProgressBar } from "./ProgressBar";

export const enhancedCaptionedVideoSchema = z.object({
  src: z.string(),
});

export const calculateEnhancedMetadata: CalculateMetadataFunction<
  z.infer<typeof enhancedCaptionedVideoSchema>
> = async ({ props }) => {
  const fps = 30;
  const { slowDurationInSeconds } = await parseMedia({
    src: props.src,
    fields: { slowDurationInSeconds: true },
    acknowledgeRemotionLicense: true,
  });

  return {
    fps,
    durationInFrames: Math.floor((slowDurationInSeconds ?? 0) * fps),
  };
};

const getFileExists = (file: string) => {
  const files = getStaticFiles();
  return Boolean(files.find((f) => f.src === file));
};

// Words displayed per caption group — 1200ms for natural pacing
const SWITCH_CAPTIONS_EVERY_MS = 1200;

// Subtle Ken Burns zoom over the full video
const ZOOM_START = 1.0;
const ZOOM_END = 1.04;

const BottomGradient: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 35%, transparent 60%)",
      pointerEvents: "none",
    }}
  />
);

const HookOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 8, fps * 2.5, fps * 3], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = spring({
    frame,
    fps,
    config: { damping: 150, stiffness: 200 },
    durationInFrames: 10,
  });

  if (frame > fps * 3) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        top: 160,
        bottom: undefined,
        height: "auto",
        opacity,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          background: "linear-gradient(135deg, #FF6B35, #FFD700)",
          borderRadius: 50,
          paddingLeft: 40,
          paddingRight: 40,
          paddingTop: 20,
          paddingBottom: 20,
          boxShadow: "0 8px 32px rgba(255,107,53,0.5)",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 52,
            fontFamily: "sans-serif",
            fontWeight: 900,
            letterSpacing: 1,
            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          WATCH TILL THE END 🔥
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const EnhancedCaptionedVideo: React.FC<{
  src: string;
}> = ({ src }) => {
  const [subtitles, setSubtitles] = useState<Caption[]>([]);
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = useState(() => delayRender());
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const subtitlesFile = src
    .replace(/.mp4$/, ".json")
    .replace(/.mkv$/, ".json")
    .replace(/.mov$/, ".json")
    .replace(/.webm$/, ".json");

  const fetchSubtitles = useCallback(async () => {
    try {
      await loadFont();
      if (getFileExists(subtitlesFile)) {
        const res = await fetch(subtitlesFile);
        const data = (await res.json()) as Caption[];
        setSubtitles(data);
      }
      continueRender(handle);
    } catch (e) {
      cancelRender(e);
    }
  }, [continueRender, handle, subtitlesFile]);

  useEffect(() => {
    fetchSubtitles();
    const c = watchStaticFile(subtitlesFile, () => {
      fetchSubtitles();
    });
    return () => {
      c.cancel();
    };
  }, [fetchSubtitles, src, subtitlesFile]);

  const { pages } = useMemo(() => {
    return createTikTokStyleCaptions({
      combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
      captions: subtitles ?? [],
    });
  }, [subtitles]);

  // Subtle slow zoom — Ken Burns style
  const zoomScale = interpolate(frame, [0, durationInFrames], [ZOOM_START, ZOOM_END]);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* Video with color-graded filter and subtle zoom */}
      <AbsoluteFill
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: "center center",
        }}
      >
        <OffthreadVideo
          style={{
            objectFit: "cover",
            filter: "brightness(1.08) contrast(1.12) saturate(1.25)",
          }}
          src={src}
          volume={1.3}
        />
      </AbsoluteFill>

      {/* Bottom gradient for caption readability */}
      <BottomGradient />

      {/* Hook overlay shown in first 3 seconds */}
      <HookOverlay />

      {/* Captions */}
      {pages.map((page, index) => {
        const nextPage = pages[index + 1] ?? null;
        const subtitleStartFrame = (page.startMs / 1000) * fps;
        const subtitleEndFrame = Math.min(
          nextPage ? (nextPage.startMs / 1000) * fps : Infinity,
          subtitleStartFrame + SWITCH_CAPTIONS_EVERY_MS,
        );
        const durationInFrames = subtitleEndFrame - subtitleStartFrame;
        if (durationInFrames <= 0) return null;

        return (
          <Sequence
            key={index}
            from={subtitleStartFrame}
            durationInFrames={durationInFrames}
          >
            <EnhancedSubtitlePage page={page} />
          </Sequence>
        );
      })}

      {/* Progress bar */}
      <ProgressBar />
    </AbsoluteFill>
  );
};
