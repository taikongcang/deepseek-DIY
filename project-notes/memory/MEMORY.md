# deepseekharness 桌面版 —— 项目长期约定

> 2026-09-15 精简（36.9 KB → 本版）。**技术细节已全部移出到 `.workbuddy/tech-notes.md`**
> （环境事实 / 更新源实现 / 追官方脚本链 / 插件与市场实现细节 / 坑的详解 / UI 归属 / 版本情报）。
> 更早被移除的过期内容归档在 `memory/2026-09-14.md`。**本文件只留规则与索引。**

## 一、铁律（永远遵守）
1. 先原理后动手：讲原理 → 列规则清单 → 用户点头 → 才执行；严禁抢跑。
2. 讨论要真、动手要稳、认错要干脆：基于真实数据，严禁猜编造；犯错直接承认。
3. 绝不隐瞒改动：漏掉/偷换/简化的必须主动报告。
4. 动手前先查证：读源码/文档；查不到就明说"没查到"，不拿猜当实锤。
5. 改方案/写代码前先列方案，用户点头再动。
6. 需要手动 PowerShell 就立即停下告知用户，严禁自己反复试绕过沙箱（build/install/打包/删 node_modules 被拦、corepack、safe-delete、EPERM、PATH 被重置）—— 第一次识别到就交给用户手动跑，绝不自试第 2 次。
7. **需求清单唯一权威 = `I:\deepseekharness制作\.workbuddy\redolist2.html`**（2026-09-15 17:30 起为**第 2 阶段**权威，编号 N1 起，"修改与自制"）。旧 `redolist.html`（1–51 项 = 第 1 阶段）**已归档、只读**，其中未完成的项已迁入 redolist2 的乙组（N3–N9）。大改后必须逐项比对旧清单确认零遗漏。
8. 判定"过时/可删"必须现场取证，严禁沿用上一轮快照（2026-09-15 曾把用户刚装的 2.0.9 错列为"可删"）。
9. **同一文件不要并行发多个编辑**（2026-09-15 实测：并行 Edit 会静默丢改动，工具仍报成功）→ 逐个发，改完 grep 复核。
10. **沙箱 PATH 缺 Git 的 `usr/bin`** → `ls`/`dirname`/`sed` 全不可用、`yarn` shim 崩。跑命令前先 `export PATH="/e/app/Git/usr/bin:$PATH"`；`yarn` 仍可能因 shim 解析失败 → 改用 `node node_modules/<tool>/<entry>` 直调（如 `node node_modules/vitest/vitest.mjs run`）。
11. ⭐ **流程铁律（用户 2026-09-15 19:49 明确，此前我违反了）**：**讨论 → 结论一律先记入清单（`redolist2.html`），攒到阶段末「一次性实施」；严禁「刚拍板就立刻动代码」。**
    - 用户原话：「我觉你列清单，都记录在清单里面，最后需要确定了，我们再一次性修改！！！不是现在拍板就快速直接修改！！！」
    - 即：**拍板 ≠ 动工**；拍板只产生"清单上的一条已定项"。真正动工由用户另行下令，且尽量合并成一批。
    - 同理适用于**打包**（见 §八 打包策略）—— 现在是"**改动与打包都攒着，最后一起做**"。

## 二、定位与三个源头（不许混）

⭐ **定位（用户 2026-09-15 19:49 强调，全大写）**：「**你要记住，我们是在修改自己的东西了，和 DSH 没有太大关系了！！！！**」
- 我们做的是**我们自己的产品**（appId `deepseekharness.diy`）；DSH 只是**上游内核来源**，社区版 `dsh-desktop` 只是**一次性的参考样本**。
- 推论：**不要把"跟 DSH/社区保持一致"当成约束前提**；`vendor/` 里的第三方包（如 AA）**不一定要用，也可以大改成我们自己的东西**——它们是素材，不是标准。
- 具体到 N8：第三方 MIT 包 `@agents-anywhere/dsh-bridge-next` **可以先剥离，将来可能大改或替换成自研**。

