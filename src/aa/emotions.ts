import type { EmotionPreset } from "../types";

/**
 * やる夫の感情プリセット
 * 各感情に対して、眉・目・頬・口のバリアント名を指定
 */
export const YARUO_EMOTIONS: Record<string, EmotionPreset> = {
  normal: {
    eyebrow: "neutral",
    eye: "normal",
    cheek: "normal",
    mouth: "closed",
  },
  happy: {
    eyebrow: "happy",
    eye: "happy",
    cheek: "happy",
    mouth: "smile",
  },
  sad: {
    eyebrow: "sad",
    eye: "cry2",
    cheek: "normal",
    mouth: "cry",
  },
  cry: {
    eyebrow: "sad",
    eye: "cry",
    cheek: "blush",
    mouth: "cry",
  },
  angry: {
    eyebrow: "angry",
    eye: "normal",
    cheek: "normal",
    mouth: "angry",
  },
  surprised: {
    eyebrow: "surprised",
    eye: "surprised",
    cheek: "normal",
    mouth: "shock",
  },
  troubled: {
    eyebrow: "troubled",
    eye: "flat",
    cheek: "normal",
    mouth: "quiet",
  },
  shy: {
    eyebrow: "happy",
    eye: "happy",
    cheek: "blush2",
    mouth: "smile",
  },
  grit: {
    eyebrow: "angry",
    eye: "intense",
    cheek: "intense",
    mouth: "grit",
  },
  dead: {
    eyebrow: "neutral",
    eye: "dead",
    cheek: "normal",
    mouth: "quiet",
  },
  wink: {
    eyebrow: "happy",
    eye: "wink",
    cheek: "normal",
    mouth: "smile",
  },
};

/**
 * やらない夫の感情マッピング（全身差し替え用）
 * 感情名からバリアント名へのマッピング
 *
 * 利用可能バリアント:
 *   通常: normal, explain
 *   感情: happy, happy2, angry, despair, sad
 *   カジュアル: casual, casual2, casual3, casual4, casual5
 *   考える: thinking, thinking2, thinking3, thinking4
 *   指差し: pointing
 *   手振り: waving
 *   腕組み: arms_crossed, arms_crossed2
 */
export const YARANAI_EMOTION_MAP: Record<string, string> = {
  normal: "normal",
  explain: "explain",
  happy: "happy",
  happy2: "happy2",
  sad: "sad",
  cry: "sad",
  despair: "despair",
  angry: "angry",
  surprised: "casual",
  troubled: "thinking",
  shy: "happy",
  listen: "thinking",
  think: "thinking",
  thinking: "thinking",
  question: "thinking3",
  pointing: "pointing",
  waving: "waving",
  arms_crossed: "arms_crossed",
  casual: "casual",
};

/**
 * 口パクアニメーション用の口バリアント順序
 */
export const MOUTH_SEQUENCE = ["closed", "talk1", "talk2", "open"];

/**
 * 口パク間隔 (ミリ秒)
 */
export const MOUTH_INTERVAL_MS = 120;
