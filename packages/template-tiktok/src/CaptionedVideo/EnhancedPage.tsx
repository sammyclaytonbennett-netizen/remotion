import { makeTransform, scale, translateY } from "@remotion/animation-utils";
import { TikTokPage } from "@remotion/captions";
import { fitText } from "@remotion/layout-utils";
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TheBoldFont } from "../load-font";

const fontFamily = TheBoldFont;
const DESIRED_FONT_SIZE = 100;
const HIGHLIGHT_COLOR = "#FFE500";
const CAPTION_BOTTOM = 300;

export const EnhancedPage: React.FC<{
  readonly enterProgress: number;
  readonly page: TikTokPage;
}> = ({ enterProgress, page }) => {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();
  const timeInMs = (frame / fps) * 1000;

  const fittedText = fitText({
    fontFamily,
    text: page.text,
    withinWidth: width * 0.88,
    textTransform: "uppercase",
  });

  const fontSize = Math.min(DESIRED_FONT_SIZE, fittedText.fontSize);

  const scaleVal = interpolate(enterProgress, [0, 1], [0.85, 1]);
  const translateYVal = interpolate(enterProgress, [0, 1], [40, 0]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        top: undefined,
        bottom: CAPTION_BOTTOM,
        height: "auto",
        paddingBottom: 0,
      }}
    >
      {/* Semi-transparent background pill for readability */}
      <div
        style={{
          background: "rgba(0,0,0,0.55)",
          borderRadius: 18,
          paddingLeft: 28,
          paddingRight: 28,
          paddingTop: 16,
          paddingBottom: 16,
          transform: makeTransform([
            scale(scaleVal),
            translateY(translateYVal),
          ]),
          backdropFilter: "blur(4px)",
        }}
      >
        <div
          style={{
            fontSize,
            color: "white",
            WebkitTextStroke: "14px black",
            paintOrder: "stroke fill",
            fontFamily,
            textTransform: "uppercase",
            lineHeight: 1.1,
            textAlign: "center",
            letterSpacing: 2,
          }}
        >
          {page.tokens.map((t) => {
            const startRelativeToSequence = t.fromMs - page.startMs;
            const endRelativeToSequence = t.toMs - page.startMs;
            const active =
              startRelativeToSequence <= timeInMs &&
              endRelativeToSequence > timeInMs;

            return (
              <span
                key={t.fromMs}
                style={{
                  display: "inline",
                  whiteSpace: "pre",
                  color: active ? HIGHLIGHT_COLOR : "white",
                  textShadow: active
                    ? `0 0 20px ${HIGHLIGHT_COLOR}88, 0 2px 8px rgba(0,0,0,0.8)`
                    : "0 2px 8px rgba(0,0,0,0.8)",
                  transition: "color 0.05s",
                }}
              >
                {t.text}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
