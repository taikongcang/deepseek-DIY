# 手动打包验证指引（Windows）

> 建立：2026-09-14 ｜ 工作副本：**`I:\dsh-913`** ｜ 当前版本：`2.0.9`
> 对应清单第 11 步（构建 + 打包 + 实机验证）。

---

## 0. 环境前提（已实测核实，不用重复查）

| 项 | 实测结果 |
|---|---|
| 工作副本路径 | `I:\dsh-913` —— **纯 ASCII，必须从这里跑**（含中文路径会弄坏 yarn 脚本） |
| Node | `E:\app\Node\node.exe` **v24.19.0** ✅ 满足 `package-win.ts` 的 "Node 22.19+ 或 24.x" 门槛 |
| Electron 二进制 | ✅ **已就位** —— `dsh-plugin-desktop\node_modules\electron\dist\electron.exe`（215 MB，v43.3.0）<br>⚠️ **这是打包的硬前提**：`vitest` 在 Windows 上每次都跑 `prepare-test-electron.mjs`，缺它则 preflight 直接挂 |
| electron-builder NSIS 工具链 | ✅ **已缓存** —— `%LOCALAPPDATA%\electron-builder\Cache` 里有 `nsis-3.0.4.1` / `nsis@1.2.1` / `nsis-resources-3.4.1` / `7zip` / `icons`，**不需要下载** |
| Electron 分发包缓存 | ✅ `%LOCALAPPDATA%\electron\Cache` 有 2 个条目（按 sha 命名），`electron-builder\Cache\electron` 目录不存在（新版走前者） |
| 当前 shell | **非管理员**（所以下面"准备动作 1"需要你开管理员窗口） |
| 智能应用控制（SAC） | ⚠️ **强制模式**（注册表 `VerifiedAndReputablePolicyState = 1`）→ 详见第 3 节 |

---

## 1. 三个准备动作（做一次即可）

### 动作 1 —— 给 Defender 加排除项（**必须，且需要管理员**）

**为什么**：NSIS 打包的最后一步要**运行刚生成的临时卸载器生成器**；Windows Defender 实时防护会把它当零信誉程序拦截，
现象是打包输出 `⨯ spawn UNKNOWN` 且 Defender 弹窗"阻挡"。

开一个**管理员** PowerShell（开始菜单搜 `PowerShell` → 右键 → 以管理员身份运行），跑：

```powershell
Add-MpPreference -ExclusionPath "I:\dsh-913"
```

> 想缩小范围只排除产物目录也行：`Add-MpPreference -ExclusionPath "I:\dsh-913\dsh-plugin-desktop\dist"`
> 但建议排除整个 `I:\dsh-913`，因为 NSIS 的临时目录也在工程内。

### 动作 2 —— 设四个环境变量（同一个窗口里设一次，后面命令都继承）

```powershell
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR = "https://npmmirror.com/mirrors/electron-builder-binaries/"
$env:YARN_NPM_REGISTRY_SERVER = "https://registry.npmmirror.com"
$env:DSH_AA_SOURCE_REF = "pinned"     # ← 必设，理由见下面「⚠️ 打包第一步会动仓库」
```

> ⚠️ `ELECTRON_MIRROR`（Electron 二进制本体）和 `ELECTRON_BUILDER_BINARIES_MIRROR`（builder 辅助工具）**是两个不同的变量**，两个都要设。
> 工具链已缓存，理论上这次不一定用得上，但设上能避免"证书墙"报错（`unable to verify first certificate`）。

#### ⚠️ 打包第一步会动仓库 —— 所以必须设 `DSH_AA_SOURCE_REF=pinned`

两个打包根脚本（`package:dir` / `dist:win`）的**第一步**都是 `yarn aa:prepare-release`
（`scripts/prepare-agents-anywhere-release.mjs`），它会准备捆绑的 **Agents Anywhere 桥接包**。

**默认行为（`DSH_AA_SOURCE_REF` 不设 = `main`）会把仓库改动 4~5 个文件**：

