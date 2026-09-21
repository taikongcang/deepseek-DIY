# 技术细节存档（从 MEMORY.md 移出）

> 2026-09-15 从 `memory/MEMORY.md` 移出的「已查实实现细节 / 环境事实 / 坑的详解」。
> MEMORY.md 只留规则与索引，**细节查这里**。

## 〇、官方（`deepseek-ai/deepseek-harness`）的实际做法 —— 2026-09-15 联网实证

### 用什么包管理器：**pnpm**（不是 yarn）
- 官方仓库**根目录**：**`pnpm-lock.yaml`** + **`pnpm-workspace.yaml`**（GitHub 网页实测）；`package.json` 当前 **`0.1.6-alpha.1`**（2026-09-15 提交）。
- 官方 README「Run from source」原文：
  ```sh
  git clone https://github.com/deepseek-ai/deepseek-harness.git
  cd deepseek-harness
  pnpm install
  pnpm run build
  pnpm dsh web
  ```
- 官方「Run from npm」：`npx @deepseek-ai/dsh web`（默认 `http://127.0.0.1:3080`）。
- 文档站：`https://deepseek-harness.github.io/deepseek-harness/`；仓库内有 `docs/development.md`、`docs/architecture.md`、`AGENTS.md`。

### ⚠️ 官方**根本没有桌面版**：无 Electron、无"打包成 exe"的任何说明
- 官方只提供两种形态：**npm 包**（`npx @deepseek-ai/dsh web`）与**从源码跑**。
- **Electron 桌面化（dsh-desktop）完全是社区自创**，官方文档里不存在这条路径。
- 因此官方也**不涉及** `ELECTRON_RUN_AS_NODE` —— 它用的是**真 node.exe**。

### 官方插件机制（第三方插件 README + 官方博客实测）
- **插件 = npm 包**，靠 `package.json` 的 **`dsh` 字段**声明：
  - `dsh.profile` → 列出一个 profile 有哪些 bundles
  - `dsh.bundle.patch` → 指向这个 bundle 的 patch 文件
- **装/卸都走官方 CLI**：`dsh plugin --profile <profile> add <pkg>` ／ `remove <pkg>`，**改完必须重启**。
- 环境要求（第三方插件明写）：**Node.js 22.19+（22.x）或 24+，且 `pnpm 10+`**。
- 插件发现：给仓库加 GitHub topic **`dsh-plugin`**。
- 官方"Everything is a plugin"基于 **Cordis**；插件向共享 context 贡献 services / typed events / **reversible effects**，卸载时注册自动回卷（无孤儿状态）。

### ⭐ 结论：两层包管理器，别混
| 层 | 用什么 | 谁定的 |
|---|---|---|
| **app 外壳的构建/打包** | **yarn 4**（`.yarnrc.yml` / `yarn.lock` / `yarn dist:win`） | **社区自己选的** |
| **Profile 里插件的装卸** | **pnpm**（打包进 app 的 pnpm，`pnpmShimPath`） | **跟随官方**（官方内核就是 pnpm） |

→ 用户问"怎么有些社区制作又是使用 pnpm"= **两层不矛盾**：壳用 yarn、插件层跟官方用 pnpm。
→ 但注意：**桌面版没走官方 CLI**（`dsh plugin …`），而是自己实现了 `desktopPnpm` 服务直调 pnpm（`pnpm.ts`）—— 因为桌面包里没有独立 node、也走不了官方 CLI 的启动路径。

### ⭐ "最稳最好的路线"= 回到官方的运行方式
- **官方**：真 `node.exe` + pnpm。
- **社区桌面版**：**Electron 冒充 node**（`ELECTRON_RUN_AS_NODE=1`）+ pnpm ← **问题就是从这个妥协来的**。
- 所以「源头修复」的本质 = **把社区为了塞进 Electron 而做的妥协去掉**。影响面不止卸载：**所有子进程**（终端 / native 构建 / 插件 CLI）。

### `locales.ts` 的 `en` 被测试当字符串源用（想"只留中文"必须先知道）
- `dsh-community-market/tests/market-settings-tab.spec.tsx:28` → `import { en, type MarketLocaleKey } from '../src/client/locales.js'`，且 `const t = (key) => en[key]` 作为全部 33 个用例的 t 函数。
- `tests/browser-plugin.spec.ts:6` → `import { en, zh }`，并分别注册 zh / en 两套字典。
- → **删 `en` 会直接砸掉这些测试**；"en 直接复用 zh"（`export const en = zh`）也要改断言英文字符串的地方。

### ⚠️ 对照实验结论（2026-09-15 实测，脚本 = `_probe/pnpm-runnode-compare.mjs` / `-compare2.mjs`）
**被检验的假设**："Electron 冒充 node 导致 pnpm 干完活不退出。"
**结果：❌ 未获支持 —— 单层已排除。**

- 实验**精确复刻了生产调用链**：照抄 `pnpm.cmd` 里的**每一个**环境变量（`ELECTRON_RUN_AS_NODE=1`、`NODE`、`npm_config_runtime/target/disturl`、PATH 前插 `private\node-bin`）、`--import clear-env.cjs`、`--config.minimumReleaseAge=0`；用**同一个 pnpm**（`I:\dsh-913\dsh-plugin-desktop\node_modules\pnpm`，v11.8.0，**已打我方补丁**）与**同一份配置**（`nodeLinker: hoisted` + `autoInstallPeers: false`）。
- **两轮共 12 次 remove，全部秒级干净退出**：

| 轮次 | A 组 Electron（冒充 node） | B 组 真 node.exe |
|---|---|---|
| v1（`file:` 本地依赖）×3 | 0.8 / 0.7 / 0.7 s，退出码全 0 | 0.6 / 0.7 / 0.7 s，退出码全 0 |
| v2（真实 registry 包 `is-number@7.0.0`，走 npmmirror）×3 | 0.6 / 0.8 / 0.8 s，退出码全 0 | 0.7 / 0.7 / 0.7 s，退出码全 0 |

（v2 的 `add` 也全部正常：0.7~1.3 s。）
- → **结论：「Electron 跑 pnpm」这一层本身是干净的，不是卡死的原因。**

**嫌疑重新排序**：

| 嫌疑 | 状态 | 依据 |
|---|---|---|
| Electron 冒充 node（单层） | ❌ **已排除** | 上述 12 次实验 |
| **`dsh-subprocess-local` 的 Windows runner 层** | ⭐ **头号嫌疑** | 真实链路是**两层**（Electron → runner → pnpm）；社区**专门在这里**打补丁强制 Electron 模式；项目记忆原话是"**worker 退出异常**"，"worker"多半就指这个 runner |
| 真实环境规模（profile 的 400+ 包 node_modules / store 交互 / 杀软扫描） | ⭐ 可能 | 实验里 node_modules 只有 1 个包 |
| 偶发（机器负载 / 文件锁 / 杀软） | 可能 | 12 次都没踩到 |

