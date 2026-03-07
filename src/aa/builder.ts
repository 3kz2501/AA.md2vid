import type { CharacterParts, FullBodyCharacter } from "../types";
import { YARUO_EMOTIONS, YARANAI_EMOTION_MAP, MOUTH_SEQUENCE } from "./emotions";

/**
 * やる夫AA合成（パーツ合成方式）
 */
export function buildYaruoAA(
  parts: CharacterParts,
  emotion: string,
  mouthIndex: number,
  isSpeaking: boolean
): string[] {
  const preset = YARUO_EMOTIONS[emotion] || YARUO_EMOTIONS.normal;
  const result = [...parts.base];

  // 眉を差し替え
  const eyebrowLine = parts.variants.eyebrow[preset.eyebrow];
  if (eyebrowLine && parts.slotMap.eyebrow < result.length) {
    result[parts.slotMap.eyebrow] = eyebrowLine;
  }

  // 目を差し替え
  const eyeLine = parts.variants.eye[preset.eye];
  if (eyeLine && parts.slotMap.eye < result.length) {
    result[parts.slotMap.eye] = eyeLine;
  }

  // 頬を差し替え
  const cheekLine = parts.variants.cheek[preset.cheek];
  if (cheekLine && parts.slotMap.cheek < result.length) {
    result[parts.slotMap.cheek] = cheekLine;
  }

  // 口を差し替え（話し中は口パクアニメーション）
  const [mouthStart, mouthEnd] = parts.slotMap.mouth;
  let mouthKey = preset.mouth;

  if (isSpeaking) {
    // 口パクアニメーション: MOUTH_SEQUENCE から口バリアントを選択
    const seqIndex = mouthIndex % MOUTH_SEQUENCE.length;
    const talkMouth = MOUTH_SEQUENCE[seqIndex];
    // talkMouth が存在すれば使う、なければデフォルト
    if (parts.variants.mouth[talkMouth]) {
      mouthKey = talkMouth;
    }
  }

  const mouthLines = parts.variants.mouth[mouthKey];
  if (mouthLines) {
    for (let i = 0; i < mouthLines.length && mouthStart + i <= mouthEnd; i++) {
      result[mouthStart + i] = mouthLines[i];
    }
  }

  return result;
}

/**
 * やらない夫AA取得（全身差し替え方式）
 * 口パクなし、感情に応じた全身AAを返す
 */
export function buildYaranaiAA(
  fullBody: FullBodyCharacter,
  emotion: string,
  _mouthIndex: number,
  _isSpeaking: boolean
): string[] {
  // 感情に対応するバリアントを取得
  const variantKey = YARANAI_EMOTION_MAP[emotion] || "normal";

  // 完全一致を探す
  if (fullBody.variants[variantKey]) {
    return fullBody.variants[variantKey];
  }

  // バリアント名が含まれるものを探す
  const matchingKey = Object.keys(fullBody.variants).find(
    k => k === variantKey || k.startsWith(`${variantKey}_`)
  );

  if (matchingKey) {
    return fullBody.variants[matchingKey];
  }

  // フォールバック: normal_left (右向き=画面中央向き)
  return fullBody.variants.normal_left || fullBody.variants[Object.keys(fullBody.variants)[0]] || [];
}

/**
 * キャラクター名からAA合成関数を取得
 */
export function getAABuilder(characterName: string) {
  const name = characterName.toLowerCase();
  if (name.includes("yaruo") || name.includes("やる夫")) {
    return buildYaruoAA;
  }
  return buildYaranaiAA;
}
