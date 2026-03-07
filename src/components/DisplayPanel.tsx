import React from "react";
import { Img, staticFile } from "remotion";

interface DisplayPanelProps {
  content: string[] | null;
}

/**
 * 画像マークダウンをパース
 * ![alt](src) 形式を検出
 */
function parseImageLine(line: string): { alt: string; src: string } | null {
  const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (!match) return null;
  return { alt: match[1], src: match[2] };
}

/**
 * 画像パスを解決
 * - images/xxx.png → input/images/xxx.png (staticFile経由)
 * - /absolute/path → そのまま
 * - https://... → そのまま
 */
function resolveImageSrc(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  if (src.startsWith("/")) {
    return src;
  }
  // 相対パスはinput/配下と仮定
  return staticFile(`input/${src}`);
}

export const DisplayPanel: React.FC<DisplayPanelProps> = ({ content }) => {
  if (!content || content.length === 0) {
    return null;
  }

  // Marp生成画像の場合
  if (content.length === 1 && content[0].startsWith("@slideImage:")) {
    const imagePath = content[0].replace("@slideImage:", "");
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img
          src={staticFile(`input/${imagePath}`)}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            borderRadius: 8,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        />
      </div>
    );
  }

  // タイトル行（# で始まる行）を分離
  const titleLine = content.find(line => line.startsWith("# ") || line.startsWith("## "));
  const bodyLines = content.filter(line => !line.startsWith("# ") && !line.startsWith("## "));

  // コンテンツ量に応じてフォントサイズを調整
  const totalChars = bodyLines.join("").length;
  const lineCount = bodyLines.filter(l => l.trim()).length;
  let baseFontSize = 32;
  let lineMargin = 12;
  let padding = 40;

  if (lineCount > 15 || totalChars > 800) {
    baseFontSize = 22;
    lineMargin = 6;
    padding = 25;
  } else if (lineCount > 10 || totalChars > 500) {
    baseFontSize = 26;
    lineMargin = 8;
    padding = 30;
  } else if (lineCount > 6 || totalChars > 300) {
    baseFontSize = 28;
    lineMargin = 10;
    padding = 35;
  }

  // 画像とテキストを分離
  const images: { alt: string; src: string }[] = [];
  const textLines: string[] = [];

  for (const line of bodyLines) {
    const img = parseImageLine(line.trim());
    if (img) {
      images.push(img);
    } else {
      textLines.push(line);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        maxHeight: "100%",
        overflow: "hidden",
      }}
    >
      {/* タイトル */}
      {titleLine && (
        <div
          style={{
            backgroundColor: "rgba(30, 30, 60, 0.9)",
            borderRadius: 12,
            padding: "16px 32px",
            marginBottom: 20,
          }}
        >
          <h1
            style={{
              fontSize: titleLine.startsWith("# ") ? 42 : 36,
              margin: 0,
              color: "#fff",
              fontFamily: '"Noto Sans JP", sans-serif',
              fontWeight: 700,
            }}
          >
            {titleLine.replace(/^##?\s*/, "")}
          </h1>
        </div>
      )}

      {/* 本文（背景として大きく） */}
      {(textLines.length > 0 || images.length > 0) && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: 20,
            padding: `${padding}px ${padding + 10}px`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            overflow: "hidden",
          }}
        >
          {/* テキストコンテンツ */}
          {textLines.map((line, i) => {
            if (line.startsWith("- ")) {
              return (
                <div
                  key={`text-${i}`}
                  style={{
                    fontSize: baseFontSize,
                    margin: `${lineMargin}px 0`,
                    paddingLeft: 30,
                    color: "#333",
                    fontFamily: '"Noto Sans JP", sans-serif',
                  }}
                >
                  • {line.slice(2)}
                </div>
              );
            }
            if (/^\d+\.\s/.test(line)) {
              return (
                <div
                  key={`text-${i}`}
                  style={{
                    fontSize: baseFontSize,
                    margin: `${lineMargin}px 0`,
                    paddingLeft: 30,
                    color: "#333",
                    fontFamily: '"Noto Sans JP", sans-serif',
                  }}
                >
                  {line}
                </div>
              );
            }
            if (line.trim() === "") {
              return <div key={`text-${i}`} style={{ height: lineMargin }} />;
            }
            return (
              <p
                key={`text-${i}`}
                style={{
                  fontSize: baseFontSize,
                  margin: `${lineMargin}px 0`,
                  color: "#333",
                  fontFamily: '"Noto Sans JP", sans-serif',
                }}
              >
                {line}
              </p>
            );
          })}

          {/* 画像コンテンツ */}
          {images.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 20,
                marginTop: textLines.length > 0 ? 20 : 0,
                flex: 1,
                minHeight: 0,
              }}
            >
              {images.map((img, i) => (
                <div
                  key={`img-${i}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    maxWidth: images.length === 1 ? "80%" : `${80 / images.length}%`,
                    maxHeight: "100%",
                  }}
                >
                  <Img
                    src={resolveImageSrc(img.src)}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      borderRadius: 8,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  />
                  {img.alt && (
                    <p
                      style={{
                        fontSize: 20,
                        color: "#666",
                        marginTop: 8,
                        fontFamily: '"Noto Sans JP", sans-serif',
                      }}
                    >
                      {img.alt}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
