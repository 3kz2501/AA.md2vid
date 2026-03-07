/**
 * MLT ファイルパーサー
 * やる夫・やらない夫のMLTファイルからAAパーツを抽出し、JSONに変換
 */

import fs from "fs";
import path from "path";
import type { ParsedMLT, MLTSection, CharacterParts, FullBodyCharacter } from "../src/types.js";

const MLT_DIR = path.resolve(process.cwd(), "characters/mlt");
const OUTPUT_DIR = path.resolve(process.cwd(), "characters");

/**
 * MLTファイルをパースしてセクションごとに分割
 */
function parseMLTFile(content: string): ParsedMLT {
  const sections: MLTSection[] = [];
  let currentSection: MLTSection | null = null;
  let currentEntry: string[] = [];

  // CRLFをLFに正規化
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  for (const line of lines) {
    // セクションヘッダー検出 【〇〇】
    const sectionMatch = line.match(/^【(.+?)】/);
    if (sectionMatch) {
      // 前のセクションを保存
      if (currentSection) {
        if (currentEntry.length > 0) {
          currentSection.entries.push(currentEntry);
        }
        sections.push(currentSection);
      }
      currentSection = { name: sectionMatch[1], entries: [] };
      currentEntry = [];
      continue;
    }

    // [SPLIT] で区切り
    if (line.trim() === "[SPLIT]") {
      if (currentEntry.length > 0 && currentSection) {
        currentSection.entries.push(currentEntry);
      }
      currentEntry = [];
      continue;
    }

    // 通常の行
    if (currentSection) {
      currentEntry.push(line);
    }
  }

  // 最後のセクションを保存
  if (currentSection) {
    if (currentEntry.length > 0) {
      currentSection.entries.push(currentEntry);
    }
    sections.push(currentSection);
  }

  return { sections };
}

/**
 * パーツセクション（眉・目・頬）から空行区切りでバリアントを抽出
 */
function extractSingleLineVariants(lines: string[]): string[] {
  const variants: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("染め")) { // "染め" はラベル行
      variants.push(line);
    }
  }

  return variants;
}

/**
 * 口セクションから2行セットでバリアントを抽出
 */
function extractMouthVariants(lines: string[]): string[][] {
  const variants: string[][] = [];
  const nonEmptyLines: string[] = [];

  for (const line of lines) {
    if (line.trim()) {
      nonEmptyLines.push(line);
    }
  }

  // 2行ずつペアにする
  for (let i = 0; i < nonEmptyLines.length; i += 2) {
    if (i + 1 < nonEmptyLines.length) {
      variants.push([nonEmptyLines[i], nonEmptyLines[i + 1]]);
    }
  }

  return variants;
}

/**
 * やる夫MLTからパーツデータを生成
 */
function parseYaruoParts(parsed: ParsedMLT): CharacterParts {
  const baseSection = parsed.sections.find(s => s.name === "基本");
  const eyebrowSection = parsed.sections.find(s => s.name === "眉");
  const eyeSection = parsed.sections.find(s => s.name === "目");
  const cheekSection = parsed.sections.find(s => s.name === "頬");
  const mouthSection = parsed.sections.find(s => s.name === "口");

  if (!baseSection || !eyebrowSection || !eyeSection || !cheekSection || !mouthSection) {
    throw new Error("やる夫MLTに必要なセクションがありません");
  }

  // 最初の非空エントリーを基本AAとして取得
  const firstNonEmptyEntry = baseSection.entries.find(entry => {
    const filtered = entry.filter(line => line.trim() !== "");
    return filtered.length > 0;
  });
  const baseLines = firstNonEmptyEntry?.filter(line => line.trim() !== "") || [];

  // パーツデータを構築
  const parts: CharacterParts = {
    base: baseLines,
    slotMap: {
      eyebrow: 2,  // Line index for eyebrow
      eye: 3,      // Line index for eye
      cheek: 4,    // Line index for cheek
      mouth: [5, 6], // [start, end] inclusive
    },
    variants: {
      eyebrow: {},
      eye: {},
      cheek: {},
      mouth: {},
    },
  };

  // 眉バリアント
  const eyebrowLines = eyebrowSection.entries[0] || [];
  const eyebrowVariants = extractSingleLineVariants(eyebrowLines);
  const eyebrowNames = ["happy", "angry", "sad", "normal", "surprised", "determined", "neutral", "troubled"];
  eyebrowVariants.forEach((line, i) => {
    const name = eyebrowNames[i] || `variant_${i}`;
    parts.variants.eyebrow[name] = line;
  });

  // 目バリアント
  const eyeLines = eyeSection.entries[0] || [];
  const eyeVariants = extractSingleLineVariants(eyeLines);
  const eyeNames = ["dead", "solid", "closed", "sparkle", "shine", "cry", "cry2", "surprised", "equal", "flat", "wink", "happy", "normal", "intense"];
  eyeVariants.forEach((line, i) => {
    const name = eyeNames[i] || `variant_${i}`;
    parts.variants.eye[name] = line;
  });

  // 頬バリアント
  const cheekLines = cheekSection.entries[0] || [];
  const cheekVariants = extractSingleLineVariants(cheekLines);
  const cheekNames = ["blush", "blush2", "sweat", "normal", "happy", "intense"];
  cheekVariants.forEach((line, i) => {
    const name = cheekNames[i] || `variant_${i}`;
    parts.variants.cheek[name] = line;
  });

  // 口バリアント
  const mouthLines = mouthSection.entries[0] || [];
  const mouthVariants = extractMouthVariants(mouthLines);
  const mouthNames = ["grit", "cry", "angry", "shock", "closed", "smile", "yell", "talk1", "talk2", "quiet", "open", "smirk"];
  mouthVariants.forEach((lines, i) => {
    const name = mouthNames[i] || `variant_${i}`;
    parts.variants.mouth[name] = lines;
  });

  return parts;
}

