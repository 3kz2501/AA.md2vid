// キャラクターデータの静的インポート
// Remotionのブラウザ環境でfsが使えないため、ビルド時にインライン化

import yaruoData from "../../characters/yaruo.json";
import yaranaiData from "../../characters/yaranai.json";
import type { CharacterParts, FullBodyCharacter } from "../types";

/**
 * JSONインポート時に失われるtuple型を復元
 */
function fixSlotMapMouth(data: unknown): CharacterParts {
  const d = data as CharacterParts;
  const mouth = d.slotMap.mouth as unknown as number[];
  return {
    ...d,
    slotMap: {
      ...d.slotMap,
      mouth: [mouth[0], mouth[1]] as [number, number],
    },
  };
}

export const yaruoParts: CharacterParts = fixSlotMapMouth(yaruoData);
export const yaranaiFullBody: FullBodyCharacter = yaranaiData as FullBodyCharacter;

export function getYaruoData(): CharacterParts {
  return yaruoParts;
}

export function getYaranaiData(): FullBodyCharacter {
  return yaranaiFullBody;
}
