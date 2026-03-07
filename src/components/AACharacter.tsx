import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { buildYaruoAA, buildYaranaiAA } from "../aa/builder";
import { getYaruoData, getYaranaiData } from "../aa/characters";
import { MOUTH_INTERVAL_MS } from "../aa/emotions";

interface AACharacterProps {
  name: string;
  emotion: string;
  isSpeaking: boolean;
  direction: "left" | "right";
  aaSource: string;
}

export const AACharacter: React.FC<AACharacterProps> = ({
  name,
  emotion,
  isSpeaking,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 口パクフレーム計算（やる夫用）
  const mouthFrameInterval = Math.ceil((MOUTH_INTERVAL_MS / 1000) * fps);
  const mouthIndex = isSpeaking
    ? Math.floor(frame / mouthFrameInterval) % 4
    : 0;

  // AA合成
  let aaLines: string[];
  const isYaruo = name.includes("やる夫");

  if (isYaruo) {
    // やる夫: パーツ合成方式（口パクあり）
    aaLines = buildYaruoAA(getYaruoData(), emotion, mouthIndex, isSpeaking);
  } else {
    // やらない夫: 全身差し替え方式（口パクなし）
    aaLines = buildYaranaiAA(getYaranaiData(), emotion, 0, false);
  }

  return (
    <div
      style={{
        // AA専用フォント設定（高解像度）
        fontFamily: '"aahub_light", "ＭＳ Ｐゴシック", "MS PGothic", "Meiryo", sans-serif',
        fontSize: 12,  // 小さくして解像度UP
        lineHeight: 1.12,
        letterSpacing: 0,
        whiteSpace: "pre",
        color: "#fff",
        textShadow: "1px 1px 2px rgba(0,0,0,0.95)",
        // scaleで最終サイズ調整
        transform: "scale(2.2)",
        transformOrigin: "center bottom",
      }}
    >
      <pre style={{ margin: 0, fontFamily: "inherit", fontSize: "inherit", lineHeight: "inherit" }}>
        {aaLines.join("\n")}
      </pre>
    </div>
  );
};
