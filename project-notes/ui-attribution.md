# UI 归属与新旧版差异对照（2026-09-15 查证，全部有实据）

> 用途：以后遇到"这块 UI 是谁的、旧版是不是这样、我们改没改过"，直接翻这一张，不用重查。
> 比对基准：**旧版 = 你上次装的 2.0.4 DIY**（源码已从回收站找回实测，目录 `$RSDW0V2`）；**新版 = 现在的 2.0.9**（`I:\dsh-913`）；上游 = 社区仓库 git（13258 次提交、tag `v2.0.4`…`v2.0.9`）。

---

## 一、图1 的三个图标（标题栏右侧）

| 项 | 内容 |
|---|---|
| 组件 | `dsh-plugin-desktop/src/client/DesktopNativeActions.tsx` → `placement="titlebar"` 分支（第 205–275 行） |
| 三个按钮 | ① `SquareTerminal` = `openTerminal` → **打开 R9**（直接执行）<br>② `RotateCw` = `restartOptions` → **重启选项**（点开应用自绘菜单：重新加载界面 / 重启应用 / 重启到恢复模式）<br>③ `Wrench` = `developerOptions` → **开发者选项**（点开：切换开发者工具） |
| 悬停"小窗口" | **HTML 原生 `title` 属性**（`title={t('openTerminal')}` 等）→ 由**操作系统/Chromium 渲染的原生 tooltip**：朴素小框、有延迟、样式不受应用 CSS 控制 |
| 我方是否改过 | **没有**（`git status` 中无此文件） |
| 2.0.4 → 2.0.9 | **该文件字节完全相同**（`git diff --stat v2.0.4 v2.0.9` 输出为空） |

## 二、图2 的面板（窗口模式卡片）

| 项 | 内容 |
|---|---|
| 组件 | `dsh-plugin-desktop/src/client/DesktopFrameTitlebarView.tsx` → `DesktopModeControl`（第 103–163 行） |
| 触发 | 标题栏左侧的**模式徽章**（显示当前模式，如图2 的"扩展模式"）；`HoverCard`，悬停 150ms 弹出、移开 200ms 收起 |
| 内容 | 头部 `switchPresentationMode` + **只列非当前模式**（所以当前是"扩展模式"时，卡片里只有"兼容模式/增强模式"），每项含图标 + 名称 + 两行说明 |
| 属于 | **应用自绘的 React HoverCard**（shadcn 风格），与图1 的原生 tooltip 是两套机制 |
| 我方是否改过 | 该 `.tsx` 只改了 1 行：`DSH Desktop` → `lisa`（第 178 行产品名） |
| 机制 | 2.0.4 已有 `DesktopModeControl` + `HoverCard`（旧文件 `ExtendedTitlebar.tsx:110/136`）→ **机制没变** |

**文案新旧对照（上游自己改的）**

| 键 | 旧（2.0.4） | 新（2.0.9） |
|---|---|---|
| `presentationTitle` | 桌面外观与行为 | 窗口模式 |
| `switchPresentationMode` | 切换显示模式 | 切换窗口模式 |
| `extendedMode` | 扩展窗口 | 扩展模式 |
| `compatibilityModeBody` | 保留官方客户端布局，并在顶部提供独立的桌面控制栏。兼容性最好。 | 使用官方客户端布局，顶部提供独立的桌面控制栏。兼容性最好。 |
| `presentationIntro` | 选择兼容性最好的官方布局、玻璃扩展窗口或桌面增强布局。 | 选择窗口布局和桌面操作方式。 |

## 三、"打开终端"这条文案的全部落点（都已统一为"打开 R9"）

| 位置 | 文件 |
|---|---|
| 标题栏图标悬停 + 桌面设置页按钮 | `src/client/desktop-settings-locales.ts` |
| 原生弹窗按钮 | `src/native-dialog-copy.ts` |
| 托盘菜单 | `src/tray-locale.ts` |
| 恢复页按钮 | `src/recovery-copy.ts` |
| 插件市场页 | `dsh-community-market/src/client/locales.ts`（内容另含"复制到 …终端执行"） |

| 版本 | 中文文案 |
|---|---|
| 上游 2.0.9 | `打开 DSH 终端`（英文 `Open DSH Terminal`） |
| **旧版 2.0.4 DIY（回收站源码实测）** | **`打开 DIY终端`** |
| 现在（我方第 1 项改名后） | `打开 R9` |

> `命令段` 检索结论：`I:\dsh-913` 全源码 / 我方文档与归档 / `I:\deepseek-harness` / 官方核心 243 包（新版）与旧版核心包 / **社区仓库 13258 次提交全历史（`git log --all -S 命令段`）** → **零命中**。

## 四、手机连接 / Agents Anywhere（图3、图4）

| 项 | 内容 |
|---|---|
| 归属 | `@agents-anywhere/dsh-bridge-next`（社区**捆的第三方桥接包**，anywhere-labs 的 Agents Anywhere） |
| 图3 | 侧边栏**「设置」上方**的入口，走官方 `sidebar.footer.action` 扩展点（Lucide `Smartphone` 图标 + 「手机连接」；收起时只显示图标 + 名称提示）—— 见插件自带 `README.md:108` |
| 图4 | 点击后打开的插件**弹窗**（三页签：登录和连接 / 设置 / 运行日志） |
| 图4 那句报错 | `本次登录已超时，请回到插件重试。` → 插件自带代码 `lib/index.js:1353` |
| 是否新增 | AA 集成提交 `1e31e4d08e`（2026-09-08）→ 随 **v2.0.7**（tag 2026-09-10）进入；`v2.0.4`（08-29）的 `package.json` **无此依赖** → **对你上次的 2.0.4 是新增，但不是 2.0.9 独有、更不是我方新增** |
| 我方相关 | 打包用 pinned，捆的是 `c00df092…` 那一版 AA（不追上游 main） |
| 同类入口 | 标题栏还有个"远程控制"按钮（`remoteControl` 键），其引导文案指向"手机连接"—— 同一套 AA 能力 |

## 五、检索方法与范围（可复核）

> ✅ **对照旧版一律走 GitHub（用户 2026-09-15 定）**：用社区仓库 tag/commit 历史与官方内核仓库，**不再把回收站当资料来源**（回收站由用户自行清空）。
> 本文档里 v2.0.4 的那些对照数据，是 2026-09-15 从回收站里 `I:\$RECYCLE.BIN\…\$RSDW0V2\`（= 当时的 `I:\dsh-desktop`，2.0.4 DIY）读到的；**今后同样可比对**，命令：
> `git show v2.0.4:dsh-plugin-desktop/src/client/desktop-settings-locales.ts`（`git fetch --tags origin` 已在本地 clone 里完成）

- 上游历史：`I:\dsh-913` 的 git（HEAD `63e160ab43` = v2.0.9；**已 fetch 到 `v2.0.10`（`697e7d782c`）**；13258+ 提交；tag `v2.0.4`/`v2.0.7`/`v2.0.9`/`v2.0.10`…）
- 官方核心：`I:\dsh-913\dsh-plugin-desktop\node_modules\@deepseek-ai`（243 包）