**关键推理（新的头号假设）**：runner 层用 **Windows Job Object** 管进程树 —— `dsh-subprocess-local/lib/index.js:493 launchWindowsJob()` 里 `spawn(command, [...prefix, '--', ...spec.argv])` 并持有 Job handle；`waitForExit()`（`:477`）= `await this.exited`，而 `exited` 只在 `child.once('close')` 且 **`exitCode === 0 && signal === null`** 时才 resolve。**若 Job 里残留句柄/子进程，runner 就会一直等下去** → 上层 `child.done` 永不 resolve → 界面永久卡住。
→ **这与"谁在跑 node"无关，换成真 node.exe 也未必解决。**

**残留进程查证**：2026-09-15 17:5x 用 `tasklist` 查 → **无任何 node / electron / deepseekharness 残留** → 14:36 那次卡死的进程已经消失，**拿不到活的现场**（PID 37924 / 27064 均已不在）。

### 📋 app 日志位置 + 启动时间线（2026-09-15 实测，**铁证**）
**日志在**：`<DSH_HOME>\desktop\logs\`（便携模式即 `E:\app\deepseekharness\data\desktop\logs\`）
- `dsh-<日期>.log` —— 每次启动写一行 `--- dsh-plugin-desktop deepseekharness <版本> <平台> node <版本> run <毫秒时间戳> ---`
- `dsh-<日期>.error.log` —— 错误；**市场侧 `logFailure` → `ctx.logger.error`（`dsh-community-market/src/index.ts:75`）就落这里**
- `host\dsh-<日期>.log` —— host 侧（含 agents-anywhere bridge stopped/listening 事件）

**app 内置 Node 版本 = v24.18.1**（Electron 43.3.0 自带；注意与系统 `E:\app\Node` 的 **v24.19.0** 不同）

**启动时间线（由日志时间戳实测还原）**：

| 时刻 | 结果 |
|---|---|
| 00:40:03 / 00:40:10 / 00:42:38 / 00:58:45 / 00:59:05 | 正常启动 |
| **14:26:19** | 手动重启，成功（health healthy） |
| **14:36** | 市场卸载 `@yolk_vat-y/dsh-project-memory` → **卡死**（pnpm 干完活不退）→ 留下**脏 bundles** |
| **15:15:29** | **启动失败** ❌ `PackageOverlayNotFoundError: cannot resolve package "@yolk_vat-y/dsh-project-memory"` |
| **15:15:45** | **启动失败** ❌ 同上（连续两次） |
| **17:15** | 手动修好 `bundles`（删掉那个包名） |
| **18:11:09** | **启动成功** ✅ |

→ **「下次启动会起不来」不是推测 —— 15:15 真实失败过两次**；N2 的修复在 **18:11 得到实测验证**。
→ **卸载卡死全程 error.log 里没有任何 pnpm 报错** —— 与「pnpm 不返回、`runPnpm` 从不抛错」（`packageManagerError` 从未被调用）完全一致。

### 🛠 实验 B 的工具（已就绪）
`C:\Users\50667\AppData\Local\Temp\dsh-probe\` 下：
- **`watch.cmd`** —— 双击即用（转调 watch.ps1）
- **`watch.ps1`** —— 每 0.8s 采样一次 `deepseekharness.exe` / `node.exe` / `cmd.exe`，记录 **START/EXIT 事件（含完整命令行）** 到 `events.txt`，每 ~4s 记一次 **存活快照（handles / threads / cpu / 是否 pnpm）** 到 `snapshots.txt`。跑 25 分钟。
- 用途：用户做一次"装插件 → 重启 → 卸载"，**若再卡住，它能当场指出是哪个 PID 拒绝退出**。
- ⚠️ 脚本**全 ASCII**（PS 5.1 会把无 BOM 的 UTF-8 当 ANSI 解析，含中文会拆坏）。

### 🎯 真实调用链（2026-09-15 实验 B 实测抓到，**铁证**）

用户在真实 app 里装了一个插件（`dsh-status-rotator@0.19.0`），探针抓到了**完整的进程树与命令行**：

```
Electron main            PID=38108  PPID=7880    "deepseekharness.exe"
 └─ NodeService utility  PID=31680  PPID=38108   --type=utility --utility-sub-type=node.mojom.NodeService
     └─ runner.js        PID=1672   PPID=31680   deepseekharness.exe …\@deepseek-ai\dsh-subprocess-local\lib\runner.js -- …
         └─ pnpm.mjs     PID=19764  PPID=1672    deepseekharness.exe --import …\clear-env.cjs …\pnpm\bin\pnpm.mjs …
```

**完整命令行原文**：
```
PID=1672  E:\app\deepseekharness\deepseekharness.exe
            E:\app\deepseekharness\resources\app.asar\node_modules\@deepseek-ai\dsh-subprocess-local\lib\runner.js
            --
            E:\app\deepseekharness\deepseekharness.exe --import file:///E:/app/…/private/clear-env.cjs
            E:\app\deepseekharness\resources\app.asar\node_modules\pnpm\bin\pnpm.mjs
            --config.minimumReleaseAge=0 add --save-exact
            --registry=https://registry.npmjs.org/ dsh-status-rotator@0.19.0

PID=19764  （同上，去掉 runner.js 与 "--" 前缀）
```

→ ✅ **确认是两层**（Electron → runner → pnpm），**与上一轮的推断完全一致**；`runner.js` 就是社区补丁强制设 `ELECTRON_RUN_AS_NODE=1` 的那一层。
→ ⚠️ **市场安装硬编码 `--registry=https://registry.npmjs.org/`**（不是 profile 的 npmmirror）。

**实测耗时（正常路径）**：`add` 全链路（runner + pnpm 一起）**2.65 秒**（18:16:26.851 → 18:16:29.503），与用户体感的 3~5 秒吻合。

**⚠️ 探针缺陷（如实记录，我的问题）**：探针用 0.8 秒轮询采样，**漏掉了 `remove` 进程** —— 因为 `pnpm remove`（无需下载）全生命周期只有 **0.5~0.8 秒**，短于采样间隔（而 `add` 要下载，2.65 秒，所以抓到了）。→ **下次要把采样压到 ≤0.2s，或改用 WMI 事件订阅。**
本次卸载确实执行且成功（profile 的 `bundles` 与 `node_modules` 里都已没有该包），只是**进程没被拍下来**。

### 🔥 新假设（本次实验得出，比"Electron 冒充 node"精确得多）
**对照两次卸载的条件差异**：

| | 14:36（**卡死**） | 18:16（**没卡**） |
|---|---|---|
| 被卸载的包 | `@yolk_vat-y/dsh-project-memory@0.5.4` | `dsh-status-rotator@0.19.0` |
| 依赖特征 | **带原生依赖**：其扁平依赖里有 **`@napi-rs`**、`pdfjs-dist` | 看起来是纯 JS 包 |
| 结果 | pnpm 干完活**不退**（8 分钟以上） | 秒级干净退出 |

**旁证（要紧）**：现在 profile 的 `node_modules` 里还留着 **`@napi-rs` 与 `@yolk_vat-y` 两个空壳目录**（mtime 都是 **14:36**）—— 说明那次卸载时 **pnpm 的收尾清理（prune）根本没完成**。

