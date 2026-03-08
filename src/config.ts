import fs from "fs";
import path from "path";
import YAML from "yaml";
import type { Config } from "./types";

const CONFIG_PATH = path.resolve(process.cwd(), "config.yaml");

let cachedConfig: Config | null = null;

export function loadConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configContent = fs.readFileSync(CONFIG_PATH, "utf-8");
  cachedConfig = YAML.parse(configContent) as Config;
  return cachedConfig;
}

export function getCharacterConfig(name: string) {
  const config = loadConfig();
  const key = name.toLowerCase().replace(/[^a-z]/g, "");

  // 名前マッチング: "やる夫" → "yaruo", "やらない夫" → "yaranai"
  const nameMap: Record<string, string> = {
    "yaruo": "yaruo",
    "yaranai": "yaranai",
    "やる夫": "yaruo",
    "やらない夫": "yaranai",
  };

  const configKey = nameMap[name] || key;
  return config.characters[configKey];
}

export function getVoicevoxEndpoint(): string {
  // Environment variable takes precedence (for Docker)
  return process.env.VOICEVOX_ENDPOINT || loadConfig().voicevox.endpoint;
}

export function getVideoConfig() {
  return loadConfig().video;
}

export function getFontConfig() {
  return loadConfig().fonts;
}

export function getEmotionKeywords() {
  return loadConfig().emotionKeywords;
}