- `deepseek-ai/deepseek-harness` = **DeepSeek 官方**（内核，唯一真官方）
- `anywhere-labs/dsh-desktop` = **社区版**（非官方，桌面外壳）
- `taikongcang/deepseek-DIY`（GitHub） = **我们的版本**
不再用"官方"单指任何一方。

**官方实况（2026-09-15 联网实证，详见 `tech-notes.md` §〇）**：官方仓库根是 **`pnpm-lock.yaml` + `pnpm-workspace.yaml` → 官方用 pnpm**；从源码跑 = `pnpm install` → `pnpm run build` → `pnpm dsh web`；插件 = **npm 包** + `package.json` 的 `dsh` 字段（`dsh.bundle.patch`），装卸走 `dsh plugin --profile <p> add/remove`（改完要重启）；要求 **Node 22.19+/24+ 且 pnpm 10+**。**⚠️ 官方根本没有桌面版**（无 Electron、无"打包 exe"的任何说明）→ **Electron 桌面化是社区自创**；官方**不涉及** `ELECTRON_RUN_AS_NODE`（它用**真 node.exe**）。**两层包管理器别混**：app 壳 = **yarn 4**（社区自选）、Profile 插件层 = **pnpm**（跟随官方）。

## 三、目录与基座
- **工作副本（唯一权威）：`I:\dsh-913`**（纯 ASCII —— 必须；中文路径会破坏 yarn 执行 bin）
- 社区参照（只读）：`I:\deepseekharness9-13\9-13DSH-desktop最新更新一套`
- 更新源：`I:\deepseekharness更新DIY\`（`发布\` + `工具\build-win.cmd` + `源码\`）
- 清单/文档/记忆：`I:\deepseekharness制作\.workbuddy\`（= 仓库 `project-notes/` 的源头）
- 打包产物：`I:\dsh-913\dsh-plugin-desktop\dist\`
- **现行安装 = `E:\app\deepseekharness`**（我们的版本）。**用户数据在 `data\`（profiles/settings/sessions/credentials）→ 绝不能删**。
- 基座：社区 **2.0.9** / 内核 **0.1.5-rc.1**；vendor **265 个**官方包；`patches/` **21 个**（18 社区自带 + 我方 3 个）。
- 架构：Electron 即宿主，dsh Host Cordis 根跑在 Electron main 进程里；`main.ts` 调官方 `@deepseek-ai/dsh-app-boot` 的 `boot()` 进程内挂载。
  - **子进程链（2026-09-15 实测抓到，详见 `tech-notes.md` §〇）**：`Electron main → node.mojom.NodeService utility → dsh-subprocess-local/lib/runner.js（Windows Job runner）→ pnpm.mjs` —— **每一层都是 `deepseekharness.exe`**（靠 `ELECTRON_RUN_AS_NODE=1` 冒充 node）。市场安装硬编码 `--registry=https://registry.npmjs.org/`。
  - ⭐ **「卸载卡死」根因 + 修复已定案并落地（2026-09-15）**：`pnpm remove` 卸载**带 `@napi-rs` 原生依赖**的包时，pnpm **干完活（自报 `Done in ~400ms`）但进程不退出**；**换成真 node.exe 同样复现** → **是 pnpm 11.8.0 自身的问题，与「Electron 冒充 node」无关**（⇒ **不必往安装包里塞真 node.exe**）。✅ **上游在 11.27.0 修掉了**（同条件实测：11.8.0 卡死 90s / 11.27.0 干净退出 0.5s）。**✅ 已落地（2026-09-15 19:0x）**：① `dsh-plugin-desktop/package.json` 的 pnpm → **`11.27.0`**；② 根 `package.json` 的 `resolutions` 补丁声明 → **`"pnpm@npm:11.27.0": "patch:pnpm@npm%3A11.27.0#./patches/pnpm@11.27.0.patch"`**（**旧 `pnpm@11.8.0.patch` 对 11.27.0 打不上**——实测 `patch does not apply`，已按同一组 5 处改动词重写并 `git apply --check` 通过）；③ `yarn install` 通过（联网拉包 +39.25 MiB）；④ market **266 测试全过 + 3 个 tsconfig 全 0**；⑤ **闭环实测：仓库里升级后的 pnpm 卸载带 `@napi-rs` 的包，0.6s 干净退出**。**pnpm 12 不升**（已改 native binary 架构）。⚠️ 旧补丁文件 `patches/pnpm@11.8.0.patch` **暂留未删**（待用户确认）。**「超时 + 对账」兜底仍保留。**
  - **能改**：`dsh-plugin-desktop/src/` 全部 ts + 我们自己的 workspace 包
  - **只能叠补丁**：vendor 里 265 个官方 tgz + 5 个第三方 npm 包
  - ⭐ **命令入口（2026-09-16 实测，N8 前置验证要用）**：
    - **app 内置终端里本来就有 `dsh` 命令** —— app 生成 `data\desktop\host-commands\<profile>\generations\<hash>\bin\dsh.cmd`，内容已自动设好 `ELECTRON_RUN_AS_NODE=1` + `DSH_HOME=<安装目录>\data` + `DSH_DESKTOP_DEFAULT_PROFILE=desktop`，并调 `app.asar\lib\desktop-cli.js`；终端会把这个目录**前置到 PATH**。
    - 另有 `data\desktop\cli\<hash>\bin\` = **dsh + node + pnpm 三件套**；`data\desktop\runtime-commands\generations\<hash>\bin\` = 只有 `pnpm.cmd`（市场装插件用的那条）。
    - **官方 `dsh plugin --profile <名> <args>` 支持本地 tarball**（`@deepseek-ai/dsh/lib/plugin-Ddi42qoW.js` 注释原文点名 "git/path/**tarball**/alias spec … reconciles by its **true package name**"），且**装完会自动对账 `dsh.profile.bundles`**（声明了 `dsh.bundle` 的依赖自动进 bundle 列表）。⇒ **N8"装回来"的卡口基本解除。**
    - ⚠️ **`DSH_HOME` 是"无条件"覆盖的**（`main.ts:387-391` 注释 `Deliberately unconditional`，只有恢复助手的数据目录切换器能覆盖）→ **不能用外部环境变量跑测试**，要用 app 自己的 **Profile 切换 UI**（设置 → Profile：可创建/选择；文案键 `profileTitle/profileIntro/profileName/profileReady/profileUnavailable`）。

## 四、更新方针（用户 2026-09-15 重新定义）
- **社区版对我们只是「参考样本」，不是追随对象。** 社区发版不构成我们的升级理由，它升级后的东西不一定是我们需要的。
- 只走一条线：**官方内核改了什么 → 社区跟着改了什么 → 从中挑我们需要的**，借过来改成自己的。
- 要改**直接在 `I:\dsh-913` 上改**；我们已有自己的更新源与更新方法。
- ⛔ **作废三条**：①「全量追最新社区版」②「先升级、后改动 DIY」③「升级到社区 v2.0.10 + 新建 `I:\dsh-915`」。
- ⚠️ **打补丁 vs 直接改（是事实，不是方针）**：**只有没有源码的成品 tarball 才叠补丁**（官方 265 个 tgz + 5 个第三方 npm 包）；**我们自己的包（`dsh-plugin-desktop` / `dsh-community-fabric` / `dsh-community-market`）一律直接改源码**。
- 官方内核「**按需追**」；追前先评估补丁重适配成本（补丁文件名写死版本号，官方出新版多半要重写）。
- 起步阶段会话数据不备份，用户说需要才备份。

## 五、我方定制口径（已定稿）
- **改名**：`deepseekharness`（任务栏）/ `lisa`（标题栏，全软件仅此一处）/ `R9`（终端）/ appId `deepseekharness.diy` / 产物名 `deepseekharness-*`。
- **数据目录**：默认便携（改 `main.ts` 兜底值），不覆盖官方可切换机制、尊重用户显式设的 `DSH_HOME`。
- **beta 通道已整体摘除**（2026-09-15，用户"不要了"）；`upstream.json` 的 `activeChannel` = `stable`。
- **版本号 = 自有序列**，从 `3.0.0` 起，**必须大于上一个已发出的号**（客户端更新检查靠版本号比较）。唯一版本源 = `dsh-plugin-desktop/package.json`。每次对齐 → 在仓库根 `UPSTREAM-ALIGNMENT.md` **新增一行**。
- **代码托管**：公开仓 `taikongcang/deepseek-DIY`。**双 remote**：`origin` = 社区（对比用，**永不推**）、`diy` = 我们的（**只推这里**）。
  - ⭐ **分支约定（2026-09-15 20:37 更新：`diy-main` 已改名为 `main`）**：本地**当前工作分支 = `main`**（跟踪 `diy/main`，**已同步**）→ **`git push` 直接可用**（实测 `--dry-run` = `Everything up-to-date`）。远端 `diy` 只有 **一个分支 `main`**（= 默认分支）。本地另有 `master`（带社区 **13261** 提交，跟踪 `origin/master`，**只作社区对比**）。
  - ⚠️ **`push.default=simple` 的坑**：它要求**本地与远端分支同名**，否则 `git push` 直接 `fatal`（exit 128）。所以"设好跟踪引用"**不等于**"能直接 push" —— 必须**名字也对上**（这正是把 `diy-main` 改名 `main` 的原因）。
  - ⚠️ **`git fetch`/`git update-ref` 建不出 `refs/remotes/diy/main`**（命令报成功、引用却不落盘；而 `.git/refs/` 目录实测可 mkdir/可写）→ **正解：直接写松散引用文件** `.git/refs/remotes/diy/main`（内容 = 40 位 sha + 换行），**跨调用持久**。
  - ✅ **防误推已装（2026-09-15 20:45，用户同意）**：`git config remote.origin.pushurl "BLOCKED://origin-is-the-community-repo-never-push-to-it"` → 在 `master` 上误执行 `git push` **立刻 fatal 被拦**（实测 `remote helper 'BLOCKED' aborted session`，exit 128），**再也推不到社区仓库**。`remote.origin.url`（fetch 用）保留不动。
- 文档在 `project-notes/`（**源头是 `.workbuddy`**）→ **改完清单/记忆后要拷过去 + 提交推送**，否则 GItHub 上又落后。
- ✅ **`bilingual-docs.mjs` 只认已被 git 跟踪的 `*.i18n.yaml`** → `project-notes/` 无 i18n 文件，**往里面加 `.md`/`.html` 不需要补 i18n 哈希**。
- **`AGENTS.md` 已重写**为我们的真实约束（ASCII 路径 / 不拉 submodule / 只发 stable / `dist:win` 不用 `package:dir` / `DSH_AA_SOURCE_REF=pinned` / 补丁边界 / 版本号规则），并**禁止 AI 读 `.agents/`**（社区设计笔记，保留供人参考）。
- **打包一律走 `工具\build-win.cmd`**（设 `DSH_AA_SOURCE_REF=pinned` + 三个镜像兜底 → `yarn dist:win`）。**永远用 `dist:win`，不用 `package:dir`**（Windows 上游缺陷）。

## 六、已踩坑（只列结论，详解见 `tech-notes.md` §五）
1. 中文路径破坏 yarn 执行 bin → 工作副本必须纯 ASCII
2. 沙箱重置子进程 PATH → git 的 sh 子命令失败，交用户手动跑
3. 沙箱内 PowerShell stdout 不回传 → 写文件再 Read；PS 脚本不能含中文
4. Yarn 4 搬家后要删 `node_modules` + `.yarn/install-state.gz` 重装
5. 沙箱跑 Electron EXE 先清 `ELECTRON_RUN_AS_NODE` / `NODE_OPTIONS`
6. 沙箱 shim 会留空壳 node_modules 挡 dsh heal
7. 走 `ELECTRON_BUILDER_BINARIES_MIRROR` 镜像过证书墙
8. Defender 拦 NSIS → 加排除项再打包
9. SAC 拦未签名 exe（与 Defender 无关；本机 = 强制模式）
10. 改双语文档必须同步 i18n 哈希（`git hash-object --path=`）
11. `cordis.patch.yml` 按 id 的 patch 是整体替换，必须重述所有字段
12. 打包前 Electron 二进制必须已装（v43.3.0）
13. `package:dir` Windows 必失败（上游缺陷）→ 用 `dist:win`
14. 沙箱 safe-delete 假报错但真删 → 只认 `Test-Path`
15. 判断二进制包是否真改过，不能看 sha256 → 解包逐文件比对
16. 打包前必设 `$env:DSH_AA_SOURCE_REF=pinned`
17. `yarn check:layout` 跑不通（预期，我们不拉 submodule）
18. `bilingual-docs.mjs` 用 `git ls-files` → 删目录后必须 `git add -A`（**且它只认已被 git 跟踪的 `*.i18n.yaml`** → 往无 i18n 的目录加 `.md` 不用补哈希）
19. `push.default=simple` 要求**本地与远端分支同名**，否则 `git push` 直接 `fatal`(exit 128) → "设好跟踪"**不等于**"能直接 push"
20. `git fetch`/`git update-ref` **建不出 `refs/remotes/diy/main`**（报成功但不落盘；`.git/refs/` 明明可写）→ **直接写松散引用文件**才成

## 七、用户偏好
- 工具/产物/缓存装 **E 盘**；**代码全 AI 写、用户验收**；产物放 `I:\deepseekharness制作`。
- 草稿先入 `.workbuddy\`，用户确认后再归类。
- 插件代码：参考原码 → `I:\deepseek-harness\插件\复制代码\`；我方改的 → `I:\deepseek-harness\插件\修改代码\`（**命名先告知**）。

## 八、待办 / 暂停
- 【暂停】自研"费用插件"（2026-09-02 叫停）；老源码在 `I:\deepseek-harness\插件\cost-meter-完整源码\`。
- 【挂账 · 详见 `redolist2.html`】**用户 2026-09-15 已裁决**：CA 证书名(N4) 与 目录选择器补丁文案(N5) = **不改**；Electron 探针(N6) = **留到后面做**；**手机连接(N8) = 真剥离 + 独立插件化（方案 A，方案书 `N8-aa-extraction-plan.md`；3 项决策挂账：装回来的入口 / tgz 存哪 / 上不上 GitHub）**；**"立即重启"报错(N9) = 改用我们自己的重启入口（9-b）→ 直接调已存在的无令牌端点 `POST /api/desktop/restart`，旁路上游一次性令牌**；**界面显示耗时(N11) = ⛔ 已取消（用户 2026-09-15 20:05；理由：它不是卸载问题，而卸载问题已被 N1 双保险解决 → 动机消失）**。其余：绿泡泡(N3 暂缓)｜Profile 名 `desktop` 改名(N7，与最后打包合并做)｜**启动自愈(N10) = 📝 已定（用户 20:13 采纳"分级 + 宽容 + 可见 + 你来决定"）**。**绿泡泡(N3) = ⏸ 暂缓 · 不在本轮（用户 2026-09-16 00:11：「暂时不做了，等我考虑好了再说」）**。**N1 卸载卡死 = ✅ 已修（2026-09-15）。**
- 【挂账 · **本次全量盘点新发现（2026-09-15 20:15，清单外·之前没人管的 9 条，见 redolist2 §己 N50–N58）**】：**N50 git 未提交**（6 改 + 1 未跟踪 `patches/pnpm@11.27.0.patch` —— N1 改动全在工作区）｜**N51 GitHub 严重落后**（远端只有 `refs/heads/main` = `f48fb54a99` 旧快照）｜**N52 `diy-main` 跟踪引用坏了**（跟踪 `diy/main`，远端实为 `main`，显示 `gone`）｜**N53 `.github/` 5 个社区文件仍在**（`workflows/ci.yml` + 3 issue 模板 + PR 模板；self-audit 第 7 条从未决策）｜**N54 `project-notes/` 未同步**今天 4 个文档｜**N55 旧补丁 `pnpm@11.8.0.patch` 未删**（已无引用）｜**N56 回收站实测 8.8 GB**（旧记 7.03，已按实测更新）｜**N57 `I:\deepseekharness` 野目录实测 0 字节**（只剩空 `AI股票`）｜**N58 `I:\` 根 9 个新探测文件**（`_g1..3`/`_r1..6`，16:4x 产生；批 7 的 14 个 `_q*.txt` 实测已清完）。
  - **用户 2026-09-15 20:23 处置**：**N57 = ⛔ 永久标记「不需要管」，永远不处理、不再询问**；**N55 / N56 / N58 = 📝 已定：清理**；**N50–N54 = 🔥 优先处理（方案已出，见 redolist2 §己）**。
  - ✅ **执行结果（2026-09-15 20:32–20:45，已实测完成）**：**§己 9 条全部结案** —— **N50/N51/N52/N53/N54/N55/N58 由 AI 完成**；**N56（回收站）用户 20:44 已手动清空**（现场复核：8.8 GB → 31 MB，I 盘可用 484→493 GB）；**N57 永久不管**。
    - ⭐ **N50–N58 这组已全部关闭，§己 结案。清单已进入「🔨 开工清单」阶段（待实施：N9 → N8+N10 → N7 → N6 → N3/丁组 → N90）。**
    - N53 选 **53-a 全删** `.github`（5 文件；git 历史可恢复；远端树已核实无 `.github`）
    - N54 同步 8 个文档到 `project-notes/`；✅ 无需补 i18n（脚本只认已跟踪的 i18n.yaml）
    - N55 删 `patches/pnpm@11.8.0.patch`（已无引用）
    - N58 9 个探测文件从 `I:\` 根**归档**到 `.workbuddy\_archive\agent-probe-2026-09-15\`（可逆）；✅ `I:\` 根零残留
    - N50 提交 `96a57d27df`（20 条变更，全符合预期）；N51 推送 `f48fb54a99..96a57d27df`；N52 跟踪修好 + 本地分支改名 `main`
    - **端到端验证 5 项全过**：工作区干净 / 远端 = `96a57d27df` / 远端无 `.github` / 远端含新补丁与新文档 / `git push --dry-run` = up-to-date
- 【复核纠正 · 记录与实测不符】① `self-audit` C 类称"已删孤儿 tgz `vendor/agents-anywhere/…tgz`" → **实测仍在**（522 KB；但它是 N8 素材，保留正确）② `cleanup-plan` 批 7 记"剩 14 个待清" → **实测已清完** ③ `redolist.html:57` 写"44 项编号" → 实际编到 **51**（归档只读，仅记录不改）。
- 【复核确认已做完】`deepseek-harness` 悬空 submodule gitlink **已清**｜旧工作副本 **已删**｜根 `package.json` description **已改**｜beta 引用 **已摘净**｜社区参照目录 **仍在（正确）**｜`I:\deepseek-harness\插件\` 三个目录 **均在**。
- 【遗留 · 已全部结案（2026-09-15 20:45 复核）】回收站 **✅ 用户 20:44 手动清空**（8.8 GB → 31 MB）｜`I:\deepseekharness` 野目录 **⛔ 永久不需管**（N57）｜`dsh-913\deepseek-harness` 悬空 submodule 条目 **✅ 已清**。
- **清单**：权威 = **`redolist2.html`**（第 2 阶段，N1 起，"修改与自制"）；`redolist.html`（51 项）= 第 1 阶段，**已归档只读**。
- **实施 + 打包策略（2026-09-15 用户定，19:49 强化）**：**所有改动先记入清单；不逐个改动就打包，也不边拍板边改代码** → 攒到"修改与自制"告一段落 → **改动与打包一起、一次性做完**（redolist2 §戊 N90）。
