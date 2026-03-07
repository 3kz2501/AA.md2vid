// ========== Config Types ==========

export interface VoicevoxConfig {
  endpoint: string;
  defaults: {
    speedScale: number;
    pitchScale: number;
    intonationScale: number;
    volumeScale: number;
  };
}

export interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  pauseAfterDefault: number;
  outputDir: string;
}

export interface FontConfig {
  aa: {
    family: string;
    file: string;
    size: number;
    lineHeight: number;
  };
  subtitle: {
    family: string;
    googleFonts: boolean;
    weight: number;
    size: number;
  };
}

export interface CharacterConfig {
  displayName: string;
  voiceId: number;
  direction: "left" | "right";
  aaType: "parts" | "fullbody";
  aaSource: string;
  voiceParams?: {
    speedScale?: number;
    pitchScale?: number;
    intonationScale?: number;
    volumeScale?: number;
  };
}

export interface Config {
  voicevox: VoicevoxConfig;
  video: VideoConfig;
  fonts: FontConfig;
  characters: Record<string, CharacterConfig>;
  emotionKeywords: Record<string, string[]>;
  bgm: {
    volume: number;
    fadeOutDuration: number;
  };
  background: {
    color: string;
    slidePanel: {
      backgroundColor: string;
      textColor: string;
      padding: number;
      borderRadius: number;
    };
  };
}

// ========== AA Parts Types ==========

/** やる夫用: パーツ合成方式 */
export interface CharacterParts {
  base: string[];
  slotMap: {
    eyebrow: number;
    eye: number;
    cheek: number;
    mouth: [number, number]; // [start, end] inclusive
  };
  variants: {
    eyebrow: Record<string, string>;
    eye: Record<string, string>;
    cheek: Record<string, string>;
    mouth: Record<string, string[]>;
  };
}

/** やらない夫用: 全身差し替え方式 */
export interface FullBodyCharacter {
  variants: Record<string, string[]>;
  mouthSlot?: {
    range: [number, number];
    frames: string[][];
  };
}

/** 感情プリセット */
export interface EmotionPreset {
  eyebrow: string;
  eye: string;
  cheek: string;
  mouth: string;
}

// ========== Script Data Types ==========

export interface ScriptCharacter {
  name: string;
  voiceId: number;
  direction: "left" | "right";
  aaSource: string;
}

export interface Segment {
  id: number;
  character: string;
  text: string;
  voiceText: string;
  emotion: string;
  display: string[] | null;
  voiceFile: string;
  durationInFrames: number;
  pauseAfter: number;
}

export interface ScriptData {
  title: string;
  characters: ScriptCharacter[];
  bgm?: string;
  bgmVolume?: number;
  segments: Segment[];
  totalDurationInFrames: number;
}

// ========== MLT Parser Types ==========

export interface MLTSection {
  name: string;
  entries: string[][];
}

export interface ParsedMLT {
  sections: MLTSection[];
}

// ========== Voice Generation Types ==========

export interface DurationInfo {
  durationSec: number;
  durationInFrames: number;
}

export interface DurationsJson {
  [filename: string]: DurationInfo;
}