→ **假设：卡死发生在"卸载带原生依赖（如 `@napi-rs`）的包"时，pnpm 收尾阶段不退出。** 纯 JS 小包则正常秒退。
→ 这个假设**可以直接实验**：在对照实验里把被测包换成 `@napi-rs/*` 或那个原包，重跑两组对比。

### ⭐⭐ 决定性结论（2026-09-15 v5b 实验，**推翻"Electron 是源头"**）

**实验设计**：两组各用 `--config.store-dir=<独立新目录>` 强制全新 store（保证完整下载 + 完整安装 + 完整收尾），被测包 = `@yolk_vat-y/dsh-project-memory@0.5.4`（**就是 14:36 卡死的那一个**）。

| 组 | add | **remove** |
|---|---|---|
| **Electron 冒充 node** | 143.4 s（全新下载） | 自报 `Done in 419ms` → **进程 90 s 不退（卡死）** |
| **真 node.exe** | 14.5 s | 自报 `Done in 357ms` → **进程 90 s 不退（卡死）** |

→ ⭐ **两组都卡死！换成真 node.exe 完全不能解决。**

**结论（铁证）**：
> `pnpm remove` 在 Windows 上卸载**带 `@napi-rs` 原生依赖**的包时，pnpm **干完活（自报 Done in ~400ms）但进程不退出** —— 这是 **pnpm 11.8.0 自身的问题**，**与"Electron 冒充 node"无关**。

**触发条件的实测归纳**：

| 场景 | add 耗时 | remove 结果 |
|---|---|---|
| v3 第 1 轮（store 冷、完整下载） | 65.8 s | **卡死** |
| v3 第 2 轮（store 热） | 2.0 s | 0.9 s 正常 |
| v4 node 组（store 热） | 2.1 s | 0.8 s 正常 |
| v5 两组（`.npmrc` 的 store-dir 未生效，热） | 1.8 / 1.9 s | 0.8 s 正常 |
| **v5b Electron（全新 store）** | **143.4 s** | **卡死** |
| **v5b node（部分缓存）** | **14.5 s** | **卡死** |

→ 关键变量 = **node_modules 里是否落有完整的 `@napi-rs` 原生文件**（只有"完整下载 + 完整安装"才会出现）。
→ 附注：**pnpm 11 不认 `.npmrc` 里的 `store-dir`**（实测 `pnpm store path` 仍指向默认 store），必须用 **CLI `--config.store-dir=<abs>`**。

**⚠️ 修正前两轮的两个判断**：
1. 我曾说"残留 `@napi-rs` / `@yolk_vat-y` 空壳目录 = 收尾 prune 没做完的证据" —— **不成立**。v4 的 node 组**正常卸载也留下同样空壳**，那是 pnpm `hoisted` 模式的正常表现。
2. 我曾说"Electron 单层已排除" —— 方向对但**理由不完整**。真正排除它的是 **v5b 的同条件双卡**；v1/v2 那 12 次之所以没复现，是因为测的包**都不带原生依赖**，压根碰不到触发条件。

**⭐ 对"源头修复"路线的颠覆**：
- ❌ **往安装包里塞真 node.exe（+80~110 MB）解决不了这个问题** → **不必做了**。
- ✅ **正确方向：改 pnpm**。pnpm 是第三方包、**我们有 `patches/pnpm@11.8.0.patch` 补丁机制** → 找出它 remove 后不退出的原因（很可能是 worker 线程池 / native handle 未释放）并修，成本远低于换运行时。
- ✅ 兜底照旧：**已实现的「超时 + 对账」仍是正确且必要的工程防御**（与根因修没修无关）。

### ✅✅ 方案 B 成功：升级 pnpm 即可修复（2026-09-15 v7 同条件对照，**定案**）

**严格同条件对照**（真 node 执行 + `--config.store-dir=` 全新 store + 完整下载安装）：

| pnpm 版本 | add | **remove** |
|---|---|---|
| **11.8.0**（我们打进 app 的） | 17.5 s | 自报 `Done in 422ms` → **90 s 不退（卡死）** ❌ |
| **11.27.0**（11.x 线最新） | 23.6 s | 自报 `Done in 317ms` → **0.5 s 干净退出** ✅ |

→ ⭐ **上游在 11.8.0 → 11.27.0 之间修掉了这个 bug。**
→ **不需要给 pnpm 打补丁、不需要塞 node.exe、不需要改我们自己的代码。**

**⚠️ pnpm 12.4.2 不可简单替换**：它已改为 **native binary**（Rust）架构，tarball 解压后缺 `pnpm-native.exe`（由 `install.js` 下载）→ 实测直接报 `Could not run the pnpm binary at …\pnpm-native.exe`。**且跨大版本、风险高 → 不升 12。**

**推荐路径：pnpm 11.8.0 → 11.27.0**（同大版本，只修 bug）。落地三件事：
1. `dsh-plugin-desktop/package.json` 的 pnpm 依赖版本 → **11.27.0**
2. **`patches/pnpm@11.8.0.patch` 必须重新评估**：它是社区补丁、改的是 `minimumReleaseAge` 相关逻辑 —— 要么**上游已修可删**，要么**重写到 11.27.0**（否则 `yarn install` 会因补丁不匹配而失败）
3. 全量验证：market 测试 + `dist:win` 打包 + **真机实测卸载一个带原生依赖的包**

### ✅ 已落地（2026-09-15 19:0x，用户选"方案 B"）

1. **新增 `patches/pnpm@11.27.0.patch`**：旧补丁对 11.27.0 **实测打不上**（`patch failed: dist/pnpm.mjs:64264`）→ 按同一组 **5 处改动词**重写（脚本 = `_probe/make-pnpm-patch.mjs`，每处断言"恰好命中 1 次"）→ `git apply --check` **OK**；应用后 3 项复核全对（`Number.isFinite(minimumReleaseAge)`=1、`configuredMinimumReleaseAge`=2、旧声明=0）。
2. `dsh-plugin-desktop/package.json`：`"pnpm": "11.8.0"` → **`"11.27.0"`**
3. 根 `package.json` 的 `resolutions`：**`"pnpm@npm:11.27.0": "patch:pnpm@npm%3A11.27.0#./patches/pnpm@11.27.0.patch"`**
4. `yarn install`（**联网**，`YARN_NPM_REGISTRY_SERVER=https://registry.npmmirror.com`）→ **成功**（`2 packages added (+39.25 MiB)`）；`yarn.lock` 出现 `pnpm@npm:11.27.0`；`node_modules/pnpm` = **11.27.0** 且补丁已应用。
   - ⚠️ YN0008 提示 4 个 native 包（`fs-ext` / `koffi` / `node-pty` / `dsh-subprocess-local`）需 rebuild —— **预期行为**（`.yarnrc.yml` 设了 `enableScripts: false`，打包前由 `yarn prepare:electron-native` 单独构建）。
5. **验证**：market 测试 **266 passed / 22 files**；market 的 3 个 tsconfig（main / client / tests）**全 exit 0**。
6. **闭环实测**：用**仓库里升级后的 pnpm** 跑同一个复现用例（真 node + 全新 store + 完整安装）→ `add 16.6s` → **`remove 0.6s`，退出码 0** —— **不再卡死** ✅

