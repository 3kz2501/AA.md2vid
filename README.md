# AA.md2vid

Markdownで台本を書くだけで、やる夫・やらない夫が掛け合いする解説動画（MP4）を自動生成するツール。

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 特徴

- **Markdown台本 → 動画**: シンプルなMarkdown形式で台本を書くだけ
- **Marpスライド対応**: プレゼンスライドを背景に表示
- **VOICEVOX音声合成**: 無料の音声合成エンジンで自然な読み上げ
- **AAキャラクター**: 2chの人気キャラクター（やる夫・やらない夫）を表情豊かに表示
- **感情表現**: セリフごとに感情タグで表情を切り替え

## 必要環境

- **Node.js** 18以上
- **Chromium** (Marp CLIのPNG生成に必要)
- **VOICEVOX** (音声合成エンジン)
- **ffmpeg** (動画レンダリングに必要)

## インストール

### 1. システム依存ツール（Ubuntu/Debian）

```bash
# Chromium依存ライブラリ
sudo apt-get update && sudo apt-get install -y \
  libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
  libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
  libxrandr2 libgbm1 libasound2t64

# Chromium (Marp CLIのPNG生成に必要)
sudo apt install chromium-browser

# ffmpeg (Remotionのレンダリングに必要)
sudo apt install ffmpeg
```

### 2. VOICEVOX