1. `git fetch --depth=1` 拉上游 `Agents-Anywhere@main` 的**最新 commit**
2. 在临时目录里 `install + build + typecheck + check:build + pack`，**产出一个全新 tgz**
3. 写入 `vendor/agents-anywhere/<新tgz>`，**覆写** `provenance.json`
4. 把 `@agents-anywhere/dsh-bridge-next` 依赖**重指到新 tgz** → 改 `dsh-plugin-desktop/package.json` **和** `dsh-plugin-desktop-beta/package.json`
5. 在根跑 `yarn install --mode=skip-build` → 连带改 `yarn.lock` + `node_modules`

（失败时脚本会回滚：复原 manifests 并删掉新 tgz。）

**为什么我们要避开它**：

- **验证要单一变量**。我们刚跑完的测试基线（`test` 45→30、`typecheck` 零错误）是拿**现在 pin 的那版 AA** 测的；
  打包时若把 AA 换成上游 `main` 的最新版，打出来的包里就含一个**从未被我们测过的依赖** → "打包验证通过"这句话就变得含糊。
- **它超出我们的 DIY 范围**。我们只改自己的东西，不该顺手把上游第三方依赖追到最新（那是"顺手优化"）。

**设了 `pinned` 之后的行为**（脚本 114–119 行）：立刻打印
`Using pinned AA 00df092c98b271098cba18b4f96d91f5008c2cd4` 并**直接返回**，
只对仓库里已有的 tgz 做一次 sha256 校验 —— **零改动、零联网、秒过**。

> 当前 pin 值（读 `vendor/agents-anywhere/provenance.json` 得到，核实过）：
> commit `00df092c98b271098cba18b4f96d91f5008c2cd4`、
> artifact `agents-anywhere-dsh-bridge-next-0.1.0-dev.0.desktop.c00df092c98b2.rcda81994.tgz`
>
> **将来真要升 AA** 时：不设 `pinned` 单独跑一次 `yarn aa:prepare-release`，它会自动更新上面这些值；**跑完记得重新全量验证**。

> **如果已经误跑了（没设 pinned）**：进程还在 `clone` 阶段时按 `Ctrl+C` 是**零损伤**的
> （那时一个字都还没写进仓库，只在 `%TEMP%` 留个临时目录）；一旦打印出
> `Agents Anywhere release package prepared from ...` 就说明已经写完了，那时要撤销得看 `git status`。

### 动作 3 —— 进工作副本（注意：写 `I:\dsh-913`，别写真实中文路径）

```powershell
cd I:\dsh-913
```

---

## 2. 打包命令

### ⚠️ 先看这条：`yarn package:dir` 在 Windows 上**跑不通**（上游缺陷，2026-09-14 已实测）

`yarn package:dir` 会一路走到最后然后失败：

```
⨯ dsh-plugin-desktop: cannot determine requested Electron architecture(s) for win  failedTask=build
    at requestedArchitectures (file:///.../verify-electron-fuses.ts:224:9)
Error: electron-builder --dir exited with 1
```

**根因（读 electron-builder 源码实锤，不是猜）**：

- `verify-electron-fuses.ts:222` 有一条 `--dir` 兜底：`if (targetNames.has('dir')) return [<本机 arch>]`
- 但 **`app-builder-lib/out/winPackager.js:64-67`** 对 `DIR_TARGET` **直接 `continue`**：
  ```js
  for (const name of targets) {
      if (name === core_1.DIR_TARGET) { continue; }   // ← Windows 上跳过 'dir'
  ```
  → Windows 的 `--dir` **永远不会**往 `platformToTargets` 里放 `'dir'` 键 → 那条兜底永不触发 → 抛错
- 归属：`verify-electron-fuses.ts` 我方**零改动**（`git status` 确认），electron-builder 是原版 **26.15.7** → **纯上游问题**（作者大概只在 macOS 上跑过 `package:dir`）

> ✅ **关键细节**：报错发生在**打包后校验钩子**里，所以 **app 目录其实已经完整生成** ——
> 实测 `dist\win-unpacked\deepseekharness.exe` 215.2 MB、**360 个文件**、`resources\app.asar` 存在。
> **想快速冒烟，直接双击那个 exe 即可**（见「方案 B」）。

→ **所以本指引不用 `package:dir`，直接用 `yarn dist:win`。**

---

### 方案 A（正式）：NSIS 安装包 —— 现在走这条

