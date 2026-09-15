# deepseekharness 桌面版 —— 项目长期约定

> 2026-09-14 整理精简。被移除的过期内容（9-01 的 `I:\dsh-desktop`/2.0.4/内核 0.1.2-alpha.1 状态、已完成的待办、SAC 细节原文等）**已全文归档到 `memory/2026-09-14.md` 的「MEMORY.md 整理精简」一节**，需要时回查。

## 一、铁律（永远遵守）
1. 先原理后动手：讲原理 → 列规则清单 → 用户点头 → 才执行；严禁抢跑。
2. 讨论要真、动手要稳、认错要干脆：基于真实数据，严禁猜编造；犯错直接承认。
3. 绝不隐瞒改动：漏掉/偷换/简化的必须主动报告。
4. 动手前先查证：读源码/文档；查不到就明说"没查到"，不拿猜当实锤。
5. 改方案/写代码前先列方案，用户点头再动。
6. 需要手动 PowerShell 就立即停下告知用户，严禁自己反复试绕过沙箱：凡 build/install/打包/删 node_modules 等被 WorkBuddy 沙箱拦（NODE_OPTIONS shim、corepack 被 managed node 抢、safe-delete 拦批量删、EPERM、**PATH 被重置导致 git 的 sh 子命令失效**）的情况，第一次识别到就停下来，把命令交给用户手动跑，绝不再自试第 2 次。
7. 需求清单只保留一份权威 = `I:\deepseekharness制作\.workbuddy\redolist.html`（`requirements.html` 已全量并入，不再各自演进）。重写/大改清单后，必须回头跟旧清单一逐项比对，确认零遗漏再交付；一旦发现漏项，立即主动报告并补齐（2026-09-14 曾漏 B1/B2/C1 三项，被用户发现）。
8. **判定"过时 / 可删"必须现场取证，严禁沿用上一轮快照结论**：凡对目录/安装/进程下"已废弃、可删除"的判断，必须当场核对**硬证据**（文件 sha256、可执行文件的版本信息、目录 CreationTime、注册表实时重读），并在清单里注明取证时间。**2026-09-15 我把用户刚装好的 2.0.9 安装（`E:\app\deepseekharness`，内含真实数据）错列为"可删"**，根因就是沿用了 00:21 的旧注册表快照（那时还是 2.0.4），没重读、没核内容。

## 二、三个源头的固定用词（不许混）
- `deepseek-ai/deepseek-harness` = **DeepSeek 官方**（内核，唯一真官方）
- `anywhere-labs/dsh-desktop` = **社区版**（非官方，桌面外壳）
- `taikongcang/dsh-desktop-DIY` = **我们的版本**
不再用"官方"单指任何一方。

