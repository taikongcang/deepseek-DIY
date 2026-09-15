# deepseekharness

我们自己的 DeepSeek Harness 桌面版：以 **DeepSeek Harness 官方内核**为基础，参考社区版 **DSH Desktop** 的桌面外壳改造而来，并做了大量自有定制。

> **这不是社区版 DSH Desktop 的仓库，也不跟随它升级。**
> 社区发版只作为"官方改了什么 → 社区跟着改了什么"的**参考情报**；只有我们确实需要的东西才借过来。

---

## 一、它是什么

一个 Electron 桌面应用，把 DeepSeek Harness 的本地 Web UI、Host 服务与插件系统装进原生窗口。

- **三种显示模式**：兼容模式 / 增强模式 / 扩展模式（标题栏左侧徽章切换）
- **桌面侧能力**：原生窗口与托盘、内置终端（R9）、原生目录选择器、更新检查、多 Profile 切换
- **插件市场**：内置市场壳，可从市场源发现并安装插件（自己装的插件可从市场卸载）
- **手机连接**（可选）：把 Agents Anywhere 桥接做成可开关项
- **便携模式**：所有数据跟随安装目录（`<安装目录>\data`），不污染系统

## 二、与上游的关系（怎么改）

| 层 | 来源 | 改法 |
|---|---|---|
| 官方内核（265 个包） | DeepSeek 官方 [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness)，以**预打包 tgz** 存于 `vendor/dsh-runtime/<版本>/` | ❌ 无源码 → **叠补丁**（`patches/`） |
| 第三方 npm 包（`app-builder-lib` / `open` / `pnpm` / `fs-ext` / `vscode-ripgrep` / `dshmarket`） | npm | ❌ 无源码 → **叠补丁** |
| 桌面外壳（`dsh-plugin-desktop` / `dsh-community-market` / `dsh-community-fabric`） | 参考社区版 DSH Desktop 改造 | ✅ 有源码 → **直接改源码** |

## 三、构建与运行

**前置**：Node.js `^22.19.0` 或 `>=24.0.0`；Yarn `4.18.0`（通过 Corepack）。

> ⚠️ **工作副本必须放在纯 ASCII 路径**（当前为 `I:\dsh-913`）。含中文的路径会让 Yarn 执行 `package.json` 脚本时破坏路径，报 `Cannot find module '<乱码>\…'`。

```sh
yarn install      # 安装依赖（可离线执行）
yarn build        # 构建市场 + 桌面
yarn typecheck    # 类型检查
yarn test         # 单元测试
yarn dev          # 开发模式启动
```

## 四、打包（Windows）

**推荐：双击 `I:\deepseekharness更新DIY\工具\build-win.cmd`**（它设好 `DSH_AA_SOURCE_REF=pinned` 与镜像兜底后执行 `yarn dist:win`）。

手工等价命令：

```powershell
cd I:\dsh-913
$env:DSH_AA_SOURCE_REF = "pinned"   # 必须！否则会联网解析上游并改写 vendor/ 与 package.json
yarn dist:win
```

产物：`dsh-plugin-desktop\dist\deepseekharness-<版本>-x64-Setup.exe`

⛔ **不要用 `yarn package:dir`** —— electron-builder 在 Windows 上不把 `--dir` 计入目标，打包后校验钩子会报 `cannot determine requested Electron architecture(s) for win`（上游缺陷）。

打包前建议让 Windows Defender 排除工作副本目录（NSIS 最后一步会执行一个零信誉的临时 exe，可能被实时防护拦掉）。

## 五、版本号

**走自有序列**，与社区版版本号无关。当前 `3.0.0`。

- 唯一版本源：`dsh-plugin-desktop/package.json` 的 `version`
- **必须大于上一个已发出的号**（客户端更新检查靠版本号比较）
- 每次对齐社区版 / 官方内核时，在 **`UPSTREAM-ALIGNMENT.md`** 新增一行记录

## 六、更新源

客户端从本机更新源取版本与安装包：

```
I:\deepseekharness更新DIY\发布\
  ├─ version.json                            ← {"version": "..."}
  └─ deepseekharness-<版本>-x64-Setup.exe    ← 打包产物直接拷进来，不用改名
```

发新版三步：① 打包 → ② 安装包拷进 `发布\` → ③ 改 `version.json` 的版本号。

## 七、目录结构

| 路径 | 内容 |
|---|---|
| `dsh-plugin-desktop/` | 桌面主包（Electron 引导、Host/Client 两侧、打包与发布测试） |
| `dsh-community-market/` | 插件市场壳 |
| `dsh-community-fabric/` | 社区互操作 RFC（文档脚手架） |
| `patches/` | 对官方内核包与第三方包的补丁（21 个） |
| `vendor/dsh-runtime/<版本>/` | 官方内核的预打包 tgz（265 个） |
| `vendor/agents-anywhere/` | Agents Anywhere 桥接包（pinned tgz） |
| `docs/` | 保留的上下游文档（架构 / 插件开发 / 打包实验记录） |
| `.agents/notes/` | 社区设计笔记（**仅供人参考；AI 不读**） |
| `AGENTS.md` | 本仓库的规则（**唯一权威**） |

## 八、数据与隐私

**所有数据都在本机**：便携模式下 `DSH_HOME = <安装目录>\data`。详见 [`PRIVACY.md`](PRIVACY.md)。

## 九、许可与致谢

- 智能体内核、工具、会话、Web UI、插件生态来自 **DeepSeek 官方** [`deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness)
- 插件化基础来自 [Cordis](https://github.com/cordiverse/cordis)
- 桌面外壳参考了社区项目 [`anywhere-labs/dsh-desktop`](https://github.com/anywhere-labs/dsh-desktop)

本仓库是**个人定制分支**，与上述项目没有隶属、合作、授权或背书关系。许可证：MIT（见 [`LICENSE`](LICENSE)）。
