/**
 * Markdown パーサー
 * Frontmatter + セリフ + 感情 + 表示テキストをパースしてScriptDataを生成
 *
 * 対応フォーマット:
 * 1. 旧形式: > 引用ブロックでスライド内容を直接記述
 * 2. 新形式: @slide N で外部スライドファイルを参照
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { loadConfig, getCharacterConfig, getEmotionKeywords } from "../src/config.js";
import type { ScriptData, Segment, ScriptCharacter, DurationsJson } from "../src/types.js";
import { parseSlides, slideToDisplay, type SlideData } from "./parse-slides.js";

const DURATIONS_PATH = path.resolve(process.cwd(), "public/voices/durations.json");

// 新しいディレクトリ構造をサポート
const INPUT_DIR = path.resolve(process.cwd(), "input");
const MANUSCRIPTS_DIR = path.resolve(INPUT_DIR, "manuscripts");
const SLIDES_DIR = path.resolve(INPUT_DIR, "slides");
// 旧ディレクトリもフォールバックとしてサポート
const LEGACY_MANUSCRIPTS_DIR = path.resolve(process.cwd(), "manuscripts");
const OUTPUT_PATH = path.resolve(process.cwd(), "src/data/script.ts");

interface FrontmatterCharacter {
  name: string;
  voiceId?: number;
  direction?: "left" | "right";
}

interface Frontmatter {
  title: string;
  characters: FrontmatterCharacter[];
  bgm?: string;
  slides?: string; // 外部スライドファイルへの参照
  pronunciations?: Record<string, string>; // 読み替え辞書
}

/**
 * キャラ名をファイル名用にエンコード
 */
function encodeCharacterName(name: string): string {
  const map: Record<string, string> = {
    "やる夫": "yaruo",
    "やらない夫": "yaranai",
  };
  return map[name] || name.replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * rubyタグからVOICEVOX用テキストを抽出
 * <ruby>Remotion<rt>リモーション</rt></ruby> → リモーション
 */
function extractVoiceText(text: string, pronunciations?: Record<string, string>): string {
  let result = text.replace(/<ruby>.*?<rt>(.*?)<\/rt><\/ruby>/g, "$1");

  // 読み替え辞書を適用（長いパターンから順に）
  if (pronunciations) {
    const sortedKeys = Object.keys(pronunciations).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      result = result.split(key).join(pronunciations[key]);
    }
  }

  return result;
}

/**
 * 表示用テキストを整形（rubyタグはそのまま保持）
 */
function extractDisplayText(text: string): string {
  return text.trim();
}

/**
 * 感情を自動検出
 */
function detectEmotion(text: string): string {
  const keywords = getEmotionKeywords();

  for (const [emotion, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (text.includes(word)) {
        return emotion;
      }
    }
  }

  return "normal";
}

/**
 * セリフ行をパース
 * [キャラ名] テキスト
 * [キャラ名:感情] テキスト
 */
function parseDialogueLine(line: string): { character: string; emotion: string | null; text: string } | null {
  const match = line.match(/^\[([^\]:]+)(?::([^\]]+))?\]\s*(.+)$/);
  if (!match) return null;

  return {
    character: match[1].trim(),
    emotion: match[2]?.trim() || null,
    text: match[3].trim(),
  };
}

/**
 * @slide N ディレクティブをパース
 */
