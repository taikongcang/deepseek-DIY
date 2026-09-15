# 目录现状与用途（更新：2026-09-15 10:3x）

> 目的：避免过几天忘了哪个目录是哪个。**改代码前先看这张表。**

## 一、代码副本（最关键的一张）

| 路径 | 用途 | 状态 |
|---|---|---|
| **`I:\dsh-913`** | **工作副本 —— 所有改动都在这里** | ✅ **在用，只认这个** |
| `I:\deepseekharness9-13\9-13DSH-desktop最新更新一套` | 社区版**原样 clone** | 📖 只读参照（对比"上游原版长什么样"） |
| ~~`I:\dsh-desktop`~~ | 2.0.4 时代工作副本 | 🗑 **2026-09-15 移入回收站**（2.72 GB） |
| ~~`I:\deepseekharness9-13\9-13deepseekharness最新更新修改`~~ | 旧工作副本（中文路径） | 🗑 **2026-09-15 移入回收站**（1.75 GB） |
| ~~`I:\deepseekharness9-13\9-13deepseekharness更新打包`~~ | 原计划的打包输出目录（从未用过） | 🗑 **2026-09-15 删除**（空目录） |

> 📌 **现在 `I:\deepseekharness9-13\` 下只剩一个 `9-13DSH-desktop最新更新一套`**；`I:\deepseekharness制作\` 下只剩 `.workbuddy\`。
> ⚠️ **回收站里还压着 7.03 GB（I 盘）** —— 这部分**尚未真正释放**，要等清空回收站。见第六节。

### 为什么曾经有两个工作副本？（历史，已结束）
2026-09-14 排查出：**yarn 在含中文的路径下执行 `package.json` 脚本时会把路径弄坏**
（报 `Cannot find module 'I:\...<乱码>\node_modules\...\run.mjs'`，`market` 的 check、`desktop` 的 build/test 全挂）。
→ 结论：**工作副本必须放纯 ASCII 路径**。用户选"乙"（正式搬迁），
于是把 `9-13deepseekharness最新更新修改` 复制到 **`I:\dsh-913`**。

✅ **2026-09-15：这段历史已收尾** —— `I:\dsh-913` 是唯一工作副本，旧副本已移入回收站（见上表）。
（当时"旧目录留着当备份"的必要性已经消失：我们的改动全部沉淀在 `I:\dsh-913` 与 `patches\`。）

## 二、工作区（我们的文档/清单/记忆）

| 路径 | 用途 |
|---|---|
| `I:\deepseekharness制作\` | 工作区根目录 —— **2026-09-15 清理后只剩 `.workbuddy\`**（旧原型残留已移入回收站） |
| `.workbuddy\redolist.html` | **需求清单（唯一权威，38 项编号）** |
| `.workbuddy\plan-01-rename.html` / `plan-b-fix.html` | 各阶段施工/修补方案 |
| `.workbuddy\run-check-guide.md` / `run-package-guide.md` | 验证指引 / 打包指引 |
| `.workbuddy\cleanup-plan.md` | **清理方案**（批次总表 + 保留/归档对照 + 执行方式） |
| `.workbuddy\directory-map.md` | **本文件** —— 目录现状与用途 |
| `.workbuddy\item01-supplement-audit.html` | 第 1 项补遗审计报告（证据） |
| `.workbuddy\功能盘点清单.md` | 需求来源 |
| `.workbuddy\plugin-index.txt` | 官方插件一行用途索引（产出，可复用） |
| `.workbuddy\scripts-rename-audit.mjs` | 改名审计工具（被记忆与清单引用） |
| `.workbuddy\memory\` | 项目记忆：`MEMORY.md`（长期约定）＋ `YYYY-MM-DD.md`（每日日志） |
| `.workbuddy\_archive\` | **2026-09-15 起**：一次性产物归档区（42 个：各项 diff/verify 记录、探测脚本、过期快照等） |
| `.workbuddy\{awesome-catalog, backups, pics, tmp-conn, tmp-homepaths}\` | 资料/备份/图片等，本轮**未动** |

## 三、更新源（**已建立**，2026-09-14）

| 路径 | 用途 | 状态 |
|---|---|---|
| `I:\deepseekharness更新DIY\` | **我们自己的更新源根目录**（B 方案：本地源，不开服务器） | ✅ 已建立 |
| `I:\deepseekharness更新DIY\发布\` | **客户端来取更新的地方** —— `version.json`（已就位，`{"version":"2.0.9"}`）+ 安装包（待打包后拷入） | ✅ 结构已建，安装包待放 |
| `I:\deepseekharness更新DIY\源码\` | 预留：将来的源码工作副本 | ⏳ 空（⚠️ 路径含中文，**不能**当工作目录跑 yarn） |

> 客户端硬编码地址：`dsh-plugin-desktop/src/update-checker.ts` → `DESKTOP_UPDATE_SOURCE_DIRECTORY = 'I:\\deepseekharness更新DIY\\发布'`
> 期望的安装包文件名：`deepseekharness-<版本>-x64-Setup.exe`（与 `nsis.artifactName` 一致，**不用改名**）

## 四、代码内部的关键子目录（`I:\dsh-913\` 下）

| 路径 | 说明 |
|---|---|
| `dsh-plugin-desktop/` | **桌面外壳主包**（Electron 桥、托盘、窗口、更新、终端……）——我们改得最多 |
| `dsh-community-market/` | 插件市场包（我们改了源、文案、删了设置里的市场 tab） |
| `dsh-community-fabric/` | fabric 包（改动很少） |
| `dsh-plugin-desktop-beta/` | beta 通道包（**保留结构、不构建**） |
| `vendor/dsh-runtime/0.1.5-rc.1/` | **官方内核（265 个 tgz 包）—— 不改，保持原样** |
| `patches/` | **我方全部改动都走补丁**（现 21 个：18 社区自带 + 3 我方新增） |
| `deepseek-harness/` | **上游 submodule（当前为空，已决定暂不拉取）** —— 仅 `yarn check:layout` 第 7 步会用到它，不影响运行与打包 |
| `scripts/` | 仓库级校验脚本（`check:layout` 等用它） |

## 五、速查：常用命令的"从哪跑"

| 要做什么 | 在哪跑 |
|---|---|
| 跑任何 `yarn` 命令 | **`cd I:\dsh-913`**（或它的子包目录） |
| 打包（免安装） | `cd I:\dsh-913` → `yarn package:dir` → 产物 `dsh-plugin-desktop\dist\win-unpacked\` |
| 打包（NSIS 安装包） | `cd I:\dsh-913` → `yarn dist:win` → 产物 `dsh-plugin-desktop\dist\deepseekharness-<版本>-x64-Setup.exe` |
| 编辑源码 | 用 `I:\dsh-913` 或旧目录都行（搬迁后请统一用 `I:\dsh-913`） |
| 看清单/方案/记忆 | `I:\deepseekharness制作\.workbuddy\` |
| 只读对照社区原版 | `I:\deepseekharness9-13\9-13DSH-desktop最新更新一套` |

## 六、待清理清单（2026-09-15 全量盘点 · **只是清单，未删除**）

> 判定方式：只读扫描 + 体积统计 + grep 引用校验。合计可回收约 **5.9 GB**。
> ⚠️ 动手前需用户逐项确认；**工作副本 `I:\dsh-913` 内部的项目（如第 14 项）需另立方案**。
>
> 🔴 **2026-09-15 更正**：原第 11 项（`E:\app\deepseekharness`）**我判错了，已撤销** —— 它是**现行的 2.0.9 安装**，不是旧版本。见本节末尾「更正记录」。

| # | 路径 | 体积 | 为什么算过时 |
|---|---|---|---|
| 1 | `I:\dsh-desktop` | **2719.8 MB** | 2.0.4 时代工作副本，已被 `I:\dsh-913` 完全取代（它自己还带 `_deprecated/`） |
| 2 | `I:\deepseekharness9-13\9-13deepseekharness最新更新修改` | 1753.5 MB | 旧工作副本（中文路径，已搬迁）。用户曾说"暂不删，以后再议" |
| 3 | `I:\deepseekharness9-13\9-13deepseekharness更新打包` | 0 MB | **空目录**，当初计划的打包输出，实际未用 |
| 4 | `I:\deepseekharness制作\dist` | **779.8 MB** | 最早手搓原型（`deepseek-harness-desktop` v0.1.1 / dsh 0.1.1-rc.2）的安装包与 win-unpacked |
| 5 | `I:\deepseekharness制作\node_modules` | **612.1 MB** | 上述原型的依赖 |
| 6 | `I:\deepseekharness制作\` 下的原型文件 | ~1 MB | `main.js` / `package.json` / `package-lock.json` / `gen_ico.py` / `gen_icon.py` / `icon.*` / `.npmrc` / `.dsh-cost-meter-inject-test.js` / `.dsh-web*.log` / `.electron-*.log` |
| 7 | `I:\deepseekharness制作\{.bench, mkdirbench_tmp, _mkdirbench, _mkdirbench2, _mkdirverify, _verify}` | 0 MB（**约 1900 个空目录**） | 批量建目录压测残留 |
| 8 | `I:\deepseekharness制作\{.jt_link, deepseekharness重做}`、`.yarn-global` | ~0 | 空目录 / 1 个 telemetry.json |
| 9 | `I:\deepseekharness`（I 盘根目录） | 小 | 里面只有一个 `AI股票`，**疑似路径写错产生的野目录** —— 待确认 |
| 10 | `I:\deepseekharness9-13\_*`（48 个） | 341 KB | 我的探测临时文件 |
| ~~11~~ | ~~`E:\app\deepseekharness`~~ | 616.7 MB | ❌ **判错，已撤销** —— 这是**现行的 2.0.9 安装**，**绝不能删**，见下方「更正记录」 |
| 12 | `I:\dsh-913\vendor\agents-anywhere\...desktop.c63fc36855ba9...tgz` | 520 KB | **孤儿**：grep 全仓库零引用（现用 `c00df092` 那个） |
| 13 | `I:\dsh-913\deepseek-harness` | 0 | gitlink 处 `D` 状态、目录不存在，但 `.gitmodules` 仍写着 → **悬空，要么拉要么正式移除条目** |
| 14 | `I:\dsh-913\dsh-plugin-desktop-beta` | **626.3 MB**（node_modules 620.6） | beta 通道已停用（只构建 stable），但 root `build`/`check` 仍会构建它 → 最大可回收项，**需立项改脚本** |
| 15 | `I:\dsh-913\dsh-plugin-desktop\dist` | **710 MB** | 打包输出；win-unpacked 可再生（安装包已入更新源） |
| 16 | `.workbuddy\requirements.html` | 14 KB | **已被 `redolist.html` 全量并入**（"不再各自演进"）→ 过时副本 |
| 17 | `.workbuddy\ourdiff.txt` + 一批一次性产物 | ~2.5 MB | `item*-diff.txt`、`yarn_cpu*.txt`、各类 `.mjs` 探针、`rename-audit-full.txt`、`plugin-index.txt`、`update-report.html` 等 → 建议归入 `_archive\` |

**保留（非遗弃）**：`9-13DSH-desktop最新更新一套`（267 MB，只读参照）、`I:\deepseek-harness\`（113.4 MB，含 `.dsh` / `插件` / 其他项目）、`I:\deepseekharness更新DIY\`（129.2 MB，更新源）。

### 清理进度（2026-09-15）

| 批次 | 内容 | 状态 |
|---|---|---|
| **1** | 我的临时探测文件（61 个）+ 纯空目录（9 个，约 1883 个空子目录） | ✅ **已完成并复核**：目录剩余 0/9、文件剩余 0/61 |
| **2** | `.workbuddy` 里 42 个一次性产物 → 移动到 `_archive\` | ✅ **已完成**（`_archive\` 内 42 个文件，非破坏性） |
| **3** | 旧原型：`制作\dist` 780MB + `node_modules` 612MB + 散件（16 项） | ✅ **已完成**（16/16 成功） |
| **4** | `I:\dsh-desktop` 2.72GB + 旧工作副本 1.75GB | ✅ **已完成**（2/2 成功） |
| **5** | `dsh-plugin-desktop\dist` 710MB + 孤儿 tgz 0.5MB | ✅ **已完成**（2/2 成功） |
| **5-可选** | `dsh-plugin-desktop-beta\node_modules` 620MB | ✅ **已完成**（1/1 成功） |
| 收尾 | AI 本轮临时文件 5 个 | ✅ **已完成**（5/5 成功） |
| **6** | `I:\deepseekharness` 野目录 | ⏳ **只报告未删** —— 实测大小为 **0 MB**，内容只有一个空的 `AI股票` 目录；等用户确认 |
| — | `I:\dsh-913\deepseek-harness` 悬空 submodule 条目 | ⏳ **需另立项改仓库**（拉回来 or 移除 `.gitmodules` 条目） |

> 🟡 **重要：回收站里压着 7.03 GB（I 盘），这部分【尚未真正释放】。**
> 实测：`I:\` 可用 **484.7 GB**（清理前 9-14 22:00 为 487.8 GB —— 因为删掉的东西都进了回收站，
> 而同期打包/实装又产生了新文件）。**要真正拿回约 7 GB，需要清空回收站。**
> 建议：等确认几天没问题（或先确认不需要还原）再清空。
>
> 批 1 的完整文件清单见 `memory/2026-09-15.md`「清理 · 批 1」一节；
> 完整方案见 `.workbuddy/cleanup-plan.md`。
> 还原方式：回收站里选中该批次右键"还原"；批 2 直接把 `_archive\` 里的文件移回去即可。
>
> ⚠️ **连带影响**：`dsh-plugin-desktop-beta\node_modules` 被删 → 下次动手前**先跑一次 `yarn install`**
> （离线，从本地 Yarn 缓存 758 MB 恢复；只是多花几分钟），恢复 Yarn 的一致性状态。

## 七、更正记录（2026-09-15 09:5x）—— `E:\app\deepseekharness` 被我错列为"可删"

**用户质疑**：「这是我安装最新更新的，怎么变成过时、废除的？」→ **用户是对的，我错了。**

**实测证据（这次是硬证据，不是快照推断）**：

| 检查 | 结果 |
|---|---|
| `E:\app\deepseekharness\deepseekharness.exe` sha256 | `6F6ADE25942B15840DFB6DFD89B095F1E81C902284559D170C4CB9C2456BE202` → **与 `dist\win-unpacked` 里的完全一致** |
| `resources\app.asar` sha256 | `C0DDED53…` → **同样一致** |
| 文件版本信息 | `Product=deepseekharness`、`FileVersion=**2.0.9**`、`ProductVersion=2.0.9.0` |
| 注册表（HKLM + WOW6432Node + HKCU 全扫） | **只有一条**：`deepseekharness **2.0.9**`；**无 2.0.4 残留** |
| 目录 CreationTime | **2026-09-15 00:39:40** → 是**新装**的目录，不是旧装 |
| `data\` 内容 | `profiles\desktop`（00:40）、`settings.yaml`（**00:59**，已配置）、`sessions\`（1 文件）、`.credentials.yaml`、`storages\` → **已有真实使用数据** |

**我错在哪（根因）**：
00:21 读过一次注册表，当时是 `deepseekharness 2.0.4`，于是**推断**"旧版本装在 `E:\app\deepseekharness`"。
09:2x 做全量盘点时，**直接沿用了这条旧快照**，既没重读注册表、也没核对目录内容与版本信息 —— 而这期间用户已经卸载 2.0.4、装上了我们的 2.0.9。
→ 结果把**用户刚装好、且已带真实数据的现行安装**列进了"可删除"清单。

**教训（已写入项目记忆）**：
1. 判定"过时 / 可删"**必须现场取证**（sha256 / 版本信息 / CreationTime），**不得沿用上一轮快照结论**。
2. 凡"可删除清单"必须**逐项给实证依据**，并注明取证时间。
3. 注册表 / 进程 / 已装版本这类**会变化的状态**，每次交付前重新读一遍。

**连带影响（必须告知）**：
- 旧版本 2.0.4 **已经不存在** → 之前"先打包 → 确认新包能用 → 再卸载老的"的顺序**已无意义**（升级早已发生）。
- ✅ **好消息**：等于**清单第 11 步「实机验证」已经完成** —— 新包（未签名）**安装成功**（智能应用控制没有拦）、已运行、已配置（`settings.yaml` 写于 00:59）。
- ⚠️ **第 38 项（Profile 名改名）代价变了**：`data\profiles\desktop` 里**已有真实数据**，改名 = **需要数据迁移**，不再是我当时说的"零数据、最便宜"。用户是在"零数据"这个前提下决定"下次再改"的，**这个前提已经失效，需要重新确认**。