**故意推迟**：打包 + 真机实测 → 合并到清单 **N90「最后一次性打包」**。
**遗留**：旧补丁 `patches/pnpm@11.8.0.patch` **暂留未删**（已不被引用，待用户确认清理）。

## 一、更新源实现（B 方案：本地源，2026-09-14 定稿并实现）
- 我们的"新版本"只能自己产出（社区版发的包永远是原版，装上去会覆盖定制）。
- **直读本地文件**（`file://`，不开服务器、不轮询）—— Electron `net.fetch` 实测支持 `file://`（含中文路径）。
- 客户端硬编码：`update-checker.ts` 的 `DESKTOP_UPDATE_SOURCE_DIRECTORY = 'I:\\deepseekharness更新DIY\\发布'`；`update-download.ts` 按"平台+版本"动态拼 `desktopUpdateDownloadUrl()`。
- **发布契约**：`发布\version.json`（单行 `{"version":"x.y.z"}`，stable 必须纯版本号，带 `-beta.1` 会被拒收，上限 4KB）+ `发布\deepseekharness-<版本>-x64-Setup.exe`（与 `nsis.artifactName` 一致 → 打包产物直接拷入、不用改名）。
- 后台自动轮询已关（`cordis.patch.yml` 给 `desktop-updates` 加 `config.enabled=false`），手动点"检查更新"照常可用；更新检查只在打包版生效。
- 文件不存在时抛 `ERR_FILE_NOT_FOUND` 被吞 → 界面无任何提示（"点了没反应" = 路径或文件名不对）。

## 二、追官方的脚本链（根 `package.json` scripts）
- `upstream.json` = 更新官方核心的总开关（锁 `repository` / `commit` / `sourceVersion`）。
- `yarn upstream:prepare-runtime` = 进 `deepseek-harness` submodule 里 `install` + `build:official`（`DSH_BUILD_CLIENT_PROFILE=official`）+ `release:pack --family dsh` → 产出 `dist/npm/publish-order.txt` + 全部 tgz。
- `node scripts/sync-vendored-runtime.mjs --write` = 把新 tgz 拷进 `vendor/dsh-runtime/<新版本>/`，并同步 `manifest.json` / `upstream.json` / workspace `resolutions` / 各子包依赖版本。
- `yarn check:vendored-runtime` = 校验 vendor 完整性（sha256）。
- **构建/打包命令**（一律从 `I:\dsh-913` 跑）：`yarn build`、`yarn dist:win`（NSIS 安装包）、`yarn dist:win-portable`、`yarn check`。
  - `yarn dist:win` 内部先跑 `check:win-package` preflight（market build + desktop build + typecheck + 14 个测试文件 + `verify:closure`）；挂了不会开始打包。确认代码没再改可用 `$env:DSH_PACKAGE_CHECK_ALREADY_RAN=1` 跳过。
  - `yarn package:dir` 带 `--config.electronDist=<本地 node_modules\electron\dist>` → 不下载 Electron；但**在 Windows 上必失败（上游缺陷）**，见坑 13。
- **打包第一步 `yarn aa:prepare-release` 会动仓库**：默认 `DSH_AA_SOURCE_REF=main` → 解析上游 Agents-Anywhere@main 最新 commit、重新构建 tgz、改写 `vendor/agents-anywhere/<新tgz>` + `provenance.json`，并把两个 `dsh-plugin-desktop*/package.json` 的依赖重指到新 tgz，最后 `yarn install --mode=skip-build`（连带改 `yarn.lock` + node_modules）；中途失败会回滚。
  → **固定做法：`$env:DSH_AA_SOURCE_REF = "pinned"`** → 只做 sha256 校验，零改动、零联网。当前 pin：commit `00df092c98b271098cba18b4f96d91f5008c2cd4`、artifact `agents-anywhere-dsh-bridge-next-0.1.0-dev.0.desktop.c00df092c98b2.rcda81994.tgz`。
  → 打包前置条件与四类拦截对策见 `.workbuddy/run-package-guide.md`。
- `yarn check` 用 `&&` 串联 11 步，前面失败后面不跑 → 要"完整红名单"必须逐条分开跑。
- **追官方必踩的坑**：`patches/` 里针对官方包的补丁把版本号写死在文件名里，官方出新版后大概率 `apply` 失败，需逐个读新源码重写。

## 三、环境事实
- 用户 node **v24.19.0**（`E:\app\Node`，PATH 已加）；pnpm 11.24.0（`E:\app\Node\node_global`）；WorkBuddy managed node **v22.22.2** 在 C 盘，**两套勿混**。
- `DSH_HOME` = `I:\deepseek-harness\.dsh`（HKCU\Environment 永久）；但打包版便携模式下 `DSH_HOME = <安装目录>\data`（当前 `E:\app\deepseekharness\data`）。
- 国内 npm 一律 npmmirror；两个 electron 镜像变量都要设、别混：`ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`、`ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/`。
- 项目 `.yarnrc.yml` 设了 `enableScripts: false` → 所有包 postinstall 都不跑：electron 二进制不会自动下载（需手动 `node node_modules/electron/install.js`）、原生模块（fs-ext/koffi/node-pty/dsh-subprocess-local）不构建（打包前由 `yarn prepare:electron-native` 单独构建）。
- **离线安装硬开关**：`$env:YARN_ENABLE_NETWORK = "false"` → `yarn install`；设后任何联网需求直接报错。默认 `npmRegistryServer` = `registry.yarnpkg.com`（离线用不到；要联网再设 `YARN_NPM_REGISTRY_SERVER=https://registry.npmmirror.com`）。
- node-gyp 编译用 Marvis 的 Python 3.11.8：`E:\app\Marvis\MarvisAgent\1.0.1100.522\runtime\python311\python.exe`。
- 官方只支持 `dsh` CLI + profile 启动（web / headless / sdk / sdk-minimal / acp）；官方文档**无任何** Electron/桌面版/嵌入教程 → dsh-desktop 的深度集成是社区自读源码摸索的。
- **GitHub 私有仓**：WorkBuddy 的 github connector 实为 GitHub Copilot MCP（作用域写死"仅当前仓库只读"）→ 读私有仓一律 404。要用 ① 本机 git 命令行（凭据管理器 `git:https://github.com` → taikongcang，完整权限，已实测可 push）② 或注入带 repo 权限的 PAT。

