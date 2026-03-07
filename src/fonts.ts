import { staticFile, continueRender, delayRender } from "remotion";

/**
 * AA表示用フォントを読み込み（レンダリング時も確実に）
 */
export const loadAAFont = async (): Promise<void> => {
  const fontUrl = staticFile("fonts/aahub_light.woff2");

  try {
    const font = new FontFace("aahub_light", `url(${fontUrl}) format("woff2")`);
    const loadedFont = await font.load();
    document.fonts.add(loadedFont);

    // フォントが実際に使用可能になるまで待機
    await document.fonts.ready;
    console.log("aahub_light font loaded successfully");
  } catch (err) {
    console.warn("Failed to load aahub_light font:", err);
    // フォールバックフォントで続行
  }
};

/**
 * 字幕用フォント（Google Fonts）
 */
export const subtitleFontUrl =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap";

/**
 * 字幕用CSS
 */
export const subtitleStyle: React.CSSProperties = {
  fontFamily: '"Noto Sans JP", sans-serif',
  fontWeight: 700,
  fontSize: 36,
};
