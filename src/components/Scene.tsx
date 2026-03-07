import React from "react";
import { Audio, staticFile, useCurrentFrame } from "remotion";
import type { Segment, ScriptCharacter } from "../types";
import { AACharacter } from "./AACharacter";
import { DisplayPanel } from "./DisplayPanel";
import { Subtitle } from "./Subtitle";

interface SceneProps {
  segment: Segment;
  allCharacters: ScriptCharacter[];
  currentDisplay: string[] | null;
  voiceVolume: number;
}

export const Scene: React.FC<SceneProps> = ({
  segment,
  allCharacters,
  currentDisplay,
  voiceVolume,
}) => {
  const frame = useCurrentFrame();
  const isSpeaking = frame < segment.durationInFrames;

  // キャラを左右に分ける
  const leftChar = allCharacters.find(c => c.direction === "left");
  const rightChar = allCharacters.find(c => c.direction === "right");

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* 左側キャラ */}
      {leftChar && (
        <div
          style={{
            position: "absolute",
            left: 40,
            bottom: 20,
            overflow: "visible",
            opacity: segment.character === leftChar.name ? 1 : 0.4,
            filter: segment.character === leftChar.name ? "none" : "grayscale(50%)",
          }}
        >
          <AACharacter
            name={leftChar.name}
            emotion={segment.character === leftChar.name ? segment.emotion : "normal"}
            isSpeaking={segment.character === leftChar.name && isSpeaking}
            direction={leftChar.direction}
            aaSource={leftChar.aaSource}
          />
        </div>
      )}

      {/* 中央コンテンツ */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: 280,
          marginRight: 280,
          padding: "30px 0",
          paddingBottom: 280, // キャラクター領域を確保
          maxHeight: "100%",
        }}
      >
        {/* タイトル部分 */}
        {(currentDisplay || segment.display) && (
          <DisplayPanel content={currentDisplay || segment.display} />
        )}
      </div>

      {/* 右側キャラ */}
      {rightChar && (
        <div
          style={{
            position: "absolute",
            right: 100,
            bottom: 20,
            overflow: "visible",
            opacity: segment.character === rightChar.name ? 1 : 0.4,
            filter: segment.character === rightChar.name ? "none" : "grayscale(50%)",
          }}
        >
          <AACharacter
            name={rightChar.name}
            emotion={segment.character === rightChar.name ? segment.emotion : "normal"}
            isSpeaking={segment.character === rightChar.name && isSpeaking}
            direction={rightChar.direction}
            aaSource={rightChar.aaSource}
          />
        </div>
      )}

      {/* 字幕 */}
      <Subtitle character={segment.character} text={segment.text} />

      {/* 音声 */}
      {segment.durationInFrames > 0 && (
        <Audio src={staticFile(segment.voiceFile)} volume={voiceVolume} />
      )}
    </div>
  );
};
