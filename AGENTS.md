# deepseekharness 仓库规则

本仓库是**我们自己的** deepseekharness 桌面版：以 DeepSeek Harness 官方内核为基础，参考社区版 DSH Desktop 的桌面外壳改造而来，并做了大量自有定制。
**它不是社区版（DSH Desktop）的上游仓库，也不跟随社区版升级** —— 社区发版只作为"官方改了什么 → 社区跟着改了什么"的参考情报。

## 一、前置条件

- Node.js `^22.19.0` 或 `>=24.0.0`；Yarn `4.18.0`（通过 Corepack）。
- **工作副本必须放在纯 ASCII 路径**（当前为 `I:\dsh-913`）。含中文的路径会让 Yarn 执行 `package.json` 脚本时破坏路径，报 `Cannot find module '<乱码>\…'`。
- **不要初始化 `deepseek-harness` submodule**：官方内核以预打包 tgz 形式存放于 `vendor/dsh-runtime/<版本>/`，不需要上游源码。
- 安装依赖：`yarn install`（可离线执行；需要"硬离线"保证时加 `$env:YARN_ENABLE_NETWORK="false"`）。

## 二、常用命令

| 目的 | 命令 |
|---|---|
| 构建（市场 + 桌面） | `yarn build` |
| 类型检查 | `yarn typecheck` |
| 测试 | `yarn test` |
| **Windows 打包（推荐）** | 双击 `I:\deepseekharness更新DIY\工具\build-win.cmd` |
| 手工打包（等价） | 设 `$env:DSH_AA_SOURCE_REF="pinned"` 后跑 `yarn dist:win` |

**注意**

- ⛔ **不要用 `yarn package:dir`**：electron-builder 在 Windows 上不把 `--dir` 计入目标列表，打包完成后校验钩子会报 `cannot determine requested Electron architecture(s) for win`（上游缺陷，社区 2.0.10 仍未修）。**用 `yarn dist:win`。**
- `yarn dist:win` 会先跑 preflight（market/desktop 构建 + typecheck + 14 个测试文件 + `verify:closure`）。确认代码没再改过时，可设 `$env:DSH_PACKAGE_CHECK_ALREADY_RAN="1"` 跳过。
- 打包前**必须**设 `$env:DSH_AA_SOURCE_REF="pinned"`：否则 `aa:prepare-release` 会联网解析上游 `Agents-Anywhere@main`、重建 tgz，并改写 `vendor/agents-anywhere/`、`dsh-plugin-desktop/package.json` 与 `yarn.lock`。
- ⚠️ **`yarn check:layout` 目前跑不通（预期）**：它内部会读 `deepseek-harness/package.json` 并校验 submodule 检出，而我们**已决定不拉 submodule** → 该步必然失败。其余子命令（`check:bilingual-docs` / `check:architecture` / `check:vendored-runtime`）可单独执行。

## 三、包归属与改动规则（重要）

| 对象 | 有源码？ | 改法 |
|---|---|---|
| `dsh-plugin-desktop` / `dsh-community-fabric` / `dsh-community-market` | ✅ 有（root `workspaces`） | **直接改源码** |
| 官方内核 265 个包（`vendor/dsh-runtime/<ver>/*.tgz`） | ❌ 无 | 叠补丁（`patches/`） |
| 第三方 npm 包（`app-builder-lib` / `open` / `pnpm` / `fs-ext` / `vscode-ripgrep` / `dshmarket`） | ❌ 无 | 叠补丁 |

- **不要编辑 `deepseek-harness/` 与官方包内的任何源码**：官方包不可直接编辑，只能通过补丁。
- **只有一个构建通道（stable）**；beta 通道（`dsh-plugin-desktop-beta`）已于 2026-09-15 **整体摘除**（`workspaces`、构建脚本、目录全部移除）。
- `vendor/` 是官方内核的**本地分发副本**。`upstream.json` 只在确实要更换官方内核版本时使用。
- `patches/` 的文件名把内核版本号写死（如 `@0.1.5-rc.1.patch`）；更换内核版本后需逐个重新适配。

## 四、本仓库已停用或不适用的上游做法

- ❌ 不初始化 `deepseek-harness` submodule，不跑 `upstream:*` 脚本（除非确实要更换内核版本）。
- ❌ 不使用 `yarn package:dir`。
- ❌ 不跑 `check:desktop-variants` —— 该命令与脚本已随 beta 一起删除。
- ⛔ **不要读 `.agents/` 目录**：那是社区（DSH Desktop）的设计笔记，**仅供人参考学习**。AI 不要读它、不要引用它、不要把它当作本仓库的规则或约束来源 —— 本仓库的规则**只以本文件为准**。

## 五、版本号与文档分工

- 版本号**只增不减**，且必须**大于上一个已发出的号** —— 客户端的更新检查靠版本号比较，号小了会被判定"没有新版本"。
- **唯一版本源** = `dsh-plugin-desktop/package.json` 的 `version`（electron-builder 用它生成产物名、客户端更新检查也用它）。
- 每次"对齐"社区版或官方内核时，在 **`UPSTREAM-ALIGNMENT.md`** **新增一行**记录，不要覆盖历史。
- **不因为社区版发新版就跟着发新版。**
- **文档分工**：`CONTRIBUTING.md` 是**自用版，AI 只读这一份**；`docs/contributing-full-reference.md` 是给人看的参考读物，**AI 不要读**。

## 六、相关位置

| 用途 | 路径 |
|---|---|
| 本仓库（工作副本） | `I:\dsh-913` |
| **版本对齐记录**（发版必看） | `UPSTREAM-ALIGNMENT.md`（仓库根） |
| 需求清单（**唯一权威**） | `I:\deepseekharness制作\.workbuddy\redolist.html` |
| 打包脚本 | `I:\deepseekharness更新DIY\工具\build-win.cmd` |
| 更新源（客户端拉取版本与安装包） | `I:\deepseekharness更新DIY\发布\` |
| 项目记忆与文档 | `I:\deepseekharness制作\.workbuddy\` |
| 社区版（只读参照，不修改） | `I:\deepseekharness9-13\9-13DSH-desktop最新更新一套` |
