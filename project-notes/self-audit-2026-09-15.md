# 我们的改动盘点 + 定位校正（2026-09-15）

> 全量实测（`git status` 127 条 / `git diff --stat` 121 文件 / patches 21 个 / 根目录逐项列出）。
> 本次是**只读盘点**，未改动任何代码。

---

## 零、先校正定位（用户 2026-09-15 明确）

**我们与 DSH-desktop（社区版）的关系 = 参考样本，不是追随对象。**

### 三条被推翻的旧方针

| 旧方针（**作废**） | 新口径 |
|---|---|
| 「**全量追最新**社区版」（社区每发一版就跟） | 社区发版**不构成我们的升级理由**。我们只看一条线：**官方内核更新了什么 → 社区版跟着动了/加了/优化了什么 → 从中挑我们需要的** |
| 「先升级、后改动 DIY」 | 我们的版本已是**自己的产品**（有自己的更新源 `I:\deepseekharness更新DIY`，有自己已改好的更新方法）；要改**直接在 `I:\dsh-913` 上改** |
| 「升级到社区 v2.0.10 + 新建 `I:\dsh-915`」 | **取消**（清单第 39 项作废） |

### 一条被澄清的技术边界（不是方针，是事实）

「打补丁」只用在**没有源码的成品 tarball** 上 —— 这是技术必然，不是"抄别人代码小改"：

| 对象 | 有无源码 | 改法 |
|---|---|---|
| 官方内核 265 个包（`vendor/dsh-runtime/*/*.tgz`） | ❌ 没有（官方源码在 `deepseek-harness` submodule，已决定不拉） | 只能**叠补丁** |
| 第三方 npm 包（`app-builder-lib`/`open`/`pnpm`/`fs-ext`/`vscode-ripgrep`/`dshmarket`） | ❌ 没有 | 只能**叠补丁** |
| **我们自己的 4 个包**（`dsh-plugin-desktop`、`-beta`、`dsh-community-fabric`、`dsh-community-market`） | ✅ 仓库里有完整源码（root `workspaces`） | **直接改源码** |

→ 上一轮我说"修市场重启按钮要新增补丁"是**错的**，那段逻辑在 `dsh-community-market` 源码里，直接改即可。

---

## 一、我们实际改了什么（实测分类）

### A 类 · 产品定制（直接改源码，共 96 个文件 modified + 1 个新增文件）

| # | 改动 | 主要落点 |
|---|---|---|
| 1 | **产品标识改名** | `product-identity.ts`：`productName` `DSH Desktop`→`deepseekharness`；`appId` `ai.deepseek.dsh.desktop`→`deepseekharness.diy`。波及 38 文件：任务栏名、标题栏 `lisa`、终端 `R9`、安装包名 `deepseekharness-${version}-${arch}-Setup.exe` |
| 2 | **便携模式** | `main.ts`：启动时把 `DSH_HOME` 重定向到 `<安装目录>\data` |
| 3 | **新增市场源 Awesome DSH Plugins** | 新增 `dsh-community-market/src/adapters/awesome-list.ts` + `src/data/awesome-catalog.ts`（**2.1 MB** 离线快照）+ `catalog/service.ts` + `client/index.ts` + `locales.ts` |
| 5 | **升级源改本地** | `update-checker.ts`（`DESKTOP_VERSION_ENDPOINT` → `file:///I:/deepseekharness更新DIY/发布/version.json`）、`update-download.ts`（下载地址动态拼接） |
| 29 | **思考过程转中文** | 配置层（`personaPrefix` 追加中文指令） |
| 30 | **去掉设置里的市场 tab** | 删 `settings.plugins.tab` 注册 |
| 31 | **删废弃代码与零引用图** | 删 `_deprecated/`（25 文件）+ `assets/` 3 张图 |
| 32 | **侧边栏两列布局** | 补丁 `dsh-client-ui-sidebar@0.1.5-rc.1.patch`（+1/−1，CSS `flex-direction`） |
| 33 | **会话命名 + 中文转义** | 补丁 `dsh-api-session-controller`（+26/−4）、`dsh-session-persistence-jsonl`（+43/−3） |
| 37 | **收尾**：A2 摘掉变体校验（`check:layout` 里注释掉 `check:desktop-variants`）+ B 类测试期望值修补（10 个测试文件）+ 补遗（scripts 9 个文件约 29 处、market 文案、12 个文档 + 6 个 i18n 哈希） | |

