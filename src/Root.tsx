import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { scriptData } from "./data/script";

export const RemotionRoot: React.FC = () => {
  // 最低1フレームは必要
  const duration = Math.max(scriptData.totalDurationInFrames, 30);

  return (
    <>
      <Composition
        id="Video"
        component={Video}
        durationInFrames={duration}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
