import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, continueRender, delayRender } from "remotion";
import { scriptData } from "./data/script";
import { Scene } from "./components/Scene";
import { loadAAFont, subtitleFontUrl } from "./fonts";

export const Video: React.FC = () => {
  const [fontLoaded, setFontLoaded] = useState(false);
  const [handle] = useState(() => delayRender("Loading fonts..."));

  useEffect(() => {
    loadAAFont().then(() => {
      setFontLoaded(true);
      continueRender(handle);
    });
  }, [handle]);

  let currentFrame = 0;
  let currentDisplay: string[] | null = null;

  if (!fontLoaded) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%)",
      }}
    >
      {/* Google Fonts読み込み */}
      <link href={subtitleFontUrl} rel="stylesheet" />

      {/* BGM（あれば） */}
      {scriptData.bgm && (
        <Audio src={staticFile(scriptData.bgm)} volume={scriptData.bgmVolume ?? 0.15} loop />
      )}

      {/* 各セグメントをSequenceで配置 */}
      {scriptData.segments.map((segment, i) => {
        const from = currentFrame;
        const duration = segment.durationInFrames + segment.pauseAfter;
        currentFrame += duration;

        // displayが設定されていれば更新
        if (segment.display) {
          currentDisplay = segment.display;
        }

        return (
          <Sequence
            key={i}
            from={from}
            durationInFrames={Math.max(duration, 1)}
          >
            <Scene
              segment={segment}
              allCharacters={scriptData.characters}
              currentDisplay={currentDisplay}
              voiceVolume={scriptData.voiceVolume ?? 1.0}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