### B 类 · 对官方 / 第三方包叠补丁（21 个，仅限无源码的成品包）

| 来源 | 数量 | 清单 |
|---|---|---|
| **社区自带**（我们继承） | **13 官方 + 5 第三方** | 官方：`dsh@`、`dsh-agent-presets`、`dsh-app-boot`、`dsh-client-modules`、`dsh-client-ui-directory-picker-browse`、`dsh-client-ui-primitives`、`dsh-client-ui-settings-general`、`dsh-host-directory-picker-browse`、`dsh-plugin-package-inventory-deepseek`、`dsh-settings`、`dsh-subprocess-local`、`dsh-web-app`、`dsh-win32-process`；第三方：`app-builder-lib`、`fs-ext`、`open`、`pnpm`、`vscode-ripgrep` |
| **我方新增** | **3** | `dsh-api-session-controller`、`dsh-session-persistence-jsonl`、`dsh-client-ui-sidebar` |

### C 类 · 清理动作

删 `_deprecated/`（社区历史补丁归档 25 文件）、删 3 张零引用图、删悬空 submodule gitlink（`deepseek-harness`）、删孤儿 tgz（`vendor/agents-anywhere/...rcda81994.tgz`）。

---

## 二、发现的问题

### 🔴 P1 · 仓库里还大量躺着"社区的文档与配置"，与产品身份冲突

这一组**没有一个是代码问题，全部是身份/文档问题**，但其中第 1 条会**直接影响 AI 的判断**：

| # | 位置 | 现状 | 为什么不对 |
|---|---|---|---|
| **1** | **`AGENTS.md`**（AI 工具自动加载的仓库规则）+ `CLAUDE.md`（只有一行 `AGENTS.md`，指向它） | 第 1 行写着 **`# DSH Desktop repository rules`**；第 3 行写着 **"This repository owns the desktop product around an *unmodified* DeepSeek Harness checkout"** | ⚠️ **最严重**。① 名字是社区的；② "unmodified（未修改）"与我们已深改的事实**直接矛盾**；③ 它会被 AI 自动读入 → 任何在这个仓库干活的 AI 都会先被它误导（包括我）。还有第 106 行教人 `git submodule update --init --recursive`（我们已决定不拉 submodule） |
| 2 | `package.json:4` | `"description": "DSH Desktop product workspace"` | 改名漏项，还挂着社区名字 |
| 3 | `README.md` / `README.en.md` / `README.zh.md` / `README.i18n.yaml` | 整份是社区的：标题 `DSH Desktop`、下载指向 `dshdesktop.cn`、社区微信群/QQ 群二维码、Discord、"与 DeepSeek 无隶属关系"声明 | 对外身份完全是别人的 |
| 4 | `PRIVACY.md` / `PRIVACY.zh.md` / `PRIVACY.i18n.yaml` | 整份是社区的（"我们指 Anywhere Labs 项目维护团队"、官方服务 `dshdesktop.cn`）。我们**只加了 1 行**（Awesome DSH Plugins 市场源说明） | 同上 |
| 5 | `CONTRIBUTING.md` / `.en.md`、`CODE_OF_CONDUCT.md` / `.en.md` | 整份是社区的 | 同上 |
| 6 | `docs/`（16 文件） | `architecture` / `faq` / `plugin-development` / `plugin-ecosystem` / `user-guide` / `why-desktop` / `README` + `evidence/` | 全是社区文档 |
| 7 | `.github/`（5 文件） | `workflows/ci.yml`（社区 CI）+ `ISSUE_TEMPLATE/`（3 个）+ `pull_request_template.md` | 若推到自己的 GitHub，CI 会按社区规则跑 |
| 8 | **版本号** | `dsh-plugin-desktop/package.json` = **`2.0.9`**（= 社区的版本号） | 我们自己发版时，版本号与社区同号，**更新源里"最新版本"语义会混淆**（我们的 2.0.9 vs 社区的 2.0.9 不是同一个东西） |

