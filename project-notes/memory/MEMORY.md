# deepseekharness 桌面版 —— 项目长期约定

> 2026-09-16 精简（去重压缩）。**技术细节全在 `.workbuddy/tech-notes.md`**；更早的过期内容归档在 `memory/2026-09-14.md`。
> 本文件只留 **规则 / 口径 / 索引**。

## 〇、定位：从自制 3.0.0 起，一切皆自制（最高优先级）

⭐ 用户 2026-09-16 原话：
> 「从我们自制 3.0.0 开始，不论 DSH-desktop，还是其他插件，都是修改为我们自己，自研自制，其他任何东西是作为参考和学习使用，代码要经过我们自己修改，选取其中可用的删除不需要的，形成自己的。」

前一句（2026-09-15 19:49，全大写）：
> 「你要记住，我们是在修改自己的东西了，和 DSH 没有太大关系了！！！！」

**硬性推论**：
1. DSH 官方 / 社区版 / **任何第三方包**（`vendor/` 里 265 个官方 tgz、5 个第三方 npm 包、AA、cost-meter …）**一律只是参考素材**，不是标准，也不是必须保留的依赖。
2. **成品必须是我们改过的**：选取可用的、删掉不需要的，形成自己的东西。
3. **严禁**以「与上游 / 社区保持一致」为前提去否决改动。
4. **叠补丁只是权宜手段**（无源码的 tarball 只能打补丁）；只要打算长期维护，就该**取源码改成我们自己的**。

三个源头的固定用词（不许混）：

| 名称 | 是什么 |
|---|---|
| `deepseek-ai/deepseek-harness` | **DeepSeek 官方**（内核；⚠️ **官方没有桌面版**，Electron 桌面化是社区自创） |
| `anywhere-labs/dsh-desktop` | **社区版**（非官方桌面外壳） |
| `taikongcang/deepseek-DIY` | **我们的版本**（公开仓） |

## 一、铁律（永远遵守）

1. **先原理后动手**：讲原理 → 列规则清单 → 用户点头 → 才执行；严禁抢跑。
2. **讨论要真、动手要稳、认错要干脆**：基于真实数据，严禁猜编造；犯错直接承认。
3. **绝不隐瞒改动**：漏掉 / 偷换 / 简化的必须主动报告。
4. **动手前先查证**：读源码 / 文档；查不到就明说"没查到"，不拿猜当实锤。
5. **改方案 / 写代码前先列方案**，用户点头再动。
6. **需要手动 PowerShell 就立即停下告知用户**，严禁反复试绕过沙箱（build / install / 打包 / 删 node_modules 被拦、corepack、safe-delete、EPERM、PATH 被重置）—— 第一次识别到就交给用户手动跑，绝不自试第 2 次。
7. **需求清单唯一权威 = `I:\deepseekharness制作\.workbuddy\redolist2.html`**（2026-09-15 17:30 起为**第 2 阶段**权威，编号 N1 起）。旧 `redolist.html`（1–51 项 = 第 1 阶段）**已归档、只读**，未完成项已迁入 redolist2 乙组。大改后必须逐项比对确认**零遗漏**。
8. **判定"过时 / 可删"必须现场取证**，严禁沿用上一轮快照。
9. **同一文件不要并行发多个编辑**（实测并行 Edit 会静默丢改动，工具仍报成功）→ 逐个发，改完 grep 复核。
10. **沙箱 PATH 缺 Git 的 `usr/bin`** → 跑命令前先 `export PATH="/e/app/Git/usr/bin:$PATH"`；`yarn` shim 仍可能解析失败崩掉 → 改用 `node node_modules/<tool>/<entry>` 直调（如 `node node_modules/vitest/vitest.mjs run`）。
11. ⭐ **流程铁律**：**讨论 → 结论一律先记入清单，攒到阶段末「一次性实施」；严禁「刚拍板就立刻动代码」。**
    - 用户原话：「我觉你列清单，都记录在清单里面，最后需要确定了，我们再一次性修改！！！不是现在拍板就快速直接修改！！！」
    - 即 **拍板 ≠ 动工**：拍板只产生"清单上的一条已定项"，真正动工由用户另行下令。**打包同理** —— 改动与打包都攒着，最后一起做。
