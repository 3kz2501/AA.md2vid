/**
 * Marp風スライドパーサー
 * --- で区切られたスライドをパースして配列で返す
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface SlideContent {
  /** スライド番号 (1-indexed) */
  number: number;
  /** タイトル行 (# または ## で始まる行) */
  title: string | null;
  /** 本文行 (タイトル以外) */
  body: string[];
  /** 画像パス (![alt](path) 形式から抽出) */
  images: { alt: string; src: string }[];
  /** 生のMarkdown */
  raw: string;
  /** Marp生成画像パス（存在する場合） */
  slideImage?: string;
}

export interface SlideData {
  /** スライド全体のタイトル */
  title: string;
  /** 各スライド */
  slides: SlideContent[];
}

/**
 * 画像パスを抽出
 */
function extractImages(content: string): { alt: string; src: string }[] {
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images: { alt: string; src: string }[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    images.push({ alt: match[1], src: match[2] });
  }
  return images;
}

/**
 * スライドMarkdownをパース
 */
export function parseSlides(filePath: string): SlideData {
  const content = fs.readFileSync(filePath, "utf-8");
  const { data: frontmatter, content: body } = matter(content);

  // --- で分割
  const slideBlocks = body.split(/^---$/m).filter(block => block.trim() !== "");

  // スライド画像ディレクトリを検出（slides/xxx.md → slides/xxx/）
  const slideDir = filePath.replace(/\.md$/, "");
  const hasSlideImages = fs.existsSync(slideDir);

  // スライド画像の命名形式を検出（最初に見つかった形式で統一）
  // 優先: slide.001.png (Marp CLI default) > slide_001.png
  let slideImageFormat: "dot" | "underscore" | null = null;
  if (hasSlideImages) {
    if (fs.existsSync(path.join(slideDir, "slide.001.png"))) {
      slideImageFormat = "dot";
    } else if (fs.existsSync(path.join(slideDir, "slide_001.png"))) {
      slideImageFormat = "underscore";
    }
  }

  const slides: SlideContent[] = slideBlocks.map((block, index) => {
    const lines = block.trim().split("\n");
    const slideNumber = index + 1;

    // タイトル行を検出
    const titleLine = lines.find(line =>
      line.startsWith("# ") || line.startsWith("## ")
    );

    // 本文行 (タイトルと画像行を除く)
    const bodyLines = lines.filter(line => {
      if (line.startsWith("# ") || line.startsWith("## ")) return false;
      if (/^!\[.*\]\(.*\)$/.test(line.trim())) return false;
      return true;
    }).filter(line => line.trim() !== "");

    // 画像を抽出
    const images = extractImages(block);

    // Marp生成画像を検出（検出した形式で統一）
    let slideImage: string | undefined;
    if (slideImageFormat) {
      const paddedNum = String(slideNumber).padStart(3, "0");
      const separator = slideImageFormat === "dot" ? "." : "_";
      const imgPath = path.join(slideDir, `slide${separator}${paddedNum}.png`);
      if (fs.existsSync(imgPath)) {
        // input/ からの相対パスに変換
        const inputDir = path.resolve(process.cwd(), "input");
        slideImage = path.relative(inputDir, imgPath);
      }
    }

    return {
      number: slideNumber,
      title: titleLine ? titleLine.replace(/^##?\s*/, "") : null,
      body: bodyLines,
      images,
      raw: block.trim(),
      slideImage,
    };
  });

  return {
    title: frontmatter.title || "",
    slides,
  };
}

/**
 * スライドをscript用のdisplay配列に変換
 */
export function slideToDisplay(slide: SlideContent): string[] {
  // Marp生成画像がある場合はそれを使用
  if (slide.slideImage) {
    return [`@slideImage:${slide.slideImage}`];
  }

  // フォールバック: Markdown解析結果を使用
  const display: string[] = [];

  if (slide.title) {
    // h1かh2かを判定
    const prefix = slide.raw.includes("## ") && !slide.raw.includes("# " + slide.title)
      ? "## "
      : "# ";
    display.push(prefix + slide.title);
    display.push("");
  }

  // 本文を追加
  for (const line of slide.body) {
    display.push(line);
  }

  // 画像を追加 (特殊マーカー)
  for (const img of slide.images) {
    display.push(`![${img.alt}](${img.src})`);
  }

  return display;
}

// CLI実行時のみmain()を実行
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log("Usage: npx tsx scripts/parse-slides.ts <slide.md>");
    process.exit(1);
  }

  const filePath = path.isAbsolute(args[0])
    ? args[0]
    : path.resolve(process.cwd(), args[0]);

  const data = parseSlides(filePath);
  console.log("スライドをパースしました:", filePath);
  console.log("  タイトル:", data.title);
  console.log("  スライド数:", data.slides.length);
  console.log("");

  for (const slide of data.slides) {
    console.log(`--- Slide ${slide.number} ---`);
    console.log("Title:", slide.title);
    console.log("Body:", slide.body.join(" | "));
    console.log("Images:", slide.images.map(i => i.src).join(", ") || "なし");
    console.log("");
  }
}

// 直接実行時のみmainを呼び出す（インポート時はスキップ）
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(console.error);
}