function parseSlideDirective(line: string): number | null {
  const match = line.match(/^@slide\s+(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * 引用ブロックをパース（スライド表示用 - 旧形式）
 */
function parseQuoteBlock(lines: string[]): string[] {
  const content: string[] = [];

  for (const line of lines) {
    if (line.startsWith(">")) {
      content.push(line.slice(1).trim());
    }
  }

  return content.length > 0 ? content : [];
}

/**
 * Markdownをパースしてセグメント配列に変換
 */
function parseMarkdown(
  content: string,
  frontmatter: Frontmatter,
  slideData: SlideData | null,
  basePath: string
): { segments: Segment[]; characters: ScriptCharacter[] } {
  const config = loadConfig();
  const lines = content.split("\n");
  const segments: Segment[] = [];

  // キャラクター設定をマージ
  const characters: ScriptCharacter[] = frontmatter.characters.map(char => {
    const configChar = getCharacterConfig(char.name);
    return {
      name: char.name,
      voiceId: char.voiceId ?? configChar?.voiceId ?? 3,
      direction: char.direction ?? configChar?.direction ?? "right",
      aaSource: configChar?.aaSource ?? "",
    };
  });

  let currentDisplay: string[] | null = null;
  let quoteBuffer: string[] = [];
  let isInQuoteBlock = false;
  let segmentId = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // @slide ディレクティブの検出 (新形式)
    const slideNum = parseSlideDirective(line.trim());
    if (slideNum !== null && slideData) {
      const slide = slideData.slides.find(s => s.number === slideNum);
      if (slide) {
        currentDisplay = slideToDisplay(slide);
        console.log(`  スライド ${slideNum} を適用: "${slide.title || '(無題)'}"`);
      } else {
        console.warn(`  警告: スライド ${slideNum} が見つかりません`);
      }
      continue;
    }

    // 引用ブロックの検出 (旧形式)
    if (line.startsWith(">")) {
      isInQuoteBlock = true;
      quoteBuffer.push(line);
      continue;
    }

    // 引用ブロック終了
    if (isInQuoteBlock && !line.startsWith(">")) {
      currentDisplay = parseQuoteBlock(quoteBuffer);
      quoteBuffer = [];
      isInQuoteBlock = false;
    }

    // 空行はスキップ
    if (line.trim() === "") continue;

    // セリフ行のパース
    const dialogue = parseDialogueLine(line);
    if (dialogue) {
      const emotion = dialogue.emotion || detectEmotion(dialogue.text);
      const voiceText = extractVoiceText(dialogue.text, frontmatter.pronunciations);
      const displayText = extractDisplayText(dialogue.text);

      segmentId++;
      segments.push({
        id: segmentId,
        character: dialogue.character,
        text: displayText,
        voiceText: voiceText,
        emotion: emotion,
        display: currentDisplay,
        voiceFile: `voices/${String(segmentId).padStart(2, "0")}_${encodeCharacterName(dialogue.character)}.wav`,
        durationInFrames: 0,
        pauseAfter: config.video.pauseAfterDefault,
      });

      // 表示は一度使ったらリセット
      currentDisplay = null;
    }
  }

  // 最後の引用ブロックがあれば処理
  if (quoteBuffer.length > 0) {
    currentDisplay = parseQuoteBlock(quoteBuffer);
  }

  return { segments, characters };
}

/**
 * ScriptDataをTypeScriptファイルとして出力
 */
function writeScriptData(scriptData: ScriptData): void {
  const output = `// 自動生成ファイル - 手動編集しないでください
// Generated by scripts/parse-markdown.ts
// Updated by scripts/generate-voices.ts

import type { ScriptData } from "../types.js";

export const scriptData: ScriptData = ${JSON.stringify(scriptData, null, 2)};
`;

  fs.writeFileSync(OUTPUT_PATH, output, "utf-8");
}

/**
 * スライドファイルのパスを解決
 */
function resolveSlideFile(slidesRef: string, manuscriptPath: string): string | null {
  // 相対パスの場合、input/ からの相対パスとして解釈
  const candidates = [
    path.resolve(INPUT_DIR, slidesRef),
    path.resolve(path.dirname(manuscriptPath), slidesRef),
    path.resolve(SLIDES_DIR, path.basename(slidesRef)),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * 台本ファイルを検索
 */
function findManuscriptFile(arg?: string): string {
  if (arg) {
    const filePath = path.isAbsolute(arg) ? arg : path.resolve(process.cwd(), arg);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    throw new Error(`ファイルが見つかりません: ${arg}`);
  }

  // 新ディレクトリ構造を優先
  if (fs.existsSync(MANUSCRIPTS_DIR)) {
    const files = fs.readdirSync(MANUSCRIPTS_DIR).filter(f => f.endsWith(".md"));
    if (files.length > 0) {
      return path.join(MANUSCRIPTS_DIR, files[0]);
    }
  }

  // フォールバック: 旧ディレクトリ
  if (fs.existsSync(LEGACY_MANUSCRIPTS_DIR)) {
    const files = fs.readdirSync(LEGACY_MANUSCRIPTS_DIR).filter(f => f.endsWith(".md"));
    if (files.length > 0) {
      return path.join(LEGACY_MANUSCRIPTS_DIR, files[0]);
    }
  }

  throw new Error("台本ファイルが見つかりません。input/manuscripts/ または manuscripts/ にMarkdownファイルを配置してください");
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);

  let mdPath: string;
  try {
    mdPath = findManuscriptFile(args[0]);
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }

  console.log(`台本をパースしています: ${mdPath}`);

  const mdContent = fs.readFileSync(mdPath, "utf-8");
  const { data: frontmatter, content } = matter(mdContent);

  // Frontmatter検証
  if (!frontmatter.title || !frontmatter.characters) {
    console.error("Error: Frontmatterに title と characters が必要です");
    process.exit(1);
  }

  // スライドファイルの読み込み
  let slideData: SlideData | null = null;
  if (frontmatter.slides) {
    const slideFile = resolveSlideFile(frontmatter.slides, mdPath);
    if (slideFile) {
      console.log(`スライドを読み込み: ${slideFile}`);
      slideData = parseSlides(slideFile);
      console.log(`  スライド数: ${slideData.slides.length}`);
    } else {
      console.warn(`警告: スライドファイルが見つかりません: ${frontmatter.slides}`);
    }
  }

  const { segments, characters } = parseMarkdown(
    content,
    frontmatter as Frontmatter,
    slideData,
    mdPath
  );

  // 既存の durations.json から長さを復元
  let durations: DurationsJson = {};
  if (fs.existsSync(DURATIONS_PATH)) {
    durations = JSON.parse(fs.readFileSync(DURATIONS_PATH, "utf-8"));
  }

  let totalFrames = 0;
  for (const segment of segments) {
    const voiceFileName = path.basename(segment.voiceFile);
    if (durations[voiceFileName]) {
      segment.durationInFrames = durations[voiceFileName].durationInFrames;
    }
    totalFrames += segment.durationInFrames + segment.pauseAfter;
  }

  const config = loadConfig();
  const scriptData: ScriptData = {
    title: frontmatter.title,
    characters,
    bgm: frontmatter.bgm,
    bgmVolume: config.bgm?.volume ?? 0.15,
    segments,
    totalDurationInFrames: totalFrames,
  };

  // 出力ディレクトリを作成
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  writeScriptData(scriptData);

  console.log(`\n出力: ${OUTPUT_PATH}`);
  console.log(`  セグメント数: ${segments.length}`);
  console.log(`  キャラクター: ${characters.map(c => c.name).join(", ")}`);
}

main().catch(console.error);
