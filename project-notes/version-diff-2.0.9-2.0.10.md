# 版本对照：社区 v2.0.9 → v2.0.10 ｜ 官方内核 0.1.5-rc.1 → 0.1.5-rc.2

> 调查日期：2026-09-15　方法：git 本地历史 + GitHub API（官方 release / commit）+ 解包逐文件内容比对
> 结论一句话：**两边都是"优化"，没有任何新功能、没有新包**。

---

## 一、官方内核（DeepSeek 官方）0.1.5-rc.1 → 0.1.5-rc.2

**提交数：4 个**（其中 2 个是 merge），实质代码提交只有 1 个。

| SHA | 日期 | 说明 |
|---|---|---|
| `060323d` | 09-10 | `feat(web): backport feedback and file refinements to 0.1.5` ← **唯一的实质改动** |
| `2107e46` | 09-10 | merge PR #3973 |
| `a305303` | 09-10 | `release(dsh): 0.1.5-rc.2`（版本号） |
| `fb2c4b9` | 09-10 | merge PR #3978 ← **= tag `dsh-v0.1.5-rc.2`** |

### 官方 release notes（`dsh-v0.1.5-rc.2`，原文）

> **体验优化**
> - 优化反馈提交体验：点赞和点踩均通过弹窗确认后提交，提交失败时保留已填写内容并给出提示。@yixiangihsiang
> - 优化交付文件卡片的排版和对话间距，更新代码文件图标，让文件更易辨认、界面更紧凑。@yixiangihsiang
>
> **Improvements**
> - Improve feedback submission: both likes and dislikes are confirmed in a dialog before being recorded. If submission fails, show a notice and keep the entered feedback.
> - Refine delivered-file card layouts and conversation spacing, and refresh code-file icons…

**注意官方自己把它归类为「体验优化 / Improvements」，不是 Features。**

### 改动本质：把 master 上的两个 PR 回移植到 0.1.5 分支

- PR **#3928** / PR **#3902** 的选定改动（`Refs #3927` / `Refs #3903`）
- 明确"保留 baseline session recordings、排除更新的 master 提交" → **是一次挑选式 backport，不是整条主线合并**
- 该提交 stats：`778 additions / 778 deletions`（1556 行）—— 量级很小

### 包级实测（解包逐文件比对，忽略 `package.json` 版本行）

- 包总数 **265 → 265，新增 0 / 删除 0** → **没有任何新包**

**真正有内容变化（功能相关）：**

| 包 | 变化 | 对应 release note |
|---|---|---|
| `dsh-client-ui-primitives` | `lib/index.js` **396049 → 431412（+35 KB）**；新增 `lib/types/code-file-icon-artwork.d.ts`；删除 `lib/types/DocumentFileIcon.d.ts`、`lib/types/markdown/MessageText.d.ts`、`lib/markdown/MessageText.module.css` | "更新代码文件图标"（48 项固定图稿表） |
| `dsh-client-ui-message-feedback` | **12 个文件变**：`lib/client.js`、`controller/dialog/FeedbackDialog/index/MessageFeedbackActions/slots/surface.d.ts`、README | "点赞和点踩均通过弹窗确认后提交" |
| `dsh-client-ui-deliverables` | `lib/client.js` **+140 B**、README | "交付文件卡片排版" |
| `dsh-client-ui-chat` | `lib/client.js` **-500 B**、README | "对话间距"（新增 `turn-tail-spacing` 测试） |
| `dsh-web-frontend` | 前端 bundle 重建（`index-*.js` 哈希换名）、`index.html` | 上述 UI 的总装 |
| `dsh-client-ui-tool` / `dsh-client-ui-sidebar` | `lib/client.js` 微调（+22 B / **-29 B**） | 排版微调 |
| `dsh-command-feedback` | 仅 README 文案 | — |

**只删了"孤儿构建产物"（无功能影响）：** `dsh-session-persistence`（3 个 `.d.ts`）、`dsh-session`（`chunk-rows.*`）、`dsh-agent`（`inbox.*`）、`dsh-subagent`（`descriptor-seed.*`）、`dsh-message-feedback`（`spec.*`）、`dsh-client-ui-chat`（3 个 `.d.ts`）、`dsh-client-ui-tool`（1 个 `.d.ts`）
→ 判定依据：这些包的**主 bundle（`lib/index.js` / `lib/client.js`）一字未改**，说明没有任何代码引用它们 → 属 rc.1 构建时的多余产物，rc.2 清理掉了。

**⚠️ 判据警告**：`manifest.json` 里 **265 个包的 sha256 全都不同** —— 因为每个包内 `package.json` 的版本串 `0.1.5-rc.1`→`-rc.2` 都变了。**sha256 差异 ≠ 内容改过**；要看「体积 delta 是否超出 ±1~7 字节的版本串噪声」或直接解包比对。

---

## 二、社区版（DSH Desktop）v2.0.9 → v2.0.10

**提交数：10 个**（`v2.0.9..v2.0.10`）。改动 `541` 个路径，其中 **476 个是 vendor tgz**（内核换代），非 vendor 仅 65 个。