/**
 * やらない夫MLTから全身データを生成
 */
function parseYaranaiFullBody(parsed: ParsedMLT): FullBodyCharacter {
  const fullBody: FullBodyCharacter = {
    variants: {},
  };

  // 基本セクションの各[SPLIT]エントリを取得
  const baseSection = parsed.sections.find(s => s.name === "基本");
  if (!baseSection) {
    throw new Error("やらない夫MLTに基本セクションがありません");
  }

  // 基本セクションのバリアントを登録
  const variantNames = [
    "normal", "normal_left", "normal_left2", "normal_right", "normal_right2",
    "normal2", "think", "think2", "explain", "explain2", "explain3", "explain4", "explain5", "explain6",
  ];

  baseSection.entries.forEach((entry, i) => {
    const lines = entry.filter(line => line.trim() !== "");
    if (lines.length > 0) {
      const name = variantNames[i] || `variant_${i}`;
      fullBody.variants[name] = lines;
    }
  });

  // 他のセクション（喜楽、怒、哀など）があれば追加
  const emotionSections: Record<string, string> = {
    "喜楽": "happy",
    "喜": "happy",
    "怒": "angry",
    "哀": "sad",
    "驚": "surprised",
    "困": "troubled",
    "照": "shy",
  };

  for (const section of parsed.sections) {
    if (section.name === "基本") continue;

    const emotionKey = emotionSections[section.name];
    if (emotionKey) {
      section.entries.forEach((entry, i) => {
        const lines = entry.filter(line => line.trim() !== "");
        if (lines.length > 0) {
          const suffix = i === 0 ? "" : `_${i}`;
          fullBody.variants[`${emotionKey}${suffix}`] = lines;
        }
      });
    }
  }

  return fullBody;
}

/**
 * メイン処理
 */
async function main() {
  console.log("MLTファイルをパースしています...");

  // やる夫01（基本01）をパース
  const yaruoPath = path.join(MLT_DIR, "やる夫01（基本01）.mlt");
  if (fs.existsSync(yaruoPath)) {
    console.log("  やる夫01（基本01）.mlt を処理中...");
    const yaruoContent = fs.readFileSync(yaruoPath, "utf-8");
    const yaruoParsed = parseMLTFile(yaruoContent);
    const yaruoParts = parseYaruoParts(yaruoParsed);

    const yaruoOutput = path.join(OUTPUT_DIR, "yaruo.json");
    fs.writeFileSync(yaruoOutput, JSON.stringify(yaruoParts, null, 2), "utf-8");
    console.log(`  → ${yaruoOutput} に出力しました`);
    console.log(`     眉: ${Object.keys(yaruoParts.variants.eyebrow).length} バリアント`);
    console.log(`     目: ${Object.keys(yaruoParts.variants.eye).length} バリアント`);
    console.log(`     頬: ${Object.keys(yaruoParts.variants.cheek).length} バリアント`);
    console.log(`     口: ${Object.keys(yaruoParts.variants.mouth).length} バリアント`);
  }

  // やらない夫01（基本）をパース（全身差し替え方式）
  const yaranaiPath = path.join(MLT_DIR, "やらない夫01（基本）.mlt");
  if (fs.existsSync(yaranaiPath)) {
    console.log("  やらない夫01（基本）.mlt を処理中...");
    const yaranaiContent = fs.readFileSync(yaranaiPath, "utf-8");
    const yaranaiParsed = parseMLTFile(yaranaiContent);
    const yaranaiFullBody = parseYaranaiFullBody(yaranaiParsed);

    const yaranaiOutput = path.join(OUTPUT_DIR, "yaranai.json");
    fs.writeFileSync(yaranaiOutput, JSON.stringify(yaranaiFullBody, null, 2), "utf-8");
    console.log(`  → ${yaranaiOutput} に出力しました`);
    console.log(`     バリアント: ${Object.keys(yaranaiFullBody.variants).length} 種類`);
  }

  console.log("MLTパース完了");
}

main().catch(console.error);