12. ⭐ **一切皆自制**（2026-09-16 用户强化）—— 见 §〇。

## 二、目录 / 基座 / 架构

**目录**
- **工作副本（唯一权威）：`I:\dsh-913`**（纯 ASCII —— 必须；中文路径会破坏 yarn 执行 bin）
- 社区参照（只读）：`I:\deepseekharness9-13\9-13DSH-desktop最新更新一套`
- 更新源：`I:\deepseekharness更新DIY\`（`发布\` + `工具\build-win.cmd` + `源码\`）
- 清单 / 文档 / 记忆：`I:\deepseekharness制作\.workbuddy\`（= 仓库 `project-notes/` 的源头）
- 插件素材：`I:\deepseek-harness\插件\`（`复制代码\` = 原版 / `修改代码\` = 我方改版）
- 打包产物：`I:\dsh-913\dsh-plugin-desktop\dist\`
- **现行安装 = `E:\app\deepseekharness`**。**用户数据在 `data\`（profiles / settings / sessions / credentials）→ 绝不能删。**

**基座**：社区 **2.0.9** / 内核 **0.1.5-rc.1**；vendor **265 个**官方包；`patches/` **20 个**（18 社区自带 + 我方 2 个）。

**架构**：Electron 即宿主，dsh Host Cordis 根跑在 Electron main 进程内；`main.ts` 调官方 `@deepseek-ai/dsh-app-boot` 的 `boot()` 进程内挂载。
- **子进程链**：`Electron main → node.mojom.NodeService utility → dsh-subprocess-local/lib/runner.js（Windows Job runner）→ pnpm.mjs` —— **每层都是 `deepseekharness.exe`**（靠 `ELECTRON_RUN_AS_NODE=1` 冒充 node）。市场安装硬编码 `--registry=https://registry.npmjs.org/`。
- **能直接改**：`dsh-plugin-desktop/src/` 全部 ts + 我们自己的 workspace 包。
- **只能叠补丁（过渡）**：vendor 里 265 个官方 tgz + 5 个第三方 npm 包 —— 长期方向是取源码改成自己的（见 §〇）。
- ⭐ **命令入口（N8 前置验证要用）**：
  - **app 内置终端里本来就有 `dsh` 命令** —— app 生成 `data\desktop\host-commands\<profile>\generations\<hash>\bin\dsh.cmd`，已自动设好 `ELECTRON_RUN_AS_NODE=1` + `DSH_HOME=<安装目录>\data` + 默认 profile，并调 `app.asar\lib\desktop-cli.js`；终端会把它前置到 PATH。
  - `data\desktop\cli\<hash>\bin\` = **dsh + node + pnpm 三件套**；`runtime-commands\...\bin\` = 只有 `pnpm.cmd`（市场装插件用）。
  - **官方 `dsh plugin --profile <名> <args>` 支持本地 tarball**（源码注释原文点名 "git/path/**tarball**/alias spec … reconciles by its **true package name**"），**装完自动对账 `dsh.profile.bundles`** ⇒ **N8"装回来"卡口基本解除。**
  - ⚠️ **`DSH_HOME` 是"无条件"覆盖的**（`main.ts:387-391`，注释 `Deliberately unconditional`）→ **不能用外部环境变量跑测试**，要用 app 自己的 **Profile 切换 UI**。

**卸载卡死根因级修复（N1，2026-09-15 落地）**：根因 = `pnpm remove` 卸载**带 `@napi-rs` 原生依赖**的包时，**干完活但不退出**；**是 pnpm 11.8.0 自身问题**（换真 node.exe 同样复现 ⇒ 与"Electron 冒充 node"无关，**不必塞真 node.exe**）。上游 **11.27.0 修掉**。已落地：pnpm → **`11.27.0`** + 重写 `patches/pnpm@11.27.0.patch`；测试 266 全过；闭环实测 0.6s 干净退出。**pnpm 12 不升**。**「超时 + 对账」兜底保留。**

## 三、更新方针（2026-09-15 用户重新定义）

- **社区版只是「参考样本」，不是追随对象**；社区发版不构成我们的升级理由。
- 只走一条线：**官方内核改了什么 → 社区跟着改了什么 → 从中挑我们需要的**，借过来改成自己的。
- 要改**直接在 `I:\dsh-913` 上改**；已有自己的更新源与更新方法。
- ⛔ **作废三条**：①「全量追最新社区版」②「先升级、后改动 DIY」③「升级到社区 v2.0.10 + 新建 `I:\dsh-915`」。
- 官方内核「**按需追**」；追前先评估补丁重适配成本（补丁文件名写死版本号，官方出新版多半要重写）。
- 起步阶段会话数据不备份，用户说需要才备份。

## 四、我方定制口径（已定稿）

- **改名**：`deepseekharness`（任务栏）/ `lisa`（标题栏，全软件仅此一处）/ `R9`（终端）/ appId `deepseekharness.diy` / 产物名 `deepseekharness-*`。
- **数据目录**：默认便携（改 `main.ts` 兜底值），不覆盖官方可切换机制、尊重用户显式设的 `DSH_HOME`。
- **beta 通道已整体摘除**；`upstream.json` 的 `activeChannel` = `stable`。
- **版本号 = 自有序列**，从 `3.0.0` 起，**必须大于上一个已发出的号**。唯一版本源 = `dsh-plugin-desktop/package.json`。每次对齐 → 仓库根 `UPSTREAM-ALIGNMENT.md` **新增一行**。
- **代码托管**：公开仓 `taikongcang/deepseek-DIY`。**双 remote**：`origin` = 社区（对比用，**永不推**）、`diy` = 我们的（**只推这里**）。
  - ⭐ **分支约定**：本地**当前工作分支 = `main`**（跟踪 `diy/main`，已同步）→ **`git push` 直接可用**（实测 `--dry-run` = up-to-date）。远端 `diy` 只有 **一个分支 `main`**。本地另有 `master`（带社区 **13261** 提交，跟踪 `origin/master`，**只作社区对比**）。
  - ⚠️ **`push.default=simple` 要求本地与远端分支**同名**，否则 `git push` 直接 `fatal`（exit 128）→ "设好跟踪"**不等于**"能直接 push"（这就是 `diy-main` 改名 `main` 的原因）。
  - ⚠️ **`git fetch` / `git update-ref` 建不出 `refs/remotes/diy/main`**（报成功却不落盘）→ **正解：直接写松散引用文件**，内容 = 40 位 sha + 换行，跨调用持久。
  - ✅ **防误推已装**：`git config remote.origin.pushurl "BLOCKED://origin-is-the-community-repo-never-push-to-it"` → 在 `master` 上误执行 `git push` **立刻 fatal 被拦**（实测 exit 128）。`remote.origin.url`（fetch 用）保留不动。
- 文档在 `project-notes/`（**源头是 `.workbuddy`**）→ **改完清单 / 记忆后要拷过去 + 提交推送**，否则 GitHub 落后。
- ✅ `bilingual-docs.mjs` 只认**已被 git 跟踪的 `*.i18n.yaml`** → `project-notes/` 无 i18n 文件，往里面加 `.md`/`.html` **不需要补 i18n 哈希**。
- **`AGENTS.md` 已重写**为我们的真实约束（ASCII 路径 / 不拉 submodule / 只发 stable / `dist:win` 不用 `package:dir` / `DSH_AA_SOURCE_REF=pinned` / 补丁边界 / 版本号规则），并**禁止 AI 读 `.agents/`**（社区设计笔记，保留供人参考）。
- **打包一律走 `工具\build-win.cmd`**（设 `DSH_AA_SOURCE_REF=pinned` + 三个镜像兜底 → `yarn dist:win`）。**永远用 `dist:win`，不用 `package:dir`**（Windows 上游缺陷）。

## 五、已踩坑（结论速查，详解见 `tech-notes.md`）

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
15. 判断二进制包是否真改过不能看 sha256 → 解包逐文件比对
16. 打包前必设 `$env:DSH_AA_SOURCE_REF=pinned`
17. `yarn check:layout` 跑不通（预期，我们不拉 submodule）
18. `bilingual-docs.mjs` 用 `git ls-files` → 删目录后必须 `git add -A`；且只认已跟踪的 `*.i18n.yaml`
19. `push.default=simple` 要求本地与远端分支同名（见 §四）
20. `git fetch` / `git update-ref` 建不出远程跟踪引用 → 直接写松散引用文件

## 六、用户偏好

- 工具 / 产物 / 缓存装 **E 盘**；**代码全 AI 写、用户验收**；产物放 `I:\deepseekharness制作`。
- 草稿先入 `.workbuddy\`，用户确认后再归类。
- 插件代码命名：参考原码 → `复制代码\`；我方改的 → `修改代码\`（**命名先告知**）。

## 七、清单状态与待办

**清单**：权威 = **`redolist2.html`**（第 2 阶段，N1 起，"修改与自制"）；`redolist.html`（51 项）= 第 1 阶段，**已归档只读**。

**实施 + 打包策略**：所有改动先记入清单；**攒到"修改与自制"告一段落 → 改动与打包一起、一次性做完**（redolist2 §戊 N90）。

**🔨 开工清单（待实施，按序）**：
1. **N9** 重启入口改调我们自己的无令牌端点（无前置）
2. **N8 + N10**（同一批，都动 `profile.ts`）
3. **N7** Profile 名 `desktop` 改名（与最后打包合并做）
4. **N6** Electron 探针（须用户手动跑）
5. **N90** 一次性实施全部已定项 + 最后打包 + 安装验证

**📝 各项裁决（详细方案 / 取证都在 redolist2）**：

| 项 | 裁决 |
|---|---|
| **N1** 卸载卡死 | ✅ **已修**（治标：超时 + 对账；治本：pnpm → 11.27.0） |
| **N8** 手机连接剥离 | 📝 **真剥离 + 独立插件化**（方案书 `N8-aa-extraction-plan.md`）；**前置验证用户定"放到最后做"**；3 项决策挂账：a 装回来的入口 / b tgz 存哪 / c 上不上 GitHub |
| **N9**「立即重启」报错 | 📝 **改用我们自己的无令牌端点** `POST /api/desktop/restart`，旁路上游一次性令牌 |
| **N10** 启动自愈 | 📝 **分级 + 宽容 + 可见**（只对"包不存在"宽容；界面给「重试加载」/「从清单移除」） |
| **N7** Profile 名 `desktop` 改名 | 📝 已定，与最后打包合并做 |
| **N6** Electron 探针 | 📝 留到后面做（须用户手动跑） |
| **N3** 绿泡泡 | ⏸ 暂缓，等用户考虑（不阻塞） |
| **N11** 界面显示耗时 | ⛔ 已取消 |
| **系统提示词中文化** | ⛔ 已放弃 |
| **N4 / N5** CA 证书名 · 目录选择器补丁文案 | ⛔ 不改 |

**丁组自制（全部"暂不讨论、最后再考虑"，不阻塞开工）**：

| 编号 | 内容 | 关键取证 / 落点 |
|---|---|---|
| **N30** | **右侧栏进化**（做到像 WorkBuddy 那样直接查看/编辑文件·代码·文档） | 右侧栏现**只读**（`sidebar-files` 浏览 + `sidebar-documentpreview` 预览）；落点待选型：改官方包叠补丁 **vs** 自制客户端插件 |
| **N31** | **接入记忆服务** | 官方**不内建记忆**，走 MCP 外挂第三方（Memorix / MCP Reference Memory / Engram 三选一）；**纯配置零代码** —— 把示例 `insert` patch 合并进 `$DSH_HOME/profiles/<名>/cordis.patch.yml` 或 `$DSH_HOME/cordis.patch.yml` |
| **N32** | **记忆管理界面** | **官方没有**（全 UI 包搜「记忆」零命中 / 无 UI 包处理 `mcp` / `dsh-mcp-client` 无 `dsh.client` / 设置仅 5 页）；记忆只以工具 `mcp__…` 形式存在。**依赖 N31** |
| **N33** | **用量管理（🔴 重新制作中 · 基准 = 上游 1.7.28）** | 用户 2026-09-16 21:2x：「**不管之前是怎么做的，我们重新制作这个用量的插件，删除一部分不需要的，保留一些需要的，然后制作成插件，添加到我们的 deepseekharness 里面去**」；21:41：「**使用最新的 1.7.28，我们重新修改**」⇒ **① 源码基准 = 1.7.28（已定）**；② 保留/删除哪些、③ 256 KiB 上限怎么办 —— **待用户圈**。<br>底子 = 第三方 `dsh-cost-meter`（MIT，`Han-1413141/dsh-cost-meter`）。**源码已归档**：`I:\deepseek-harness\插件\复制代码\cost-meter-1.7.28\`（GitHub tag 归档，含 `src/`，**不含 `.git`**）。⚠️ npm 包**不含 `src/`**，改界面必须用 GitHub 归档。<br>**功能全景已落档 `N33-usage-plugin-feature-inventory.md`（1.7.28 基准，9 组 51 项）**。<br>**四条关键事实**：① 🔴 **客户端产物 261898 / 上限 262144 → 只剩 246 字节**（`build.mjs` 与 `test/verify.mjs` 两处都卡）⇒ **想加 UI 必须先减** ② 源码是 `src/client/` **4 个有序片段**（客户端是单一 `__ModuleLoader__` 闭包，**不能拆真 ES 模块**）③ `charset:'utf8'` **上游已内建**；`keepNames` 改 false ④ **`peakStyle` 已回到 `compact\|classic`**，`pendulum` 命中 0 ⇒ **我们 08-31 的 ring/摆锤改动全部作废，要重新移植**。<br>规模：`lib/` 25 个文件（原 12）· `test/` 32 个测试 · 依赖只剩 `zod` 4.5.1（另两个降 peerDependencies）。<br>⚠️ 1.7.x 前段翻过车（v1.7.0 导致 dsh 无法启动 / v1.7.8·v1.7.9 TDZ 崩溃）⇒ 改完**必须跑它 32 个测试回归**。<br>**现状：app 里没有它**。参考：DSH **自带** token/上下文用量显示，与本插件**互补**（内置管 token 与上下文，它管"钱"和历史） |

**§己 全量盘点（N50–N58）已全部结案（2026-09-15）**：7 条由 AI 完成（git 提交/推送、删 `.github`、同步 `project-notes`、删旧补丁、归档 9 个探测文件）；**N56 回收站用户手动清空**；**N57 = ⛔ 永久不需要管，永不再问**。**已结案，不再跟踪。**
**复核纠正（记录曾与实测不符，已修正）**：孤儿 tgz `vendor/agents-anywhere/…tgz` **实测仍在**（是 N8 素材，保留正确）；`cleanup-plan` 批 7 的 14 个 `_q*.txt` **实测已清完**；`redolist.html` 写"44 项编号"实际 **51**（归档只读，不改）。