[VOICEVOX公式サイト](https://voicevox.hiroshiba.jp/)からダウンロード。

```bash
# 起動
cd ${VOICEBOX_DIR}/VOICEVOX/vv-engine
./run # http://localhost:50021 でAPIが利用可能
```

### 3. プロジェクト

```bash
git clone https://github.com/3kz2501/AA.md2vid.git
cd AA.md2vid
npm install
```

## 使い方

### Step 1: VOICEVOXを起動

VOICEVOXを起動してください。デフォルトで `http://localhost:50021` でAPIが利用可能になります。

### Step 2: 台本を作成

`input/manuscripts/` に台本ファイル（Markdown）を作成します。

```markdown
---
title: やる夫で学ぶ〇〇
bgm: bgm/example_bgm.mp3
slides: slides/example.md
characters:
  - name: やる夫
    voiceId: 3
    direction: left
  - name: やらない夫
    voiceId: 13
    direction: right
pronunciations:
  "API": "エーピーアイ"
  "JSON": "ジェイソン"
---

@slide 1

[やる夫] 最初のセリフだお。

[やらない夫:explain] 説明するセリフだ。

@slide 2

[やる夫:surprised] 驚きのセリフだお！

[やらない夫:thinking] 考えながら話すセリフだな。
```

テンプレートは `input/manuscripts/_template.md` を参照してください。

### Step 3: スライドを作成（オプション）

`input/slides/` にMarp形式のスライドを作成します。

```markdown
---
marp: true
theme: default
paginate: true
style: |
  section {
    font-size: 24px;
  }
---

# スライド1: タイトル

- ポイント1
- ポイント2

---

# スライド2: 詳細

詳細な説明...
```

### Step 4: スライドを画像化

Marp CLIでスライドをPNG画像に変換します。

> **Note**: Marp CLIは絶対パスが必要です。

```bash
npx @marp-team/marp-cli "$(pwd)/input/slides/example.md" --images png -o "$(pwd)/input/slides/example/slide"
```

出力: `input/slides/example/slide_001.png`, `slide_002.png`, ...

- 出力されたPNG のスライド番号を台本の中で関連する会話の手前に`@slide1` のように記載すると画面中央にスライドが表示されます。

### Step 5: プリプロセス（必須）

```bash
# プリプロセス（台本パース + 音声生成）
npm run preprocess -- --manuscript example
```

**プリプロセスの処理内容:**

1. 指定した台本（`input/manuscripts/example.md`）をパース
2. VOICEVOXで各セリフの音声ファイルを生成（`public/voices/`）
3. スクリプトデータを出力（`src/data/script.ts`）

> **Note**: 台本が1つだけの場合は `--manuscript` 省略可。`_` で始まるファイル（テンプレート等）は自動選択から除外されます。

> **重要**: プリプロセスは **プレビュー（studio）・レンダリング（render）の両方で必須** です。台本を変更した場合も再度プリプロセスが必要です。

### Step 6: プレビュー & レンダリング

```bash
# プレビュー（Remotion Studio）
npm run studio
# → ブラウザで http://localhost:3000 が開く

# 動画レンダリング
npm run render
# → out/video.mp4 に出力
```

**studio / render はどちらも preprocess で生成されたデータを使用します。** 別の台本に切り替えたい場合は、先に `preprocess` を実行してください。

### レンダリングオプション

```bash
# GPU エンコード + 並列処理
npx remotion render Video out/video.mp4 --hardware-acceleration=if-possible --concurrency=8

# 出力ファイル名を指定
npx remotion render Video out/my_video.mp4
```

### 一括実行

```bash
npm run build
```

> `build` は `parse-mlt → preprocess → render` を順に実行します。台本が複数ある場合は最初に見つかったものが使われます。

## 台本フォーマット

### Frontmatter（YAML）

```yaml
---
title: 動画タイトル
bgm: bgm/bgm_file.mp3 # BGMファイル（public/配下）
slides: slides/slide_file.md # スライドファイル
characters:
  - name: やる夫
    voiceId: 3 # VOICEVOX話者ID
    direction: left # 画面配置（left/right）
  - name: やらない夫
    voiceId: 13
    direction: right
pronunciations: # 読み替え辞書
  "難読語": "読み方"
---
```

### セリフ記法

```markdown
[キャラ名] 通常のセリフ
[キャラ名:感情] 感情指定付きセリフ
```

### スライド切り替え

```markdown
@slide 1

[やる夫] このセリフはスライド1の上で表示されるお。

@slide 2

[やらない夫] ここからスライド2だ。
```

## 感情タグ一覧

### やる夫

| タグ        | 説明               |
| ----------- | ------------------ |
| `normal`    | 通常（デフォルト） |
| `happy`     | 喜び               |
| `sad`       | 悲しみ             |
| `cry`       | 泣き               |
| `angry`     | 怒り               |
| `surprised` | 驚き               |
| `troubled`  | 困惑               |
| `shy`       | 照れ               |
| `grit`      | 歯を食いしばる     |
| `dead`      | 死んだ目           |
| `wink`      | ウインク           |

### やらない夫

| タグ           | 説明               |
| -------------- | ------------------ |
| `normal`       | 通常（デフォルト） |
| `explain`      | 説明               |
| `happy`        | 喜び               |
| `happy2`       | 喜び2              |
| `sad`          | 悲しみ             |
| `despair`      | 絶望               |
| `angry`        | 怒り               |
| `thinking`     | 考え中             |
| `question`     | 疑問               |
| `pointing`     | 指差し             |
| `waving`       | 手を振る           |
| `arms_crossed` | 腕組み             |
| `casual`       | カジュアル         |

## ディレクトリ構成

```
AA.md2vid/
├── input/
│   ├── manuscripts/     # 台本（Markdown）
│   ├── slides/          # スライド（Marp MD + 生成PNG）
│   └── images/          # 画像素材
├── public/
│   ├── fonts/           # フォント（aahub_light等）
│   ├── bgm/             # BGMファイル
│   └── voices/          # 生成音声（自動生成）
├── characters/          # キャラクターAAデータ
│   ├── yaruo.json       # やる夫（パーツ合成方式）
│   └── yaranai.json     # やらない夫（全身差し替え方式）
├── src/
│   ├── components/      # Remotionコンポーネント
│   ├── aa/              # AA合成ロジック
│   └── data/            # パース結果（自動生成）
├── scripts/             # ビルドスクリプト
├── config.yaml          # 設定ファイル
└── out/                 # 出力動画
```

## 設定ファイル（config.yaml）

主要な設定項目:

```yaml
voicevox:
  endpoint: "http://localhost:50021"
  defaults:
    speedScale: 1.0

video:
  width: 1920
  height: 1080
  fps: 30

bgm:
  volume: 0.15
```

詳細は `config.yaml` を参照してください。

## VOICEVOX話者ID

| キャラ     | 推奨話者               | ID  |
| ---------- | ---------------------- | --- |
| やる夫     | ずんだもん（ノーマル） | 3   |
| やらない夫 | 玄野武宏（ノーマル）   | 11  |

他の話者は VOICEVOX起動後 `http://localhost:50021/speakers` で確認できます。

## ライセンス・利用規約

本ツールのソースコードは MIT License で公開しています。

**ただし、本ツールを使用して動画を作成・公開する際は、以下の各ツール・素材の利用規約を遵守してください。**

### VOICEVOX（音声合成）

VOICEVOXで生成した音声を利用する際は、以下を遵守してください:

1. **クレジット表記が必須**: 動画内または概要欄に「VOICEVOX:キャラ名」を記載
2. **各キャラクターの利用規約に従う**: キャラクターごとに規約が異なります

#### 推奨話者の利用規約

| 話者       | ID  | 商用利用 | クレジット                 | 備考                                                                                            |
| ---------- | --- | -------- | -------------------------- | ----------------------------------------------------------------------------------------------- |
| ずんだもん | 3   | 可       | VOICEVOX:ずんだもん        | [利用規約](https://zunko.jp/con_ongen_kiyaku.html)                                              |
| 玄野武宏   | 11  | 可       | VOICEVOX:玄野武宏(CV:ガロ) | [利用規約](https://www.virvoxproject.com/voicevox%E3%81%AE%E5%88%A9%E7%94%A8%E8%A6%8F%E7%B4%84) |

詳細: [VOICEVOXソフトウェア利用規約](https://voicevox.hiroshiba.jp/term/)

### Remotion（動画生成フレームワーク）

- **個人・3人以下の企業**: 無料で商用利用可
- **4人以上の企業**: [有料ライセンス](https://www.remotion.dev/docs/license)が必要

### その他のライブラリ・素材

| ライブラリ                                                          | ライセンス | 備考             |
| ------------------------------------------------------------------- | ---------- | ---------------- |
| [Marp](https://marp.app/)                                           | MIT        | スライド生成     |
| [aahub_light](https://fonts.aahub.org/)                             | -          | AA表示用フォント |
| [Noto Sans JP](https://fonts.google.com/noto/specimen/Noto+Sans+JP) | OFL        | 字幕用フォント   |

### クレジット表記例

動画の概要欄に以下のように記載することを推奨します:

```
音声: VOICEVOX:ずんだもん、VOICEVOX:玄野武宏(CV:ガロ)
動画生成: Remotion
```

### 参考プロジェクト

- [markdown-to-zundamon](https://github.com/motemen/markdown-to-zundamon)
- [remotion-voicevox-template](https://github.com/nyanko3141592/remotion-voicevox-template)