```powershell
cd I:\dsh-913
yarn dist:win
```

- **它做什么**：`aa:prepare-release` → market build → `scripts/package-win.ts`
- **产物**：
  - `dsh-plugin-desktop\dist\win-unpacked\deepseekharness.exe`（免安装版）
  - `dsh-plugin-desktop\dist\deepseekharness-2.0.9-x64-Setup.exe`（安装包）
- **为什么它不会踩上面那个坑**：它带 `--win nsis --x64` → arch 能从 `config.win.target = [{target:'nsis',arch:['x64']}]` 解析出来 → `configuredTargetArchitectures` 命中 → fuse 校验能过。
  （按代码推演应通过；**实跑为准**，若仍失败请把输出发我。）
- ⚠️ **它内部会先跑一段 preflight**（`check:win-package`）：
  market build → desktop build → typecheck → **14 个测试文件** → `verify:closure`。
  **preflight 挂了，打包根本不会开始。**
- 打包末尾自动跑 `scripts/verify-win-installer.ts` 校验产物，**通过才算真成功**。
- 耗时比 `--dir` 长（多了 preflight + NSIS 压缩）。

> **第二次打包想跳过 preflight**（省几分钟）：加一行 `$env:DSH_PACKAGE_CHECK_ALREADY_RAN = "1"`
> ⚠️ 只在**代码没再改过**时这样做（preflight 的意义就是拦住"没通过构建/测试就打出来的包"）。

### 方案 B（0 成本，可先做）：直接试跑已产出的免安装版

```
I:\dsh-913\dsh-plugin-desktop\dist\win-unpacked\deepseekharness.exe
```

双击即可（那 360 个文件就是完整的应用目录，只是命令行报了"失败"）。
- 能开 → 说明**我们的改动在真机跑得起来**，这是最有价值的一条验证；
- 被拦（弹窗里**没有"仍要运行"**）→ 是**智能应用控制（SAC）**干的（我们代码里的 `signExecutable=false`，包必未签名）→ 见第 3 节第 4 条。

### 方案 C（可选）：免安装 zip 便携版

```powershell
yarn dist:win-portable
```

### ❌ 不要用：`yarn package:dir`

原因见上。**将来若要用它**，只能给 `verify-electron-fuses.ts` 打补丁（让 Windows `--dir` 也能解析 arch）—— 那是改上游社区文件、超出我们清单范围，**现在不做**，已登记为已知上游缺陷。

---

## 3. 会拦你的四件事（按可能发生的顺序）

| # | 现象 | 真因 | 对策 |
|---|---|---|---|
| 1 | 打包输出 `⨯ spawn UNKNOWN` + Defender 弹窗"阻挡" | Defender 实时防护拦 NSIS 卸载器生成器 | **准备动作 1**（加排除项） |
| 2 | `unable to verify first certificate` / 下载失败 | 走了境外源 + 证书链问题 | **准备动作 2**（设镜像） |
| 3 | 打包头几秒在**拉 Agents-Anywhere 仓库**（刷 `Receiving objects...`），或 `aa:prepare-release` 报 git 错误 | 脚本默认追上游 `main` 的**最新 commit** → 会**重建并替换**捆绑的 AA 桥接包（连带改 4~5 个文件） | ⚠️ **必须设 `$env:DSH_AA_SOURCE_REF = "pinned"`** → 跳过网络与重建、直接用仓库里 pin 的 tgz（详见「动作 2」下方说明） |
| 4 | 包打出来了，但**双击会被拦**、弹窗里**没有"仍要运行"** | **智能应用控制（SAC）= 强制模式**，我们的包**未签名** | 见下 |

### 关于第 4 条（SAC），必须说清

- 我们打的包**必然未签名** —— `scripts/package-win.ts` 会**主动删掉 6 个签名相关环境变量**，并加 `--config.win.signExecutable=false`，日志里自述"Authenticode is a separate release step"。
- SAC 是三态的：`0=关 / 1=强制 / 2=评估`。**本机现在是 1（强制）**，且**这个状态不可逆**（关掉后不能开回来；评估模式一旦离开也回不去，除非重置系统）。
- 三条出路：
  - **(a) 关闭 SAC**：设置 → 隐私和安全性 → Windows 安全中心 → 应用和浏览器控制 → 智能应用控制设置 → **关闭**。（自用开发机常规操作，但**不可逆**，你拍板）
  - **(b) 买代码签名证书**：一劳永逸，要花钱。
  - **(c) 只验"能打出来 + 免安装目录能跑"，不做安装测试** —— **推荐先用这条**，因为 SAC 拦的是**运行**、不拦**打包**。