| SHA | 提交 | 内容 |
|---|---|---|
| `c738b8f3` | `chore(upstream): pin DeepSeek Harness 0.1.5-rc.2` | 只改 gitlink + `upstream.json`：`183f08e9c6`(rc.1) → `fb2c4b9e69`(rc.2) |
| `8dd2cf04` | `chore(runtime): upgrade DSH packages to 0.1.5-rc.2` | 重建 vendored runtime：`vendor/dsh-runtime/0.1.5-rc.2/`（265 tgz+manifest）、539 条根 resolutions、两个 desktop 版 + market 的依赖区间；**13 个社区补丁只改名 `@0.1.5-rc.1.patch`→`@0.1.5-rc.2.patch`，内容逐字节相同**（`expectedResolution()` 靠 `patch:` 协议继续解析）；5 个第三方补丁未动。**明确写 "No src/ changes."** |
| `c84837d5` | `chore(desktop): bump product version to 2.0.10` | 版本号 2.0.9 → 2.0.10（根 `package.json` 按设计不带版本） |
| `09070dd7` | `feat(desktop): package Windows without ASAR` | 见下 |
| `c7e1dbc9` | `fix(desktop): verify no-ASAR portable Windows archive` | 便携版校验跟着改 |
| `83cc4f82` | `fix(desktop): disable ASAR across editions and platforms` | **扩大到全部平台/两个版** |
| `fea9287036` | `fix(beta): align Windows packaging options with stable` | beta 对齐 stable |

### 唯一的行为变化：打包时不再使用 ASAR

`dsh-plugin-desktop/package.json` 的 `build` 段实测 diff：

```diff
-    "asar": { "smartUnpack": true },
+    "asar": false,
     "electronFuses": {
-      "enableEmbeddedAsarIntegrityValidation": true,
-      "onlyLoadAppFromAsar": true,
+      "enableEmbeddedAsarIntegrityValidation": false,
+      "onlyLoadAppFromAsar": false,
```
- 删除 `mac/win/linux` 三处的 `asarUnpack` 清单
- `win` 新增 `"compression": "normal"`；`mac`/`linux` 各加 `"asar": false`
- 新增 `src/packaged-filesystem-smoke.ts` + 对应测试；`verify-electron-fuses.ts` / `verify-packaged-runtime.ts` / `verify-win-portable.ts` / `package-win.ts` 跟着适配

**影响**：产物结构从 `resources/app.asar` 变为**解包目录**（`resources/app/…`）；fuse 期望值反转；安装体积/文件数会变。**这属于打包层变化，不影响功能逻辑**，但升级后必须重新实机验证。

### 未变的事

- ✅ `package:dir` 的 Windows 缺陷 **2.0.10 仍未修** → 继续用 `yarn dist:win`
- ✅ 13 个社区补丁内容与 rc.1 完全一致（只改名）
- ✅ 没有新增/删除任何包

---

## 三、结论（回答"是新东西还是小优化"）

| 问 | 答 |
|---|---|
| 官方加了新功能吗？ | **没有**。官方自己标为「体验优化」，只有 2 条：①反馈提交改弹窗确认（点赞也走弹窗、失败保留草稿）②交付文件卡片排版+对话间距+代码文件图标。是一次挑选式 backport（PR #3928/#3902）。 |
| 官方加了新包/删了包吗？ | **没有**。265 → 265。 |
| 社区加了新东西吗？ | **没有新功能**。10 个提交里 3 个是版本号/依赖换代、4 个是"Windows 打包不开 ASAR"及其适配。 |
| 那这次升级的价值是什么？ | ① 拿到官方那 2 条体验优化；② 内核版本跟到 rc.2 不落后；③ 打包方式与官方主线一致（不开 ASAR）。**改动量小、风险低** —— 适合按"先升级、后改动 DIY"的方针走。 |

## 四、对我们升级的直接影响（预检结论）

1. **补丁适配**（我方 3 个）：
   - `dsh-api-session-controller@0.1.5-rc.1.patch` → 改名即可（目标包内容 0 变化）
   - `dsh-session-persistence-jsonl@0.1.5-rc.1.patch` → 改名即可（0 变化）
   - `dsh-client-ui-sidebar@0.1.5-rc.1.patch` → **要实测**（目标 `lib/client.js` 变了 -29 B）
2. **撞车面**：上游 2.0.10 改动的源码/脚本/测试 ∩ 我方改动 = **仅 5 个文件**（全在 `dsh-plugin-desktop`，且都是 scripts/tests）：`verify-mac-release.ts`、`verify-mac-smoke.ts`、`verify-win-portable.ts`、`tests/package.spec.ts`、`tests/verify-win-portable.spec.ts`。**改名重灾区（locales/tray/native-dialog/recovery/setup-wizard/market locales）上游一个都没碰。**
3. **必须重新实机验证**：ASAR 改解包目录后，`resources/app.asar` 不再存在 → `verify-packaged-runtime` / fuse 校验语义变了。
