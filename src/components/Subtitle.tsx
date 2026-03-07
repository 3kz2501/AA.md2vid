import React from "react";
import { subtitleStyle } from "../fonts";

interface SubtitleProps {
  character: string;
  text: string;
}

export const Subtitle: React.FC<SubtitleProps> = ({ character, text }) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 40,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          borderRadius: 12,
          padding: "14px 28px",
          maxWidth: 1000,
        }}
      >
        <span
          style={{
            ...subtitleStyle,
            color: "#ffcc00",
            marginRight: 16,
          }}
        >
          [{character}]
        </span>
        <span
          style={{
            ...subtitleStyle,
            color: "#ffffff",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