> **注**：`X-DSH-Desktop-*` 这类 HTTP header 名（`PRIVACY.md:50-51`、`README.md:120`）属**跨进程契约**，源码里仍是 `dsh-desktop`，**不该改** —— 这条已在早前判定过，不属问题。

### 🟡 P2 · 结构性冗余（beta 通道已停用，但仍在链路里）

| 位置 | 规模 | 说明 |
|---|---|---|
| `dsh-plugin-desktop-beta/` | `node_modules` **967.9 MB** + `src` 181 文件（1.3 MB） | beta 通道已停用（只发 stable），但它仍在 root `build` / `typecheck` / `test` / `check` 里被构建，另有 7 个 `*:beta` 脚本（`dev:beta` `start:beta` `package:dir:beta` `dist:mac:beta` `dist:mac-smoke:beta` `dist:win:beta` `dist:win-portable:beta`） |
| `.agents/notes/` | **约 97 个文件** | 社区的设计笔记（`implemented/architecture/*`、`implemented/process/*`、`proposed/*`），双语文档。是社区的工程记录 |

### 🟡 P3 · 13 个社区补丁 + 5 个第三方补丁，我们全部继承、从未逐个审过

这些是**社区作者为社区产品形态**对官方包做的改造（中文化、目录选择器、侧边栏等）。我们继承了它们，但**没有一处记录过"我们是否需要"**。

> 相关线索：清单第 21/22 项曾查证"官方 0.1.5-rc.1 已内置中文化，我方补丁不再需要" —— 但那是**我方**补丁；**社区**的中文化补丁（如 `dsh-client-ui-settings-general` +30、`dsh-settings` +35）仍在 `patches/` 里，是否与官方内置重复、是否还需要，**没审过**。

### 🟢 P4 · 已确认合理、无需动的

- 我方 3 个补丁打官方包 = 技术必然（改内核无源码），且是**功能改动**（会话命名/中文转义/侧边栏），非"小改"
- 删 `_deprecated/` = 社区死代码归档，且 git 历史仍在（可恢复）；代价是失去"社区以前怎么改官方包"的本地参照
- `vendor/` + `upstream.json` 仍需保留（跑官方内核要它），只是**角色要正名**：它是"官方内核的本地分发副本"，不是"追社区的开关"

---

## 三、待决策（按优先级）

| # | 事项 | 我的建议 |
|---|---|---|
| 1 | **`AGENTS.md` / `CLAUDE.md` 重写**（去掉"DSH Desktop"、"unmodified"、submodule 指令，改成我们自己的仓库规则） | **强烈建议做** —— 它影响所有在此仓库工作的 AI，当前内容与事实矛盾 |
| 2 | `package.json` description、版本号策略（是否走自己的版本序列） | 建议改 description；版本号策略要你定 |
| 3 | 根文档（README / PRIVACY / CONTRIBUTING / CODE_OF_CONDUCT / docs / .github）怎么处理 | 三种选：① 全部改写成我们的 ② 保留但加"本仓库为个人定制分支"声明 ③ 原样不动（自用） |
| 4 | 13 个社区补丁 + 5 个第三方补丁逐个审"是否需要" | 建议做一次逐补丁审查 |
| 5 | `dsh-plugin-desktop-beta` 从 root 链路摘除 | 建议做（省 968 MB + 每次构建少一包） |
| 6 | `.agents/notes/`（97 文件）去留 | 可留（社区设计参考有价值），也可清 |