## 四、插件 / 市场 实现细节（2026-09-15 实测源码+磁盘）
- **插件装在哪**：`<DSH_HOME>\profiles\<profile>\node_modules\<包>`（便携模式当前 = `E:\app\deepseekharness\data\profiles\desktop\`）。`desktopPnpm.run()` 的 cwd 就是活动 profile 目录（`src/pnpm.ts:163`），命令 `pnpm add <pkg>@<精确semver>`，随后把包写进 profile `package.json` 的 `dsh.profile.bundles`；卸载 = `pnpm remove` + 从 bundles 删除。
- profile 的 pnpm 配置：`nodeLinker: hoisted`、全局 store `E:\.pnpm-store\v11`、registry `registry.npmmirror.com`。
- ⚠️ **市场 UI 只能装 npm 上的包**（安装前查 `registry.npmjs.org/<pkg>/latest`，且强制 `add <pkg>@<精确semver>`，`src/pnpm.ts:95-115`）→ 本地 tgz / `file:` 路径不能走市场 UI，只能走 CLI。
- **卸载按钮的闸门**：按钮仅当 `installation.action === 'uninstall'`（`MarketSettingsTab.tsx:1462`）← `bundle.uninstallable`（`host/routes.ts:525`）← `mutable && profile清单.dependencies 里有它`（`desktop-plugins.ts:435`）← `mutable` = 不在 `IMMUTABLE_BUNDLES`（`desktop-plugins.ts:42-47`）= {`@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-web-app`、`@deepseek-ai/dsh-desktop-app`、`dsh-plugin-desktop`、`dsh-plugin-desktop-beta`、`dsh-community-market`}。→ **自己装的第三方插件本来就有卸载按钮**；`dsh-base`/`dsh-web-app` 只读是上游故意设的闸（卸载会让 `profile.ts:904-906` 抛错、只能进恢复助手）。
- **「手机连接」(Agents-Anywhere) 是 Desktop 强制注入的集成，不是普通插件**：`profile.ts:527` 在开关打开时强制把 `@agents-anywhere/dsh-bridge-next` 塞进 bundle 列表（profile 清单里没有它）；关闭时剔除（`517-522`、`753-757`，注释「用户层不能绕过 Desktop 的选择」）。包从 app 自己的 node_modules 解析（`vendor/agents-anywhere` + `aa:prepare-release`）。Desktop 另注入 config `dshHome`/`connectorSourceDir`（`970-977`），但 AA 自身有默认值，且便携模式已设 `DSH_HOME` → 注入非必需。**AA 不在 npm 上（两个 registry 都 404）**，只能本地 tgz 分发。三方案见 `.workbuddy/plugin-extraction-and-uninstall.md`。
  - ⚠️ **口径更正**：这套注入逻辑**写在我们自己的 `dsh-plugin-desktop` 源码里**，所以**改得动**（直接改源码，不需补丁）。"不能当普通插件"不准确 —— 准确说法是：要把它变成普通插件必须改我们自己这几处代码，并承担"每次追社区版都要重做这层减法"的维护成本。
- **市场"立即重启"报错**（「无法请求重启…请稍后手动重启」，上游设计，非我方 bug）：市场侧一次性重启令牌失效 —— `randomBytes(32).toString('base64url')`、只存内存（`install/service.ts` 的 `restartIntents` Map）、TTL 5 分钟（`:28`）、宿主 generation 被回收时 `dispose()` 会 `clear()`（`:741-748`）；点两次必报错（第一次已消费）。决定性判据：令牌被消费后市场是**先回 200 再**调桌面重启（`routes.ts:1149-1156`），所以**界面出现红字 = 令牌那步就抛了、请求压根没到桌面**。对插件安装零影响。硬化 = 直接改 `dsh-community-market` 源码（延长 TTL / 失败降级为提示）。

## 五、坑的详解（编号与 MEMORY.md「坑」对应）
1. **含中文路径 + 执行 yarn script 里的 bin = 路径被破坏 → 工作副本必须纯 ASCII**（2026-09-14 已搬到 `I:\dsh-913`）。
   - 现象：`Cannot find module 'I:\...<乱码>\node_modules\...\run.mjs'`（`\` 被吞、`requireStack: []`）。
   - **实测边界**：`node xx.js`、`yarn <bin名>`、`yarn workspace <pkg> <bin名>`、`.\node_modules\.bin\<bin>` 全都 ✅；但凡脚本内部有**嵌套 `yarn run`** 的（market 的 `check → yarn run build → yarn run generate:types → tsdown`）一律 ❌。desktop 的 `build`/`typecheck`/`test` 没有嵌套 → 全部 ✅。
   - junction 别名（`mklink /J`）只能骗过外层，对嵌套 yarn 无效 → 已被真实 ASCII 目录取代。
   - 看日志经验：PowerShell 把 Node 的 UTF-8 输出按 GBK 读会显示乱码，那种情况程序其实是正常的 → 只以"命令是否真的失败"为准。
2. **WorkBuddy 沙箱会重置子进程 PATH**：exec 时把 `shim/safe-bin` 前置、并丢弃进程内对 PATH 的修改 → Git for Windows 的 sh 子命令（`git-submodule` 等）找不到 `git-sh-setup` 而失败（`ls-remote`/`config`/`clone` 是 C 程序，不受影响）。绕不过，交用户手动跑。
3. 沙箱内 **PowerShell 工具的 stdout 不回传** → 必须写文件再用 Read 读；PS 脚本文件不能含中文（Write 产出无 BOM UTF-8，被 PS 5.1 按 ANSI 解析会拆坏路径）。
4. **Yarn 4 搬家后**软链接断 + `install-state.gz` 挡重建 → 删 `node_modules` + `.yarn/install-state.gz` 重 install。
5. 沙箱跑 Electron EXE：先清 `ELECTRON_RUN_AS_NODE` / `NODE_OPTIONS`；别用 run_in_background（2 分钟杀）。
6. 沙箱 shim 会留**空壳 node_modules 目录**挡 dsh heal → `rmdir` 删空壳。
7. electron-builder 证书墙（unable to verify first certificate）→ 设 `ELECTRON_BUILDER_BINARIES_MIRROR` 走镜像。
8. **Windows Defender** 拦 NSIS 卸载器生成（`⨯ spawn UNKNOWN` + 弹窗"阻挡"）→ 给项目目录（至少 dist）加 Defender 排除项再打包。
9. **SAC 智能应用控制**拦未签名 exe：与 Defender 是两套独立机制、Defender 排除项对它无效；弹窗无"仍要运行"。我们自打包必 unsigned（打包脚本主动删签名密钥 + `signExecutable=false`）。SAC 三态 0关/1强制/2评估。→ 只能关 SAC 或买代码签名证书。
   - ⭐ **2026-09-21 实测复发 + 完整诊断（本机）**：
     - **现象**：双击 `E:\app\deepseekharness\deepseekharness.exe` → 弹「智能应用控制已阻止可能不安全的应用」（无法验证发布者）。
     - **当前状态**：注册表 `HKLM\SYSTEM\CurrentControlSet\Control\CI\Policy\VerifiedAndReputablePolicyState` = **1（强制）**；另有 `SAC_PreviousState = 0`、`SAC_EnforcementReason = 3`、`VerifiedAndReputableIgnoreAutoOptOut = 1`（**后三个值的官方含义我查不到，不解读**）。
     - **exe 本身**：`Get-AuthenticodeSignature` = **NotSigned**；`LastWriteTime` = **2026/9/15 0:28:10**（**从 9/15 至今没变过**）→ **不是我们改了文件**。
     - **拦截时间线（CodeIntegrity 日志，事件 ID 3033 / 3077 / 3118）**：**首次拦截 = 2026-09-21 20:57:51**（`explorer.exe` 加载它）→ 20:57:52 / 20:58:08 / 20:59:00 / 20:59:12-13 / 21:00:40 反复拦。**此前 19 天（日志自 9/02 起 693 条）从未拦过它。**
     - **同窗口的伴生事件**：20:47:43 Defender 平台更新后重启（平台版 `4.18.26080.4`）→ 20:48–20:50 BITS 启停 → 20:58:18 下载/20:58:23 装好 Defender 病毒库 `KB2267602`（1.459.311.0 → 1.459.318.0）→ 20:58:23 Defender `CoreService\WdConfigHash` 变了 → **20:58:35 三项开关 1→0**（`HybridModeEnabled` / `SmartLockerMode` / `VerifiedAndReputableTrustModeEnabled`）→ 20:58:53 **代码完整性策略刷新并激活**（`{0283ac0f-…} VerifiedAndReputableDesktop` + `{1678656c-…} VerifiedAndReputableDesktopFlightSupplemental`）→ **20:58:54 同三项 0→1**。
     - **拦截用的策略 ID = `{0283ac0f-fff1-49ae-ada1-8a933130cad6}` = `VerifiedAndReputableDesktop`，就是 SAC 自己的策略。**
     - **本机没有组策略/MDM 在强制 SAC**：`HKLM\SOFTWARE\Microsoft\PolicyManager\current\device\SmartAppControl`、`HKLM\SOFTWARE\Policies\Microsoft\Windows\SmartAppControl`、`HKLM\...\CurrentVersion\Policies\SmartAppControl` **全部不存在**。诊断数据 `AllowTelemetry = 3`（满足 SAC 前提）。
     - ⚠️ **"为什么 19 天不拦、今天开始拦"—— 我没有权威依据，不编。** 与证据一致的最可能解释（**属推断，非实证**）：SAC 原本处于**关闭/非强制**态（`SAC_PreviousState = 0` 支持这一点），今天 Defender 平台更新触发信任模式重评估后转为**强制**；官方 FAQ 也写明「**近期的 Windows 更新允许启用/重新启用智能应用控制，且不需全新安装**」。**精确机制未能证实。**
   - **官方规则（2026-09-21 查 microsoft.com 支持文档 + FAQ，原文要点）**：
     - 「**目前沒有辦法繞過單一應用程式的智慧應用程式控制保護**」→ **SAC 没有白名单/排除项，不能只放行某一个 exe**。
     - 只有两条路：**关闭 SAC**，或**让开发者用「有效签名」签名**（`有效簽章` = 受信任根计划里的 CA 签发；自签名不算）。
     - **关闭 SAC 后通常无法再开回来**（需重置/重装）；但官方同时写明**近期更新已允许重新启用、无需全新安装** —— **这条我没在本机验证过，标为「待验证」**。
     - SAC 靠"**预测模型信任 且/或 有有效签名**"放行；被判"无法可靠预测"的未签名程序会被拦。
     - SAC 三种模式：评估（不拦，仅学习）/ 开（拦）/ 关；**一旦离开评估态，除非重装/重置否则回不去**。
   - 🔴 **严禁手动改注册表 `VerifiedAndReputablePolicyState` 来"关掉"它**：Microsoft Learn 问答里有用户这么干（改成 0 后重启），结果 **SAC 反而开始拦几乎所有程序（PowerShell、regedit、Chrome、VS Code 全被拦）**，官方给的补救是「重置此电脑（保留文件）」。**这条路不能走。**
   - **可行的处理路径（按代价排序，待用户拍板）**：
     - **A 关闭 SAC**：设置 → 隐私和安全性 → Windows 安全中心 → 应用和浏览器控制 → 智能应用控制设置 → 关闭。**代价：通常不可逆**（官方说有新更新可重开，未验证）。**本机无策略强制，UI 开关应当可用。**
     - **B 买受信任 CA 的代码签名证书，给 exe 签名**：保留 SAC 的安全收益；代价 = 花钱 + 打包流程要加签名步骤（我们现在的打包脚本是**主动删密钥、`signExecutable=false`**，要改）。
     - **C 换 Windows 企业版/教育版**：SAC 在这些版本不可用 —— 动作太大，不现实。
     - **D 提交微软审核**：弹窗那句"Microsoft 将审核该应用"—— 不可控、无时间表，不作为方案。
   - ⚠️ **产品级含义（重要）**：**我们自打包的 exe 永远 unsigned ⇒ 在任何开启 SAC 的机器上都会被拦。** 这不是本机偶发问题，而是**发布路径上的已知阻断点**，追"官方内核 / 社区"时也要留意上游是怎么处理的。
10. **改双语文档必须同步 i18n 哈希**：改 `X.md` / `X.zh.md` 就要更新同目录 `X.i18n.yaml` 里记录的 40 位 git blob 哈希（用 `git hash-object --path=`，没有自动重算命令）；全仓库有 51 个 `*.i18n.yaml`。
11. 改 `cordis.patch.yml` 里**按 id 定位的 patch 是整体替换、不做深度合并** → 必须重述该条目所有字段，否则静默丢字段。
12. **打包前置**：Electron 二进制必须已装（`dsh-plugin-desktop\node_modules\electron`，v43.3.0，215MB）—— Windows 上每次 vitest 都跑 `prepare-test-electron.mjs`，缺它连 `yarn test` 都起不来；electron-builder 的 NSIS 工具链已缓存于 `%LOCALAPPDATA%\electron-builder\Cache`。
13. **`yarn package:dir` 在 Windows 上必失败 —— 上游缺陷**：报 `cannot determine requested Electron architecture(s) for win`（抛在 `verify-electron-fuses.ts:224`，由 `afterAllArtifactBuild` 钩子调用）。
    - 根因：该脚本的 `--dir` 兜底要求 `platformToTargets` 里有 `'dir'` 键，但 `app-builder-lib/out/winPackager.js:64-67` 对 `DIR_TARGET` 直接 `continue` → 兜底永不触发。
    - 归属：`verify-electron-fuses.ts` 我方零改动、electron-builder 原版 26.15.7 → 纯上游问题。**改用 `yarn dist:win`**。
    - 报错发生在打包**后**钩子，所以 app 目录其实已完整生成（`win-unpacked` 360 文件 + `resources\app.asar`），可先双击试跑。
14. **沙箱「safe-delete」假报错但真删除**：用 `Remove-Item` 删 `I:\` 下自建临时文件时报 `SAFE_DELETE_FAIL_CLOSED {"reason":"trash-failed","detail":"OK <path>"}` —— 看着像失败但文件实际已删。→ 判定"删没删"只认 `Test-Path` 复核。
15. **判断"二进制包是否真的改过"，不能看 sha256 或 git blob SHA**：`vendor/dsh-runtime` 的 `manifest.json` 里 265 个包在两个内核版本间 sha256 全都不同（每个包内 `package.json` 的版本串都变了）。正确判据：解包后逐文件比对（忽略版本行），或看体积 delta 是否超出 ±1~7 字节的版本串噪声。
16. **打包前设 `$env:DSH_AA_SOURCE_REF = "pinned"`**，否则会去 GitHub 解析 Agents-Anywhere main 并改写仓库（见「二」）。
17. **`yarn check:layout` 跑不通（预期）**：它读 `deepseek-harness/package.json` 并校验 submodule 检出，而我们已决定不拉 submodule。其余子命令可单独跑。
18. **`scripts/bilingual-docs.mjs` 用 `git ls-files` 找文件**（不是扫文件系统）→ 删目录后必须 `git add -A -- <路径>` 把删除登记进索引，否则报 `ENOENT`。

## 六、UI 归属
- 速查表 = `.workbuddy/ui-attribution.md`：哪个 UI 出自哪个包/文件、旧版 2.0.4 vs 新版 2.0.9 差异、我方是否改过。遇"这块 UI 是谁的 / 以前是不是这样 / 是不是这次新增"先翻它。
- ⚠️ **两套 UI 机制别混**：标题栏三个图标（终端/重启/开发者）的悬停提示 = HTML 原生 `title`（系统 tooltip）；模式徽章的悬停卡片 = 应用自绘 HoverCard。**不是版本差异**：`DesktopNativeActions.tsx` 在 v2.0.4→v2.0.9 字节相同、我方零改动；变的只是文案。
- 对照旧版一律走 GitHub（用户 2026-09-15 定）：用社区仓库 tag/commit 历史与官方内核。**不再把回收站当资料来源**。示例：`git show v2.0.4:dsh-plugin-desktop/src/client/desktop-settings-locales.ts`；本地 clone 的 origin 带 `ghfast.top` 镜像前缀，`git fetch --tags origin` 实测可拉新 tag。

## 七、UI / 功能溯源（2026-09-16 取证，用户答疑用）

> 方法：读 `node_modules/@deepseek-ai/*` 源码 + 文案键 + 官方 GitHub（`deepseek-ai/deepseek-harness`）+ 实包版本对比。**每条都有出处，无推断的地方已标注。**

### 1. 「系统提示词」面板 = 官方**轨迹(Trajectory)视图**的一个标签页
- 包：`@deepseek-ai/dsh-client-ui-trajectory`，键 `tab.systemPrompt` = 「系统提示词」。
- 同视图其他标签：概述 / 原始输出 / 预览 / 原文 / 来源 / 参数 / 结果 / Schema / 计时 / 差异 / **系统提示词** / 工具 / 选项 / 用量。
- ⚠️ **不是新增功能**（与用户直觉相反，已实测）：社区提交 `588bef5dec`（2026-08-28）引入该包，`git merge-base --is-ancestor 588bef5dec v2.0.4` **判定已包含**；再从 npmmirror 下 `0.1.2-alpha.2`（旧线）与 `0.1.5-rc.1`（现装）解包比对，**两者 `tab.*` 列表完全一致**。
- ⚠️ **未验**："入口按钮位置有没有变"没验（需 2.0.4 实机）。

### 2. 系统提示词是**4 个官方包**拼出来的（想中文化得动 4 处）
| 截图段落 | 来源 |
|---|---|
| `You are an AI agent powered by DeepSeek Harness.` | `dsh-system-prompt`（`lib/index.js:216` 默认段落） |
| `You are a coding agent powered by the {{model}} model.` + `Your working directory is {{cwd}}.` | `dsh-agent-presets` 的 preset **persona 行**（`presets/standard/agent.cordis.yml:24-29`；整文件 255 行/12.9 KB，`cordis` 266 行/14.0 KB） |
| `Tokens prefixed with @ are workspace paths…` | `dsh-file-reference` |
| `Non-zero exits are reported as '[exit code: N]'…` | `dsh-tool-bash` / `dsh-tool-pwsh` |
- **⛔ 用户 2026-09-16 00:44 决定：不改（放弃）**。理由：要全中文化得给 4 个官方包叠补丁，且改系统提示词**可能影响模型表现**。
- 📌 留档的"低成本改法"（将来若要）：用**用户补丁层**覆盖 persona 行 —— `$DSH_HOME/profiles/<名>/cordis.patch.yml`（单 profile）或 `$DSH_HOME/cordis.patch.yml`（全 profile）。⚠️ 按 id 的 patch 是**整体替换**，必须重述该行所有字段（见坑 11）。

### 3. 输入框 `@` = **引用机制**（工作区文件 / 会话）
- 文案：placeholder「发消息或创建任务, / 调用指令, **@ 文件或对话**」；另有 `message.referenceSummary` = 「引用会话 · {labels}」。
- 实现：`dsh-client-ui-input-trigger` 是 `/` 与 `@` 的**通用触发器框架**；具体来源由 `dsh-client-ui-reference`（`trigger: "@"`）与 `dsh-client-ui-commands`（`/`）等注册。三者在 `dsh-web-app/cordis.patch.yml:286-301` **均已挂载**。
- `dsh-client-ui-reference` 的 `inject` = `["inputTriggers","locale","sessions","remote","remote.fileReferences","remote.sessionReferenceResolver"]`；候选由 `remote.fileReferences.list(sessionId, query)` + `sessionReferenceResolver.candidates(...)` 提供（后者**仅在未加引号时**查：`quoted === true ? [] : …`）。
- ⚠️ **两个"没反应"的原因（2026-09-16 查到）**：
  1. **语法要求**：`dsh-file-reference` 的 `@` 词法正则 = `/(?:^|\s)(@([^\s]*))$/` → **`@` 前面必须是行首或空白**；中文后直接打 `@`（无空格、无换行）**不触发**。
  2. **候选为空**：候选来自"**该会话绑定的工作区**"。实测用户唯一会话的工作区 = `I:\deepseekharness\AI股票`（`data/storages/workspace.json`），而**该目录里一个文件都没有** → 文件候选为空；会话引用也因为**只有 1 个会话**而为空。
- ⚠️ **未验**："候选为空时 UI 是完全不弹还是弹空菜单"**没实机验**，不猜。

### 4. 右侧栏 = `dsh-client-ui-sidebar-right`（是**容器**，不是单一功能）
- **容器能力**（读包内文案键）：打开/收起 · 全屏/退出全屏 · **多标签页** · **分栏（最多两格**，宽度不足提示「栏宽不足，拖宽侧边栏后再分栏」）· **拖拽放置**（移到这里/左·右·上·下分栏）· **浮动**（可"收回到侧边栏"）· 空面板 · 「这类内容还没有可用的查看方式」。
- **内容来源**：自带「开始」引导页（`tab.guide.title`）｜`dsh-client-ui-sidebar-files` = **工作区文件**｜`dsh-client-ui-sidebar-documentpreview` = **文档预览**｜`dsh-client-ui-chat` = 会话内容。
- ⛔ **只读**：全仓搜「保存/编辑」中文文案，命中的全是**消息队列编辑**、**工具名**（`tool.title.edit`/`write`）、**反馈**，**没有一条**是"在侧栏编辑文件并保存" → **不能直接改文件**。⚠️ 该结论属**线索判断，未实机点验**。
- 左侧栏家族 = `sidebar`（我方打过补丁改两列布局）+ `sidebar-files` + `sidebar-documentpreview`。

### 5. 「轮次导航」（对话记录跳转）= 官方功能，**条件：至少 2 轮**
- 文案：`chat.turnNavigation.label` = 「轮次导航」｜`jump` = 「跳转到第 {turn} 轮」｜`jumpLoad` = 「**加载并跳转到第 {turn} 轮**」（未加载的历史也能跳）。
- ⭐ **显示条件（读代码所得，决定性）**：`dsh-client-ui-chat` 的 `TurnNavigatorRail` 里有一行 **`if (items.length < 2) return null;`** → **少于 2 轮就不渲染**。⇒ 用户"上下文不够所以没显示"的直觉**方向对、原因不对**：不是长度问题，是**轮数 < 2**。
- 另注：`search.*`（「{shown} 处匹配 · {files} 个文件」）属**搜索结果渲染**，**不是**"对话记录搜索框"。

### 6. ⭐⭐ 官方**不内建记忆功能**，走 **MCP 外挂第三方记忆服务**
- 官方 `packages/` 共 54 个目录，**没有 `memory` 包**（相关的是 `compaction` 上下文压缩 / `context` / `session` / `session-query` / `storage` / `skill`）；本地 265 个官方包名里**也搜不到带 mem 的**。
- 官方文档：**`docs/user/guide/mcp-memory.md`（中文版 `.zh.md`）「连接第三方记忆 MCP 服务」** —— 提供**三份默认关闭的参考配置**（`apps/cli/config/examples/mcp-memory/`），经 `@deepseek-ai/dsh-mcp-client` 接入：
  | 系统 | 实测版本 | 传输 | 前置 |
  |---|---|---|---|
  | **Memorix** | `memorix@1.3.0` | stdio | Node 22.18+ + `npm i -g memorix@1.3.0` |
  | **MCP Reference Memory** | `@modelcontextprotocol/server-memory@2026.7.4` | stdio | 同上 npm 装；本地知识图谱，存 `$HOME/.dsh-mcp-reference-memory.jsonl`；**只是不区分大小写的子串匹配，不是语义检索；无 embedding/自动摘要/冲突消解/遗忘策略** |
  | **Engram** | `v1.20.0` | stdio | Go 1.25.10+ |
- **职责边界（官方原文）**：DSH 只做「解析 overlay → 起 stdio 子进程 / 连 Streamable HTTP → 发现工具 → 以 `mcp__<serverName>__<tool>` 暴露」；**不负责**下载服务器、初始化数据库、选模型/embedding、建云账号、迁移数据。**交付组合不含任何记忆服务器** → 不传 `--patch` 就全部关闭。
- **启用方式**：`dsh web --patch <那份 yml>`；**要持久** → 把那条 `insert` patch 合并进**用户补丁层**（`$DSH_HOME/profiles/<名>/cordis.patch.yml` 或 `$DSH_HOME/cordis.patch.yml`）。⚠️ **不要覆盖已有文件**（可能已有无关 patch）。⇒ **接记忆服务不需要改一行代码。**
- 官方可选共用模型指令（工具描述触发不可靠时加）：「用户要求记住某事时调用记忆写入工具；历史信息可能相关时，检索记忆并使用相关结果。」
- 官方验证法（3 步，**必须新建会话、但不用重启 Host**）：会话 A 说 `Remember that my validation drink is lapsang-<unique>.` → 新建会话 B 问 `What is my drink? Check memory.` → 再让模型用该值。注意首次发现是**异步**的，要等 `mcp__...` 工具出现再发验证提示。

### 7. ⛔ **接入记忆服务后，设置里不会出现"记忆管理"界面**（2026-09-16 取证）
- **全仓 UI 包搜「记忆」二字 → 零命中**。⇒ 界面上**根本没有"记忆"这个东西**。
- **没有任何 UI 包处理 `mcp`**（在 `dsh-client-ui-*/lib/client.js` 里搜 `mcp__` / `"mcp"` / `mcpServers` → 全空）。
- **`dsh-mcp-client` 是纯 host 侧插件**：其 `package.json` **无 `dsh.client` 字段** → **没有客户端半边、没有界面**。
- 设置里现有页面只有 5 个包：`settings`（通用）/ `settings-models`（模型）/ `settings-plugins`（插件）/ `settings-plugin-inventory`（插件清单）/ `settings` 容器 —— **没有 MCP 页、没有记忆页**。
- **记忆实际以"模型工具"形式存在**：`mcp__<serverName>__<tool>`。⇒ 能"看到"它的地方是**轨迹视图的「工具」标签页**（`tab.tools` = 「工具」；`record.toolsMissing` = 「本次请求没有工具」）—— 那里列的是**本次请求可用的工具**。⚠️ 这一点是**按代码推断**，未实机验（需真接一个 MCP 才能确认渲染）。
- **管理方式只能靠**：① 直接编辑提供方的存储文件（如 `~/.dsh-mcp-reference-memory.jsonl`）② 让模型调它的工具去查/改。
- ⇒ **"像 WorkBuddy 那样有记忆管理界面" = 官方没有 → 属自制功能候选（与 N30 右侧栏进化同类）。**

## 八、社区参照 / 版本情报

- Agents Anywhere（侧边栏「手机连接」）= 社区捆的第三方桥接包 `@agents-anywhere/dsh-bridge-next`，不在官方内核、也不是我方新增；社区 v2.0.7（提交 `1e31e4d08e`，2026-09-08）起引入（v2.0.4 的 package.json 无此依赖）。入口在侧边栏「设置」上方，弹窗三页签。**（2026-09-15 用户已定：社区版只作参考样本，不追随升级）**
- 社区 v2.0.10 情报（**仅存档，不再作为升级目标**）：tag `697e7d782c`（2026-09-14），距 v2.0.9 仅 10 个提交；内核 0.1.5-rc.1（`183f08e9`）→ 0.1.5-rc.2（`fb2c4b9e`）；13 个社区补丁只改名不改内容（`R100`）；上游改了 Windows 打包方式（不开 ASAR，提交 `09070dd72e`/`83cc4f821c`/`c7e1dbc940`/`fea9287036`）。我方 3 个补丁经解包逐文件比对：`dsh-api-session-controller`、`dsh-session-persistence-jsonl` **零改动**；只有 `dsh-client-ui-sidebar` 的 `lib/client.js` 真变了（-29B）。撞车面很小：上游 2.0.10 的 37 个改动文件中与我方 127 条改动只 5 个重合（都在 scripts/tests）。
- ✅ **打包 2026-09-15 00:29 成功**：安装包 `deepseekharness-2.0.9-x64-Setup.exe` 129.2 MB 已拷入 `I:\deepseekharness更新DIY\发布\`，更新源闭环完成；用户已装上并跑起来（未被 SAC 拦）。
- beta 摘除前的实测：beta 与 stable 的 `src` 完全同构（181 vs 181、无独有文件），28 处差异全是"我们只改了 stable"造成 → 无内容损失。
- 【只查不改】② 查设置里"局域网访问"开关为何置灰；③ 查桌面版"目录选择器"是否损坏。