## 三、当前基座与目录（2026-09-13 起）
- 社区版参照（只读）：`I:\deepseekharness9-13\9-13DSH-desktop最新更新一套`
- **工作副本：`I:\dsh-913`**（**纯 ASCII 真实目录** —— 2026-09-14 从下面那个中文目录整体搬迁而来）
- 旧目录（**保留作备份，不再使用**）：`I:\deepseekharness9-13\9-13deepseekharness最新更新修改`
- 打包产物：`I:\dsh-913\dsh-plugin-desktop\dist\`（electron-builder 的 `directories.output`；安装包 = `deepseekharness-<版本>-x64-Setup.exe`）
- 清单/文档/记忆：（本目录）`I:\deepseekharness制作\.workbuddy\`
- 📄 **UI 归属速查 = `.workbuddy/ui-attribution.md`**（2026-09-15 建）：哪个 UI 出自哪个包/文件、旧版 2.0.4 vs 新版 2.0.9 的差异、我方是否改过。遇到"这块 UI 是谁的 / 以前是不是这样 / 是不是这次新增"先翻它。
  - ⚠️ **两套 UI 机制别混**：标题栏三个图标（终端/重启/开发者）的悬停提示 = **HTML 原生 `title`**（系统 tooltip，朴素、不受应用 CSS 控制）；模式徽章的悬停卡片 = **应用自绘 HoverCard**。**这不是版本差异**：`DesktopNativeActions.tsx` 在 v2.0.4→v2.0.9 **字节相同**、我方零改动；变的只是文案（上游把「桌面外观与行为 / 切换显示模式 / 扩展窗口」改成「窗口模式 / 切换窗口模式 / 扩展模式」）。
  - ✅ **对照旧版一律走 GitHub（用户 2026-09-15 定）**：用社区仓库 tag/commit 历史（`anywhere-labs/dsh-desktop`）与官方内核（`deepseek-ai/deepseek-harness`）。**不再把回收站当资料来源**（回收站由用户自行清空）。示例：`git show v2.0.4:dsh-plugin-desktop/src/client/desktop-settings-locales.ts`；本地 clone `I:\dsh-913` 的 origin 带 `ghfast.top` 镜像前缀，`git fetch --tags origin` 实测可拉到新 tag。
- **Agents Anywhere（侧边栏「手机连接」）= 社区捆的第三方桥接包** `@agents-anywhere/dsh-bridge-next`，**不在 DeepSeek 官方内核里、也不是我方新增**；**社区 v2.0.7（提交 `1e31e4d08e`，2026-09-08）起引入**（v2.0.4 的 package.json 无此依赖）。入口在侧边栏「设置」上方，弹窗三页签（登录和连接 / 设置 / 运行日志），要连它自己的云或自建实例。
- **更新源（已建立）**：`I:\deepseekharness更新DIY\`（`发布\` 更新源 + `工具\` 打包脚本 + `源码\` 预留）
- **版本号 = 自有序列（用户 2026-09-15 定）**：从 **`3.0.0`** 起（**必须大于上一个已发出的号** —— 客户端更新检查靠版本号比较，号小了会被判定"没有新版本"）。唯一版本源 = `dsh-plugin-desktop/package.json` 的 `version`。每次对齐社区版 / 官方内核 → 在仓库根 **`UPSTREAM-ALIGNMENT.md`** **新增一行**（不覆盖历史）。**不因社区版发新版就跟发新版。**
- **`AGENTS.md` 2026-09-15 已重写**：原 31 行是社区的仓库规则（`# DSH Desktop repository rules`、声称上游 "unmodified DeepSeek Harness checkout"、教 `git submodule update --init --recursive`）—— **与事实矛盾且会误导任何在此仓库工作的 AI**。新文件写我们的真实约束（ASCII 路径 / 不拉 submodule / 只发 stable / `dist:win` 不用 `package:dir` / `DSH_AA_SOURCE_REF=pinned` / 直接改源码 vs 叠补丁边界 / 版本号规则）。**并新增：AI 禁止读 `.agents/`**（社区设计笔记，85 文件，保留供**人**学习参考）。
- ✅ **打包一律走 `I:\deepseekharness更新DIY\工具\build-win.cmd`（双击即用）**：它设 `DSH_AA_SOURCE_REF=pinned` + 三个镜像兜底 → `yarn dist:win`。**不设 `pinned` 会去 GitHub 解析 Agents-Anywhere 的 main、克隆并重建 tgz，还会改写 vendor/ + 两个 package.json + yarn.lock**。离线就绪已核查（2026-09-15）：yarn 缓存 758.5MB / electron zip 137.71MB / NSIS 工具链齐 / pinned tgz sha256 与 provenance 一致 / corepack 有 yarn 4.18.0（实测 `yarn --version`=4.18.0）。**仍需联网的只有：追官方内核、改依赖、升 Electron/electron-builder、git 操作。**
- ✅ **待清理：2026-09-15 已执行完毕**（用户跑 `工具\cleanup-batch*.ps1`，全部成功无 ERR）。已清：`I:\dsh-desktop`(2.72GB)、旧工作副本(1.75GB)、旧原型 `制作\dist`+`node_modules`(1.4GB)、`dsh-plugin-desktop\dist`(710MB)、孤儿 tgz、`beta\node_modules`(620MB)、42 个一次性产物（→ `.workbuddy\_archive\`）。
  - 🟡 **但空间尚未真正释放**：**回收站里压着 7.03 GB（I 盘）**；`I:\` 实测可用 484.7 GB。**要拿回空间必须清空回收站**（建议确认几天没问题后再清）。
  - ⚠️ **连带影响**：`beta\node_modules` 被删 → **下次动手前先跑一次 `yarn install`**（离线，从本地 Yarn 缓存恢复，不需联网）。
  - 现况：`I:\deepseekharness9-13\` 下只剩社区版只读参照；`I:\deepseekharness制作\` 下只剩 `.workbuddy\`。
  - 遗留：`I:\deepseekharness` 野目录（0 MB，只有一个空 `AI股票`，待确认）；`dsh-913\deepseek-harness` 悬空 submodule 条目（需另立项改仓库）。完整方案见 `.workbuddy/cleanup-plan.md`。
- ✅ **现行安装 = `E:\app\deepseekharness`**：是我们的 **2.0.9**（exe/app.asar sha256 与 dist 产物一致，注册表 `deepseekharness 2.0.9`，目录 ctime 2026-09-15 00:39:40），**用户数据在 `data\`（profiles/settings/sessions/credentials）→ 绝不能删**。
- 基座：社区 **2.0.9** / 内核 **0.1.5-rc.1**；vendor **265 个**官方包；`patches/` **21 个**（18 社区自带 + 3 我方新增）
- submodule `deepseek-harness` 需 checkout `183f08e9c6dde7e36cd2318eaee70b0da08fb35e`；clone 后目录为空，要 `git submodule update --init`
- ✅ **工作副本必须放纯 ASCII 路径**（2026-09-14 已搬迁完成；根因见坑 1）
- 架构：Electron 即宿主，dsh Host Cordis 根跑在 Electron main 进程里（非外部套壳 spawn node）；自包含、不连 3080，主进程监听随机本地端口供 renderer IPC。核心启动 = `main.ts` 调官方包 `@deepseek-ai/dsh-app-boot` 的 `boot()` 进程内直接挂载，随后 `hostCtx.provide('desktopRuntime', runtime)` 注入桌面能力。
  - **能改（社区壳胶水）**：main.ts 里调 boot / 开 BrowserWindow / 托盘 / 单实例锁 / 监听端口 / IPC 的代码；`dsh-plugin-desktop/src/` 全部 ts。
  - **不能改（官方核心）**：`boot` 函数本体、Host Cordis 根运转 → 在 vendor 官方包里。
  - spawn 只用于辅助：bin.ts / electron-runtime.ts / profile-materializer.ts / desktop-terminal.ts / pnpm.ts。
- 数据目录：继承 `DSH_HOME`；首启新建独立 `desktop` profile（与 `web` profile 并列隔离）。

## 四、更新方针（用户 2026-09-15 重新定义，**推翻 09-13 旧方针**）
- **社区版（DSH-desktop）对我们只是「参考样本」，不是追随对象。** 社区每发一版**不构成我们的升级理由**；它升级后的东西**不一定是我们需要的**。
- 只走一条线：**官方内核更新了什么 → 社区版跟着动了/加了/优化了什么 → 从中挑我们需要的**，借过来改成自己的。
- 我们的版本已是**自己的产品**：有自己已改好的更新方法（自己的更新源 `I:\deepseekharness更新DIY`，客户端已指向它）。要改**直接在 `I:\dsh-913` 上改**。
- ⛔ **作废的三条**：①「全量追最新社区版」②「先升级、后改动 DIY」③「升级到社区 v2.0.10 + 新建 `I:\dsh-915`」（清单第 39 项作废）。
- ⚠️ 「**打补丁 vs 直接改**」的边界（**是事实，不是方针**）：**只有没有源码的成品 tarball 才叠补丁** —— 官方内核 265 包（`vendor/.../*.tgz`，源码在未拉的 submodule）+ 第三方 npm 包（app-builder-lib/open/pnpm/fs-ext/vscode-ripgrep/dshmarket）；**我们自己的 4 个包（`dsh-plugin-desktop`/`-beta`/`dsh-community-fabric`/`dsh-community-market`，root `workspaces` 里有源码）一律直接改源码，不打补丁**。
- 本次起步阶段**会话数据不备份**，以后用户说需要才备份。
- 维护策略：官方内核"**按需追**"；只有官方出了真需要的东西才追，追前先评估补丁重适配成本。
- **追官方必踩的坑**：`patches/` 里针对官方包的补丁**把版本号写死在文件名里**，官方出新版后大概率 `apply` 失败（hunk 不匹配），需逐个读新源码重写。

### 追官方的脚本链（都在根 `package.json` 的 scripts）
- `upstream.json` = 更新官方核心的**总开关**（锁 `repository` / `commit` / `sourceVersion`）。
- `yarn upstream:prepare-runtime` = 进 `deepseek-harness` submodule 里 `install` + `build:official`（`DSH_BUILD_CLIENT_PROFILE=official`）+ `release:pack --family dsh` → 产出 `dist/npm/publish-order.txt` + 全部 tgz。
- `node scripts/sync-vendored-runtime.mjs --write` = 把新 tgz 拷进 `vendor/dsh-runtime/<新版本>/`，并同步更新 `manifest.json` / `upstream.json` / workspace `resolutions` / 各子包依赖版本。
- `yarn check:vendored-runtime` = 校验 vendor 完整性（sha256）。
- **构建/打包命令**（**一律从 `I:\dsh-913` 跑**）：`yarn build`、`yarn package:dir`（免安装目录）、`yarn dist:win`（NSIS 安装包）、`yarn dist:win-portable`、`yarn check`（全套）。
  - ⚠️ `yarn dist:win` **内部先跑 `check:win-package` preflight**（market build + desktop build + typecheck + 14 个测试文件 + `verify:closure`）；preflight 挂了打包不会开始。确认代码没再改可用 `$env:DSH_PACKAGE_CHECK_ALREADY_RAN=1` 跳过。
  - ⚠️ `yarn package:dir` 带 `--config.electronDist=<本地 node_modules\electron\dist>` → **完全不下载 Electron**；`dist:win` 不带 → 走 electron 缓存 / 镜像。
  - ⚠️ **打包第一步 `yarn aa:prepare-release` 会动仓库**（2026-09-14 实测踩到，我原先只写了"要联网"、**漏报了这一点**）：默认 `DSH_AA_SOURCE_REF=main` → 解析上游 `Agents-Anywhere@main` 的**最新 commit**，**重新构建并打包一个新的 tgz**，然后改写 `vendor/agents-anywhere/<新tgz>` + `provenance.json`，并把 `dsh-plugin-desktop/package.json` 与 `dsh-plugin-desktop-beta/package.json` 的 `@agents-anywhere/dsh-bridge-next` 依赖**重指到新 tgz**，最后跑 `yarn install --mode=skip-build`（连带改 `yarn.lock` + node_modules）。中途失败**会回滚**（snapshots 复原 + 删掉新 tgz）。
    → ✅ **固定做法：打包前设 `$env:DSH_AA_SOURCE_REF = "pinned"`** → 立刻打印 `Using pinned AA <commit>` 并返回（只做 sha256 校验），**零改动、零联网**，保证"只验证我们自己的改动"这单一变量。当前 pin 值：commit `00df092c98b271098cba18b4f96d91f5008c2cd4`、artifact `agents-anywhere-dsh-bridge-next-0.1.0-dev.0.desktop.c00df092c98b2.rcda81994.tgz`。
  - 打包前置条件与四类拦截对策见 `.workbuddy/run-package-guide.md`。
- ⚠️ `yarn check` 是用 `&&` 串联 11 步，**前面失败后面就不跑** → 想拿"完整红名单"**必须逐条分开跑**，不能直接敲 `yarn check`。

## 五、我方定制口径（已定稿）
- **改名**：全部改（含界面文案）：`deepseekharness`（任务栏）/ `lisa`（标题栏）/ `R9`（终端）/ appId `deepseekharness.diy` / 产物名 `deepseekharness-*`。
- **数据目录**：默认就便携（改 `main.ts` 兜底值），**不覆盖**官方可切换机制、尊重用户显式设的 `DSH_HOME`。
- **beta 通道已整体摘除（2026-09-15，用户"不要了"）**：`dsh-plugin-desktop-beta` 从根 `workspaces`、`build`/`typecheck`/`test`/`check`、7 个 `*:beta` 脚本、`verify-desktop-variants.mjs`、`upstream.json` 的 `channels.beta` 全部移除；目录已删（**973.6 MB / 54479 文件**）。摘除前实测：beta 与 stable 的 `src` **完全同构**（181 vs 181、**无独有文件**），28 处差异**全是"我们只改了 stable"造成**的 → **无内容损失**。`verify-layout.mjs` 的 6 处 beta 断言、`prepare-agents-anywhere-release.mjs` 的 2 处数组同步清理；`upstream.json` 的 `activeChannel` 由 `beta` → **`stable`**。复验：`yarn install`（离线、Fetch 0s）✅ / `yarn typecheck` ✅ / `check:bilingual-docs`（51→**49 records / 98 documents**）✅。
  - ⚠️ **连带发现**：`scripts/bilingual-docs.mjs` 用 **`git ls-files`** 找文件（不是扫文件系统）→ 删目录后必须 `git add -A -- <路径>` 把删除登记进索引，否则报 `ENOENT`。已登记（380 条 staged 删除）。
  - ⚠️ **`yarn check:layout` 仍跑不通（预期）**：它读 `deepseek-harness/package.json` 并校验 submodule 检出，而我们已决定不拉 submodule。其余子命令可单独跑。
- **更新源（B 方案：本地源 · 已定稿并实现，2026-09-14）**：我们的"新版本"**只能自己产出**（社区版发的包永远是原版，装上去会覆盖定制）。
  - **方案 = 直读本地文件**（`file://`，**不开服务器、不轮询**）—— Electron `net.fetch` 实测支持 `file://`（含中文路径）。
  - 客户端硬编码：`update-checker.ts` 的 `DESKTOP_UPDATE_SOURCE_DIRECTORY = 'I:\\deepseekharness更新DIY\\发布'`（端点由 `pathToFileURL(join(目录,'version.json'))` 生成）；`update-download.ts` 改为按"平台+版本"动态拼 `desktopUpdateDownloadUrl()`。
  - **发布契约**：`发布\version.json`（单行 `{"version":"x.y.z"}`，**stable 必须纯版本号，带 `-beta.1` 会被拒收**，上限 4KB）+ `发布\deepseekharness-<版本>-x64-Setup.exe`（与 `nsis.artifactName` 一致 → **打包产物直接拷入、不用改名**）。
  - 后台自动轮询已关（`cordis.patch.yml` 给 `desktop-updates` 加 `config.enabled=false`），**手动点"检查更新"照常可用**；更新检查**只在打包版生效**。
  - 文件不存在时抛 `ERR_FILE_NOT_FOUND` 被吞 → **界面无任何提示**（"点了没反应" = 路径或文件名不对）。
- 清单权威 = `redolist.html`（现 **37 项编号**）。

## 六、环境事实（长期有效）
- 用户 node **v24.19.0**（`E:\app\Node`，PATH 已加）；pnpm 11.24.0（`E:\app\Node\node_global`）；**WorkBuddy managed node v22.22.2 在 C 盘，两套勿混**。
- `DSH_HOME` = `I:\deepseek-harness\.dsh`（HKCU\Environment 永久）。
- 国内 npm 一律 **npmmirror**；两个 electron 镜像变量**都要设、别混**：`ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`（electron 二进制本体）、`ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/`（builder 辅助工具）。
- 项目 `.yarnrc.yml` 设了 **`enableScripts: false`** → 所有包的 postinstall **都不会跑**：electron 二进制不会自动下载（需手动 `node node_modules/electron/install.js`）、原生模块（fs-ext/koffi/node-pty/dsh-subprocess-local）不构建（打包前由 `yarn prepare:electron-native` 单独构建）。
- **离线安装的硬开关**（2026-09-15 实测）：`$env:YARN_ENABLE_NETWORK = "false"` → `yarn install`；该设置**存在且默认为 true**（`yarn config get enableNetwork` = true），设 false 后**任何联网需求直接报错**，不会偷偷下载。默认 `npmRegistryServer` = `registry.yarnpkg.com`（**离线安装用不到**；要联网时再设 `YARN_NPM_REGISTRY_SERVER=https://registry.npmmirror.com`）。
- node-gyp 编译用 Marvis 的 Python 3.11.8：`E:\app\Marvis\MarvisAgent\1.0.1100.522\runtime\python311\python.exe`。
- 官方只支持 `dsh` CLI + profile 启动（web / headless / sdk / sdk-minimal / acp）；官方文档**无任何** Electron/桌面版/嵌入教程，`architecture.md` 还把"直接进程内挂载核心"排除在官方启动器之外 → dsh-desktop 的深度集成是**社区自读源码摸索**的。
- dsh 常用：语言 设置→通用→切中文（`locale.preference`）；皮肤 skin-center；插件 `dsh plugin --profile <p> add <pkg>`。desktop profile 的 `cordis.yml` 为空，第三方插件需 `dsh plugin --profile desktop add` 重装。翻译 `@nicearrack/dsh-translator`、侧边栏 `dsh-better-sidebar`。
- **GitHub 私有仓**：WorkBuddy 的 github connector 实为 **GitHub Copilot MCP**（作用域写死"仅当前仓库只读"）→ 读任何私有仓一律 404，网页重新授权也改不了。要用 ① 本机 git 命令行（凭据管理器 `git:https://github.com`→taikongcang，完整权限，已实测可 push）② 或注入带 repo 权限的 PAT 到 github MCP server。
- **插件装在哪 / 怎么装（2026-09-15 实测源码+磁盘）**：安装位置 = **Profile 目录** `<DSH_HOME>\profiles\<profile>\node_modules\<包>`（便携模式下 `DSH_HOME = <安装目录>\data`，当前即 `E:\app\deepseekharness\data\profiles\desktop\`）。`desktopPnpm.run()` 的 **cwd 就是活动 profile 目录**（`src/pnpm.ts:163`），命令 `pnpm add <pkg>@<精确semver>`，随后把包写进 profile `package.json` 的 `dsh.profile.bundles`；卸载 = `pnpm remove` + 从 bundles 删除。profile 的 pnpm 配置：**`nodeLinker: hoisted`**、**全局 store `E:\.pnpm-store\v11`**、registry `registry.npmmirror.com`。⚠️ **市场 UI 只能装 npm 上的包**（安装前查 `registry.npmjs.org/<pkg>/latest`，且市场通道强制 `add <pkg>@<精确semver>`，`src/pnpm.ts:95-115`）→ **本地 tgz / file: 路径不能走市场 UI，只能走 CLI**（`runPlugin` 校验宽松，未实测）。
- **⚠️ 什么该"打补丁"、什么该"直接改源码"（2026-09-15 查实，我此前说错过一次）**：`patches/` **只用于以预打包 tarball 形式分发的代码** —— ① 官方内核 265 个 `vendor/dsh-runtime/<ver>/*.tgz`（tgz 是成品、仓库里没有其源码，`deepseek-harness` submodule 又决定不拉）② 第三方 npm 包（`app-builder-lib`/`open`/`fs-ext`/`pnpm`/`@vscode/ripgrep`，另 `dshmarket` 在 `.yarn/patches/`）。**我们自己的 4 个 workspace 包（`dsh-plugin-desktop`、`-beta`、`dsh-community-fabric`、`dsh-community-market`）都带完整源码、且没有任何 patch 引用它们 → 一律直接改源码**（我方 120+ 文件的改动就是这么做的）。→ **凡"要改的行为"落在我们这 4 个包里，就是直接改，不是叠补丁**；只有落在那 265 个内核 tgz 里的才必须叠补丁。
- **市场 pnpm 操作没有超时（2026-09-15 实测，会导致界面永久卡住）**：`dsh-community-market` 的 `runPnpm()` 只 `await handle.done`，**全链路零超时**（超时只存在于网络层 `restricted-http.ts`）。实测卸载时 pnpm 子进程（`dsh-subprocess-local/lib/runner.js` → `pnpm.mjs … remove <pkg>`）**把活干完却不退出**（包已删、lock 已改、`package.json` 的 `dependencies` 已清空），于是请求永不返回 → 界面永久「正在卸载…」（pending 时取消键被禁用）。⚠️ **连带后患**：因 `runPnpm` 没返回，后续 `setProfileBundle(profile, pkg, false)` 没执行 → `dsh.profile.bundles` 仍列着已删包 → 而 `profile.ts:561-565` 对解析失败的 bundle 是 `else throw cause` → **下次启动会起不来、进恢复助手**，必须先手工把清单改回来。
- **「手机连接」（AA）不是普通插件，是 Desktop 强制注入的集成（2026-09-15 查实）**：`profile.ts:527` 在开关打开时**强制把 `@agents-anywhere/dsh-bridge-next` 塞进 bundle 列表**（profile 清单里根本没有它）；关闭时剔除，且 `isAaEntry` 过滤 + 注释「用户层不能绕过 Desktop 的选择」（`517-522`、`753-757`）。包从 **app 自己的 node_modules** 解析（dsh-plugin-desktop 的依赖 + `vendor/agents-anywhere` + `aa:prepare-release`）。Desktop 另注入 config `dshHome`/`connectorSourceDir`（`970-977`），但 **AA 自身有默认值**（`lib/index.js:318/6019`），且我们的便携模式已设 `DSH_HOME`（`main.ts:389-392`）→ 注入非必需。**AA 不在 npm 上（两个 registry 都 404）**，只能本地 tgz 分发。三方案见 `.workbuddy/plugin-extraction-and-uninstall.md`。<br>⚠️ **口径更正（用户 2026-09-15 质疑后修正）**：这套注入逻辑**写在我们自己的 `dsh-plugin-desktop` 源码里**，所以**改得动**（直接改源码，不需要补丁）。之前我说"不能当普通插件"不准确 —— 准确说法是：**要把它变成普通插件，必须改我们自己这几处代码，并承担"每次追社区版都要重做这层减法"的维护成本**；另外还有两个客观约束：**它不在 npm 上**（不能走市场 UI 安装，只能自己分发 tgz + CLI 装）、它的 client/Connector 载荷需要正确的路径解析。
- **市场"卸载"按钮的闸门（2026-09-15 查实）**：按钮仅当 `installation.action === 'uninstall'`（`MarketSettingsTab.tsx:1462`）→ 来自 `bundle.uninstallable`（`host/routes.ts:525`）→ 定义为 `mutable && profile清单.dependencies 里有它`（`desktop-plugins.ts:435`）→ `mutable` = 不在 **`IMMUTABLE_BUNDLES`**（`desktop-plugins.ts:42-47`）= {`@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-web-app`（来自官方 `dsh-app-boot` 的 `PROFILE_TEMPLATES.web.bundles`）、`@deepseek-ai/dsh-desktop-app`、`dsh-plugin-desktop`、`dsh-plugin-desktop-beta`、`dsh-community-market`}。→ **自己装的第三方插件本来就有卸载按钮**（用户 2026-09-15 实测确认）；`dsh-base`/`dsh-web-app` 是产品自有 bundle、只读是上游故意设的闸（卸载它们会让 `profile.ts:904-906` 直接抛错、只能进恢复助手）。**结论：不需要改，第 41 项关闭。**
- **市场装完插件点"立即重启"会报「无法请求重启…请稍后手动重启」（2026-09-15 实测，上游设计，非我方 bug）**：原因是市场侧**一次性重启令牌**失效 —— 令牌 `randomBytes(32).toString('base64url')`、**只存内存**（`install/service.ts` 的 `restartIntents` Map）、**TTL 5 分钟**（`:28`）、宿主 generation 被回收时 `dispose()` 会 `clear()`（`:741-748`）；另外**点两次必报错**（第一次已消费）。决定性判据：令牌被消费后市场是**先回 200 再**调桌面重启（`routes.ts:1149-1156`），所以**界面出现红字 = 令牌那步就抛了、请求压根没到桌面**（若到了会弹原生确认框、不会显示错误）。**对插件安装零影响**；兜底就是手动重启（弹窗自带该提示）。硬化方式 = **直接改 `dsh-community-market` 源码**（延长 TTL / 把失败降级为提示），**不是叠补丁**。

## 七、已踩坑（仍有效）
1. **含中文路径 + 执行 yarn script 里的 bin = 路径被破坏 → 工作副本必须放纯 ASCII 路径**（2026-09-14 已搬到 `I:\dsh-913`，问题从根上消失）
   - 现象：`Cannot find module 'I:\...<乱码>\node_modules\...\run.mjs'`（`\` 被吞、`requireStack: []`）
   - **实测边界（别再改口）**：`node xx.js`、`yarn <bin名>`、`yarn workspace <pkg> <bin名>`、`.\node_modules\.bin\<bin>`（走 cmd.exe + `.cmd` 垫片，也正常）**全都 ✅**；但凡**脚本内部有嵌套 `yarn run`** 的（market 的 `check → yarn run build → yarn run generate:types → tsdown`）**一律 ❌**。desktop 的 `build`/`typecheck`/`test` 没有嵌套 `yarn run` → 全部 ✅。
   - 机制（推测）：嵌套 yarn 把 cwd 解析回**真实路径**，之后 `.bin` 里的路径经 POSIX 语义 shell 被破坏。
   - ⚠️ **junction 别名（`mklink /J`）只能骗过外层**：`cd` 进子包跑"无嵌套"的脚本 OK，**对嵌套 yarn 无效**（实测）→ 已被真实 ASCII 目录取代。
   - ⚠️ **看日志的重要经验**：PowerShell 把 Node 的 UTF-8 输出按 GBK 读**也会显示乱码**（`鏈€鏂版洿鏂颁慨鏀` 这种），那种情况下程序**其实是正常的** → **只以"命令是否真的失败"为准，不要凭乱码判断**。
2. **WorkBuddy 沙箱会重置子进程 PATH**：exec 时把 `shim/safe-bin` 前置、并**丢弃进程内对 PATH 的修改** → Git for Windows 的 sh 子命令（`git-submodule` 等）找不到 `git-sh-setup` 而失败（`ls-remote`/`config`/`clone` 是 C 程序，不受影响）。绕不过，交用户手动跑。
3. 沙箱内 **PowerShell 工具的 stdout 不回传** → 必须写文件再用 Read 读；**PS 脚本文件不能含中文**（Write 产出无 BOM UTF-8，被 PS 5.1 按 ANSI 解析会拆坏路径）。
4. **Yarn 4 搬家后**软链接断 + `install-state.gz` 挡重建 → 删 `node_modules` + `.yarn/install-state.gz` 重 install。
5. 沙箱跑 Electron EXE：先清 `ELECTRON_RUN_AS_NODE` / `NODE_OPTIONS`；**别用 run_in_background**（2 分钟杀）。
6. 沙箱 shim 会留**空壳 node_modules 目录**挡 dsh heal → `rmdir` 删空壳。
7. electron-builder 证书墙（unable to verify first certificate）→ 设 `ELECTRON_BUILDER_BINARIES_MIRROR` 走镜像。
8. **Windows Defender** 实时防护拦 NSIS 卸载器生成（`⨯ spawn UNKNOWN` + 弹窗"阻挡"）→ 给项目目录（至少 dist）加 Defender 排除项再打包；改名后新 exe 零信誉更易触发。
9. **SAC 智能应用控制**拦未签名 exe：与 Defender 是**两套独立机制**、Defender 排除项对它无效；弹窗无"仍要运行"。我们自打包必 unsigned（打包脚本主动删签名密钥 + `signExecutable=false`），官方 release 能装是因为官方发布时**单独签名**过。SAC 三态 0关/1强制/2评估，**不可逆**（除非重置/重装 Windows）；本机实测 = **强制模式**。→ 只能关 SAC 或买代码签名证书。
10. **改双语文档必须同步 i18n 哈希**：改了 `X.md` / `X.zh.md` 就要更新同目录 `X.i18n.yaml` 里记录的 40 位 git blob 哈希（用 `git hash-object --path=`，**没有自动重算命令**）；全仓库有 51 个 `*.i18n.yaml`。
11. 改 `cordis.patch.yml` 里**按 id 定位的 patch 是整体替换、不做深度合并** → 必须重述该条目所有字段，否则会静默丢字段。
12. **打包前置（2026-09-14 实测）**：Electron 二进制**必须已装**（`dsh-plugin-desktop\node_modules\electron`，v43.3.0，215MB）—— Windows 上**每次 vitest 都跑 `prepare-test-electron.mjs`**，缺它连 `yarn test` / `check:win-package` 都起不来；electron-builder 的 NSIS 工具链已缓存于 `%LOCALAPPDATA%\electron-builder\Cache`（nsis-3.0.4.1 等）。
13. **`yarn package:dir` 在 Windows 上必失败 —— 上游缺陷**（2026-09-14 实测）：报 `dsh-plugin-desktop: cannot determine requested Electron architecture(s) for win`（抛在 `verify-electron-fuses.ts:224`，由 electron-builder 的 `afterAllArtifactBuild` 钩子调用）。
    - 根因：该脚本的 `--dir` 兜底要求 `platformToTargets` 里存在 `'dir'` 键，但 **`app-builder-lib/out/winPackager.js:64-67` 对 `DIR_TARGET` 直接 `continue`** → Windows 上永不放入 → 兜底永不触发。
    - 归属：`verify-electron-fuses.ts` 我方**零改动**，electron-builder 为原版 26.15.7 → **纯上游问题**（作者大概只在 macOS 跑过 `package:dir`）。
    - ✅ **改用 `yarn dist:win`**（带 `--win nsis --x64`，arch 可从 `config.win.target` 解析 → 命中 `configuredTargetArchitectures` → 校验能过；同样产出 `dist\win-unpacked\` + 安装包）。
    - ⚠️ 关键细节：报错发生在**打包后钩子**，所以 **app 目录其实已完整生成**（`win-unpacked` 360 文件 + `resources\app.asar`）→ 可先双击试跑。
14. **沙箱「safe-delete」会假报错但真删除**（2026-09-15 实测两次）：用 `Remove-Item` 删 `I:\` 下自建临时文件时，报 `[safe-delete][SAFE_DELETE_FAIL_CLOSED] {"reason":"trash-failed","detail":"OK <path>"}` —— 看着像失败，**但文件实际已被删除**；目录删除也一样（`detail` 里是 `OK` 的就是真删了）。→ 判定"删没删"**只认 `Test-Path` 复核**，不看这条报错。
15. **判断"二进制包/产物是否真的改过"，不能看 sha256 或 git blob SHA**（2026-09-15 踩到）：`vendor/dsh-runtime` 的 `manifest.json` 里 **265 个包在两个内核版本间 sha256 全都不同**，因为每个包内 `package.json` 的版本串（`0.1.5-rc.1`→`-rc.2`）都变了。正确判据：**解包后逐文件比对（忽略版本行）**，或看**体积 delta 是否超出 ±1~7 字节的版本串噪声**。

## 八、用户偏好
- 工具/产物/缓存装 **E 盘**不占 C 盘；**代码全 AI 写、用户验收**；产物放 `I:\deepseekharness制作`。
- 插件代码目录：参考原码 → `I:\deepseek-harness\插件\复制代码\`（可自由建）；我方改的 → `I:\deepseek-harness\插件\修改代码\`（**命名先告知**）。
- 草稿先入 `.workbuddy\`，经用户确认后再归类。

## 九、待办 / 暂停
- **【暂停】自研"费用插件"**（2026-09-02 用户叫停）：从老 cost-meter 抽功能重写（不搬原码），第一版 9 项功能（费用金额体系 / 价格表 / 峰谷计价 / 官方价格一键同步 / 预算图框 / 官方余额查询 / 安装前历史导入 / 峰谷切换弹窗 / 26 周用量热图）；token 数据直接读内置 `ctx.tokenMeter` 投影，不自己包 llm/stream；插件名与说明书未定；老源码在 `I:\deepseek-harness\插件\cost-meter-完整源码\`。
- **【挂账】** 34（CA 证书名，待拍板）、35（目录选择器补丁文案，待拍板）、36（手动跑 Electron 探针）、28（绿泡泡，暂缓）、**38（Profile 名 `desktop` 改名 —— 用户 2026-09-15 决定「下次追社区版更新时一起做」；同日再定：**现数据是测试数据可丢弃，下次重新打包即全新环境 → 无需数据迁移**；清单第 38 项载有完整改动落点）**。
- **【下一步】** ✅ **打包 2026-09-15 00:29 成功**（`yarn dist:win` 全绿，安装包 `deepseekharness-2.0.9-x64-Setup.exe` 129.2 MB 已拷入 `I:\deepseekharness更新DIY\发布\`，更新源闭环完成）；✅ **安装测试也已完成** —— 用户已装上 2.0.9（`E:\app\deepseekharness`，未被 SAC 拦）并跑起来。**清单第 11 步整条 ✅**。剩余：清空回收站（待用户确认）、`I:\deepseekharness` 野目录、悬空 submodule 条目（另立项）、第 38 项（下次追社区版时做 profile 改名）。
- **【下一阶段 · 待用户点头】升级到社区 v2.0.10（内核 0.1.5-rc.2）** —— 2026-09-15 已用 `git fetch --tags origin` 拉到 tag，并做了升级成本预检：
  - 社区 **v2.0.10**：tag `697e7d782c`（2026-09-14），距 v2.0.9 **仅 10 个提交**；官方内核从 0.1.5-rc.1（`183f08e9`）→ **0.1.5-rc.2**（`fb2c4b9e`，见 2.0.10 的 `upstream.json`）。
  - 主体：`vendor/dsh-runtime/0.1.5-rc.1`(266 tgz) → `0.1.5-rc.2`(266 tgz)；13 个社区补丁**只改名不改内容**（git 显示 `R100`：`dsh@0.1.5-rc.1.patch` → `dsh@0.1.5-rc.2.patch`）→ 说明官方这次改动很小、补丁上下文多半未变。
  - **我方 3 个补丁**（`dsh-api-session-controller` / `dsh-session-persistence-jsonl` / `dsh-client-ui-sidebar`）需**改名到 rc.2 + 试 apply**。
    - ✅ **更正（2026-09-15 内容级实测，此前那条"三者 tgz 内容都不同"是错判）**：解包逐文件比对（忽略 `package.json` 里的版本行）后 —— `dsh-api-session-controller` **0 处改动**、`dsh-session-persistence-jsonl` **0 处改动**（两者与 rc.1 完全一致，仅版本串变了）→ 改名后**必然能 apply**；只有 `dsh-client-ui-sidebar` 的 **`lib/client.js` 真变了**（22534 → 22505 字节，-29B，属官方"间距/排版微调"）→ 这个补丁（侧边栏两列布局，就打在 `lib/client.js`）**必须实测**，可能需重写。
    - ⚠️ **教训**：manifest 里 265 个包的 sha256 **全都不同**（因为每个包内 `package.json` 的 `0.1.5-rc.1`→`-rc.2` 都变了），**sha256 相同性不能用来判断"包是否真的改了"** —— 该用「解包后逐文件比对，忽略版本行」或看体积 delta（±1~7 字节属版本串噪声）。
  - ⚠️ 上游这次还**改了 Windows 打包方式：不开 ASAR**（提交 `09070dd72e`/`83cc4f821c`/`c7e1dbc940`/`fea9287036`）→ 影响产物结构与 fuse 校验（`verify-electron-fuses.ts` 新增 `usesAsarLayout()`、`OnlyLoadAppFromAsar` 期望值随 asar 变 ENABLE/DISABLE；新增 `src/packaged-filesystem-smoke.ts` + 对应测试）。
  - ⚠️ **`package:dir` 的 Windows 缺陷在 2.0.10 仍未修**（`requestedArchitectures` 那段本次未改动）→ 结论不变：**用 `dist:win`**。
  - ✅ **撞车面很小**：上游 2.0.10 改动的 37 个源码/脚本/测试文件中，与我方 127 条改动**只有 5 个重合**（全在 `dsh-plugin-desktop`，都是 scripts/tests：`verify-mac-release.ts`、`verify-mac-smoke.ts`、`verify-win-portable.ts`、`tests/package.spec.ts`、`tests/verify-win-portable.spec.ts`）；**所有改名重灾区（locales/tray/native-dialog/recovery/setup-wizard/market locales）上游这次都没动** → 我方改名与 B 类修补不会冲突。
- ⚠️ **打包结论：`package:dir` 别用（Windows 上游缺陷，见坑 13）；用 `yarn dist:win`**。`dist:win` 会真下载 Electron（不带 `--config.electronDist`）、会跑 `check:win-package` preflight（13 文件 245 测试），且**需要先加 Defender 排除项**否则 NSIS 那步 `spawn UNKNOWN`。
- **【只查不改】** ② 查设置里"局域网访问"开关为何置灰；③ 查桌面版"目录选择器"是否损坏。
