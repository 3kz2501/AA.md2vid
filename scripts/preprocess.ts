/**
 * プリプロセス統合スクリプト
 * 台本パース + 音声生成を順に実行
 */

import { spawn } from "child_process";
import path from "path";

const scriptsDir = path.dirname(new URL(import.meta.url).pathname);

function runScript(scriptName: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("tsx", [path.join(scriptsDir, scriptName), ...args], {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${scriptName} exited with code ${code}`));
      }
    });

    proc.on("error", reject);
  });
}

async function main() {
  const args = process.argv.slice(2);

  try {
    // 台本パース（引数をそのまま渡す）
    await runScript("parse-markdown.ts", args);

    // 音声生成（引数不要）
    await runScript("generate-voices.ts", []);

    console.log("\nプリプロセス完了!");
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }
}

main();
