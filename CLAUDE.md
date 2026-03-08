# CLAUDE.md

Claude Code向けのプロジェクトガイド。

## プロジェクト概要

Markdown台本からやる夫・やらない夫の掛け合い動画（MP4）を自動生成するツール。

## ユーザーからの依頼パターン

### パターン1: テーマだけ渡される場合

「〇〇について解説動画を作って」のような依頼の場合：

1. **スライド作成**: `input/slides/{topic}.md` にMarpスライドを作成
2. **PNG生成**: Marp CLIでスライドをPNG化
3. **台本作成**: `input/manuscripts/{topic}.md` にやる夫・やらない夫の会話劇を作成
4. **プリプロセス実行**: `npm run preprocess -- --manuscript {topic}`
5. **レンダリング**: `npm run render`

### パターン2: 台本の内容を指定される場合

台本の内容やセリフが指定された場合：

1. 指定内容を基に `input/manuscripts/` に台本を作成
2. 必要に応じてスライドも作成
3. プリプロセス→レンダリング

### パターン3: 既存台本の修正

既存の台本を修正する場合：

1. `input/manuscripts/` 内のファイルを編集
2. プリプロセスを再実行

## 台本作成のコツ

### やる夫・やらない夫の役割分担

- **やる夫**: 視聴者目線、質問役、素朴な疑問、驚き担当
- **やらない夫**: 解説役、説明担当、ツッコミ

### 会話の流れ

```markdown
[やる夫] 〇〇って何だお？

[やらない夫:explain] 〇〇というのは△△のことだ。

[やる夫:surprised] そうだったのかお！

[やらない夫] 具体的には...
```

### 感情タグの使い分け

- 驚き・発見: `surprised`
- 理解した時: `happy`
- 困った時: `troubled`
- 説明する時: `explain`（やらない夫）
- 考え中: `thinking`（やらない夫）

## ディレクトリ構成

```
AA.md2vid/
├── input/
│   ├── manuscripts/          # 台本（Markdown）
│   │   └── _template.md      # テンプレート（_始まりは処理対象外）
│   ├── slides/               # スライド
│   │   ├── example.md        # Marpスライド
│   │   └── example/          # PNG出力先（スライドと同名のディレクトリ）
│   │       └── slide.001.png # Marp CLI出力形式
│   └── images/               # その他画像素材
├── public/
│   ├── fonts/                # フォント（aahub_light等）
│   ├── bgm/                  # BGMファイル
│   └── voices/               # 生成音声（自動生成、gitignore）
├── characters/
│   ├── yaruo.json            # やる夫パーツデータ
│   ├── yaranai.json          # やらない夫全身データ
│   └── mlt/                  # 元データ（MLTファイル）
├── src/
│   ├── components/           # Remotionコンポーネント
│   ├── aa/                   # AA合成ロジック
│   │   ├── builder.ts        # AA組み立て
│   │   ├── emotions.ts       # 感情プリセット
│   │   └── characters.ts     # キャラクターデータ読み込み
│   ├── data/                 # パース結果（自動生成）
│   │   └── script.ts         # 台本データ
│   └── types.ts              # 型定義
├── scripts/                  # ビルドスクリプト
│   ├── preprocess.ts         # メイン前処理
│   ├── parse-markdown.ts     # 台本パーサー
│   └── parse-slides.ts       # スライドパーサー
├── config.yaml               # 設定ファイル
└── docs/images/              # README用画像
```

## 主要コマンド

```bash
# スライドPNG化（絶対パス必須）
npx @marp-team/marp-cli --no-stdin "$(pwd)/input/slides/example.md" --images png -o "$(pwd)/input/slides/example/slide.png"
# 出力: slide.001.png, slide.002.png, ...

# プリプロセス（台本パース + 音声生成）
npm run preprocess -- --manuscript example

# プレビュー
npm run studio

# レンダリング
npm run render
```

## 完全ワークフロー例

テーマ「ビットコインの仕組み」で動画を作成する場合：

### 1. スライド作成

```bash
# input/slides/bitcoin.md を作成
```

```markdown
---
marp: true
theme: default
paginate: true
---

# ビットコインの仕組み

やる夫と学ぶ暗号通貨入門

---

# ビットコインとは？

- 2009年に誕生した暗号通貨
- 中央管理者がいない
- ブロックチェーン技術を使用

---

# ブロックチェーンの仕組み

...
```

### 2. スライドPNG化

```bash
mkdir -p input/slides/bitcoin
npx @marp-team/marp-cli --no-stdin "$(pwd)/input/slides/bitcoin.md" --images png -o "$(pwd)/input/slides/bitcoin/slide.png"
```

### 3. 台本作成

```bash
# input/manuscripts/bitcoin.md を作成
```

```markdown
---
title: やる夫で学ぶビットコイン
bgm: bgm/chillhop.mp3
slides: slides/bitcoin.md
characters:
  - name: やる夫
    voiceId: 3
    direction: left
  - name: やらない夫
    voiceId: 13
    direction: right
pronunciations:
  "Bitcoin": "ビットコイン"
---

@slide 1

[やる夫] ビットコインって最近よく聞くけど、何なんだお？

[やらない夫:explain] ビットコインは世界初の暗号通貨だ。2009年にサトシ・ナカモトという人物が作ったんだ。

@slide 2

[やる夫:surprised] 暗号通貨って普通のお金と何が違うんだお？

[やらない夫] 大きな違いは中央管理者がいないことだ。銀行も政府も介在しない。

...
```

### 4. プリプロセス＆レンダリング

```bash
npm run preprocess -- --manuscript bitcoin
npm run render
# → out/video.mp4 に出力
```

## 台本フォーマット

```markdown
---
title: タイトル
bgm: bgm/file.mp3
slides: slides/example.md
characters:
  - name: やる夫
    voiceId: 3
    direction: left
  - name: やらない夫
    voiceId: 13
    direction: right
pronunciations:
  "難読語": "よみかた"
---

@slide 1

[やる夫] セリフだお。

[やらない夫:explain] 感情付きセリフだ。

@slide 2

[やる夫:surprised] 次のスライドだお！
```

## 感情タグ一覧

### やる夫
| タグ | 用途 |
|------|------|
| `normal` | 通常 |
| `happy` | 喜び、理解した時 |
| `sad` | 悲しみ |
| `cry` | 泣き |
| `angry` | 怒り |
| `surprised` | 驚き |
| `troubled` | 困惑 |
| `shy` | 照れ |
| `grit` | 歯を食いしばる |
| `dead` | 死んだ目 |
| `wink` | ウインク |

### やらない夫
| タグ | 用途 |
|------|------|
| `normal` | 通常 |
| `explain` | 説明する時 |
| `happy` | 喜び |
| `happy2` | 喜び2 |
| `sad` | 悲しみ |
| `despair` | 絶望 |
| `angry` | 怒り |
| `thinking` | 考え中 |
| `question` | 疑問 |
| `pointing` | 指差し |
| `waving` | 手を振る |
| `arms_crossed` | 腕組み |
| `casual` | カジュアル |

## 注意事項

- VOICEVOXが起動している必要がある（`http://localhost:50021`）
- Marp CLIは**絶対パス**と**--no-stdin**が必要
- `_` で始まるファイルは処理対象外（テンプレート用）
- 音声ファイルは `public/voices/` に自動生成（gitignore済み）
- スライド画像は `slide.001.png` と `slide_001.png` 両方の命名に対応