---

## 4. 怎么判定"打包成功"

| 判据 | 期望 |
|---|---|
| 命令退出码 | `0`（非 0 就是失败，往上翻日志找第一条 `Error`） |
| 产物存在 | `I:\dsh-913\dsh-plugin-desktop\dist\deepseekharness-2.0.9-x64-Setup.exe` |
| 免安装版 | `dist\win-unpacked\deepseekharness.exe` 存在且能双击打开 |
| 结尾校验 | 日志里 `verify-win-installer` 通过（打包脚本自动跑） |
| Electron fuse 校验 | `afterAllArtifactBuild` 会自动跑 `verify-electron-fuses.ts`，通过才算完 |

> ⚠️ **日志里出现中文乱码 ≠ 失败**：PowerShell 按 GBK 读 Node 的 UTF-8 输出会显示乱码，程序其实是好的。
> **唯一可靠判据是命令是否真的失败 + 退出码。**

---

## 5. 实机验证清单（打包后逐条核对）

1. 免安装版双击 → 窗口正常打开；**标题栏 = `lisa`**、**任务栏 = `deepseekharness`**
2. 看**安装目录下是否出现 `data\`**（含 `profiles\` / `sessions\` / `desktop\`）→ 便携模式生效
3. 看 `C:\Users\50667\AppData\Roaming\deepseekharness` **是否不再增长**（若存在旧目录，说明还在走旧路径）
4. 确认**不再读取** `I:\deepseek-harness\.dsh`
5. 设置 →「插件」→ 应**只剩两个标签页**（插件配置 / 插件列表），**没有"插件市场"tab**（第 30 项）
6. 侧边栏左下角：「插件市场」「设置」应**左右并排**（两列布局，第 32 项）
7. 会话目录名应形如 `session-2026-09-14-141020-47fb66ff`（第 33 项）
8. 设置 →「插件市场」→「来源」：应有 **3 个内置源**（DSH 1024Store / dshfind / **Awesome DSH Plugins**）（第 3 项）
9. 终端入口文案应为 **`R9`**（第 1 项）

---

## 6. 打包完 → 更新源闭环

打包产物就是更新源要的形态，**不用改名**：

```powershell
# 1) 拷安装包进更新源
Copy-Item "I:\dsh-913\dsh-plugin-desktop\dist\deepseekharness-2.0.9-x64-Setup.exe" "I:\deepseekharness更新DIY\发布\"

# 2) version.json 已是 {"version": "2.0.9"}，与产物一致，无需改
```

之后客户端「检查更新」就会走本地源（文件已在位 → 正常返回；装的是同版本 → 显示"已是最新"）。

> 更新源目录已于 2026-09-14 建立，说明见 `I:\deepseekharness更新DIY\README.md` 与 `发布\README.md`。

---

## 附：这次打包前，我们已经验证过的部分（不用重跑）

| 已通过 | 结果 |
|---|---|
| `dsh-community-market` build + check | ✅ 264/264 测试，全构建链通过 |
| `dsh-plugin-desktop` build | ✅ 通过（tsdown + vite，93 文件 2.33 MB） |
| `dsh-plugin-desktop` typecheck | ✅ 5 个 tsconfig 全 exit=0 |
| `dsh-plugin-desktop` test | ⚠️ 30 failed —— **100% 是环境/平台类**（见清单第 37 项），且这 30 个**没有一个落在 `check:win-package` 的 14 个测试文件里** |
| 双语文档 i18n | ✅ 51 records / 102 documents 一致 |

> 推论（可验证）：**`check:win-package` 这个 preflight 预期会通过** —— 因为它挑的那 14 个测试文件与我们剩余失败清单**零重叠**。
> 若实际跑出来 preflight 挂了，说明出现了新问题 → **立即停下报告，不要绕过它**。
