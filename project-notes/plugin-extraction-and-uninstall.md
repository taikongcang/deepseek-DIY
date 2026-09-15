# 插件三问：剥离「手机连接」／卸载按钮／插件存放路径

> 查证日期：2026-09-15　方法：读源码（含行号）+ 读官方包实现 + 查 npm registry + 读磁盘实际布局
> 结论摘要：
> ① **剥离 AA 可行**，但它不是"普通插件"——是 Desktop 主动注入并锁定的集成；剥离要改 Desktop 代码，有 3 个方案。
> ② **卸载按钮本就有**，且对"你自己装的任何插件"都生效；那两个没有按钮的是**产品自有 bundle，被硬编码为只读**。想强开有把 app 搞到起不来的实际风险。
> ③ 插件装在 **Profile 目录**里：`<DSH_HOME>\profiles\<profile>\node_modules\<包>`。

---

## 一、第 40 项：把「手机连接」（Agents-Anywhere）剥离成独立插件

### 1.1 它现在是怎么进到 app 里的（实测链路）

| 环节 | 事实 | 出处 |
|---|---|---|
| 开关 | 桌面设置里有个单选：「开启手机连接 / 关闭手机连接」 | `src/client/DesktopSettingsSection.tsx:638-651`；文案键 `aa*` 在 `src/client/desktop-settings-locales.ts:5-16`（中）/`126-137`（英） |
| **注入方式** | **不是**写在 profile 清单里！Desktop 在内存里把 AA **强制塞进** bundle 列表：`if (aaEnabled && !selectedBundles.includes(AA_PACKAGE_NAME)) selectedBundles.push(AA_PACKAGE_NAME)` | `src/profile.ts:527` |
| 反向防线 | 关闭时把 profile 里声明的 AA **剔除**；并有 `isAaEntry()` 过滤器 + 注释「AA 是可选的 bundle；用户层不能绕过 Desktop 的选择」 | `src/profile.ts:517-522`、`753-757` |
| 包来源 | 从 **app 自己的 node_modules** 解析（install anchor 优先于 profile）——即 AA 是 **dsh-plugin-desktop 的依赖**，随 app 打包 | `src/profile.ts:538-541`；`dsh-plugin-desktop/package.json` 的 `@agents-anywhere/dsh-bridge-next` |
| 交付链 | `vendor/agents-anywhere/<tgz>` + `provenance.json`（锁 `c00df092…`）→ 由 `scripts/prepare-agents-anywhere-release.mjs` 准备 → 根脚本 `aa:prepare-release`（**两个打包命令都会先跑它**） | 仓库根 `package.json` |
| 加载判定 | 仅当设置开启：`if (hooks.aaEnabled === true && aaFailure === undefined)`；失败会记 `aaFailure` 并在设置页显示「手机连接未能启动…重试加载」 | `src/profile.ts:960-981` |
| Desktop 额外注入 config | `{ ...rowConfig(aaRow), dshHome: home, connectorSourceDir }`；`connectorSourceDir = <aaLayer.packageDir>/lib/bundled-connector`（并把 `app.asar` 改写成 `app.asar.unpacked`），且**必须存在 `pyproject.toml`**，否则报错 | `src/profile.ts:970-977` |
| 实际数据目录 | `E:\app\deepseekharness\data\agents-anywhere\bridge`（已在跑） | 磁盘实测 |

### 1.2 AA 包本身的资质（决定它能不能当普通插件）

| 检查 | 结果 |
|---|---|
| 包名 / 版本 | `@agents-anywhere/dsh-bridge-next`，`0.1.0-dev.0.desktop.c00df092c98b2.rcda81994`（**社区本地构建的 desktop 变体**，非正式发布版） |
| 是否合法 dsh bundle | ✅ `package.json` 声明 `dsh.bundle.patch = ./cordis.patch.yml` → **满足 profile bundle 要求** |
| 自身 patch 文件 | 只有一行：`{ id: agents-anywhere-bridge-next, name: '@agents-anywhere/dsh-bridge-next', config: {} }`（与 `isAaEntry` 的校验一致） |
| 有无客户端 UI | ✅ `dsh.client`（platform `web`，inject sidebar/slots/connection）→ 侧边栏「手机连接」入口是它自己提供的 |
| Connector 载荷 | ✅ `lib/bundled-connector/`（含 `pyproject.toml`、`connector/cli.py`） |
| **Desktop 注入的 config 是否必需** | **不是硬需求**：`connectorSourceDir` 有默认值 `fileURLToPath(new URL('./bundled-connector/', import.meta.url))`（`lib/index.js:318`）；`dshHome` 回落到 `process.env.DSH_HOME`（`lib/index.js:6019`），而**我们的便携模式已经设了 `process.env.DSH_HOME`**（`src/main.ts:389-392`）→ 即使不被 Desktop 注入，AA 也能找到路径<br>⚠️ 唯一隐患：**ASAR 时代**这个默认值会指向 `app.asar\lib\bundled-connector`（物理不存在）—— 所以社区才要注入；而 **v2.0.10 起社区把 ASAR 关掉了**，这个隐患自然消失（见 `version-diff-2.0.9-2.0.10.md`） |
| **能否从 npm 安装** | ❌ **不能**。`registry.npmjs.org/@agents-anywhere/dsh-bridge-next` → **404**；`registry.npmmirror.com` → **404**。必须走**本地 tgz** |
| peerDependencies | 锁死 `@deepseek-ai/dsh-*: 0.1.5-rc.1`（精确版本）→ 装进 rc.2 的 app 会有 peer 提示；市场安装路径本身也只认 npm |

### 1.3 结论：能做，但有取舍 —— 三个方案

| 方案 | 做什么 | 收益 | 代价 / 风险 |
|---|---|---|---|
| **A 真剥离** | 移除 AA：① 从 `dsh-plugin-desktop`(+beta) 依赖里删掉 ② 删 `vendor/agents-anywhere` + 去掉 `aa:prepare-release` 步骤 ③ 删设置页 AA 单选 + 相关文案键 ④ 删 `profile.ts` 的注入/过滤（`AA_PACKAGE_NAME`、`AA_ROW_ID`、`isAaEntry`、`527` 行注入、`960-981` 加载块）⑤ 删启动恢复里对它的判定 | app 变轻、AA 变可选、**装进 profile 后可在市场里卸载** | 改动**触及 Desktop 深度集成**（设置页/启动恢复/校验）；**每次追社区版都要重做这层 diff**；AA 不在 npm → 要自建分发（本地 tgz）；它的 client/sidebar 入口要重新验证 |
| **B 只关开关（推荐先用）** | 设置→桌面设置→「关闭手机连接」 | **零改动、零风险**；关闭后 AA **不进 profile layers**（不加载） | 文件仍在 app 内（约占 1.1 MB unpacked + Python connector）；数据目录 `data\agents-anywhere` 仍在 |
| **C 折中** | 只做"减重"：删依赖 + 删 vendor + 去掉 prepare 步骤（保留开关与加载逻辑），并把"层不可用"从**报错**降级为**静默跳过**（否则关着开关也会永久显示"未能启动"横幅）；之后由我们自己把 AA 以 tgz 装进 profile，再用开关控制 | 剥离体积与供应链，改动比 A 小；AA 可由我们自己安装/卸载 | 仍需维护一处 diff（把 failure 降级 + 默认关闭）；安装要走 CLI，不能走市场 UI |

**我的建议**：**先 B（立刻可用、零风险）**；若你确实要"app 里不含 AA"，则做 **C**（比 A 稳妥，且顺带解决 v2.0.10 关 ASAR 后的路径问题）。**A 不推荐**（改动面大、长期维护成本高，而收益与 C 基本相同）。

**另外一个必须知道的交互**（无论选哪个）：**AA 的"加载"由 Desktop 开关决定，不由 profile 决定**。所以就算你把它装进 profile，只要开关是"关闭"，它也不会加载（但会出现在"已安装"列表里）。

---

## 二、第 41 项：给"已安装"列表的所有插件加"卸载"按钮

### 2.1 现状：**卸载功能早就有，而且是通用的**

| 环节 | 事实 | 出处 |
|---|---|---|
| 按钮渲染 | 仅当 `installation.action === 'uninstall'` 才渲染卸载按钮 | `dsh-community-market/src/client/MarketSettingsTab.tsx:1462-1469` |
| action 来源 | `action: bundle.uninstallable ? 'uninstall' : 'none'` | `.../src/host/routes.ts:525` |
| **uninstallable 判定** | `uninstallable = mutable && manifest.dependencyNames.has(packageName)` | `dsh-plugin-desktop/src/desktop-plugins.ts:435` |
| mutable 判定 | `mutable = 不在 IMMUTABLE_BUNDLES 里` | `desktop-plugins.ts:442-444` |
| **IMMUTABLE_BUNDLES 内容** | ① `PROFILE_TEMPLATES.web.bundles` = **`@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-web-app`**（官方包 `dsh-app-boot` 里写死，`lib/index.js:333-336`）② `@deepseek-ai/dsh-desktop-app` ③ `DESKTOP_PACKAGE_NAMES` = `dsh-plugin-desktop`、`dsh-plugin-desktop-beta` ④ `dsh-community-market` | `desktop-plugins.ts:42-47` |
| 官方文档口径 | 「产品自有 bundle 只读，其他直接依赖可以移除」；「无论插件由 Community Market、其他插件市场还是 DSH CLI 安装，都使用同一流程」 | `dsh-community-market/docs/install-and-uninstall.zh.md:45,50` |

→ **所以：你以后自己装的任何插件，本来就会带"卸载"按钮。** 截图里那两条没有按钮，是因为 `dsh-base` 和 `dsh-web-app` 是**产品自有 bundle**，被硬编码为只读。

### 2.2 想让它们也有按钮 = 拆掉安全闸，风险很高（如实说）

只要把 `IMMUTABLE_BUNDLES` 缩小（例如只留 launcher 自己），这两个就会出现卸载按钮。但：

- `@deepseek-ai/dsh-base` 是**内核本体**，`@deepseek-ai/dsh-web-app` 是**Web 界面载体**。`profile.ts:904-906` 里有一条硬校验：桌面 profile 若缺 `@deepseek-ai/dsh-web-app`，启动时**直接抛错** → 只能进恢复助手。
- 也就是说：**卸载它们 ≈ 把 app 弄到起不来**，要靠恢复模式救。这是上游故意设的闸，不是漏做。
- 另外卸载路径还有第二道校验：`routes.ts:1088-1089`，`!target.uninstallable` 直接抛 `not-available`；`startup-recovery-controller.ts:379` 也按同一个标志决定是否给"卸载"动作。

| 选项 | 说明 | 我的看法 |
|---|---|---|
| **41-a 不动**（推荐） | 维持现状：自有 bundle 只读，其他都能卸 | 与上游一致、零风险；也满足你"以后所有**安装的**插件都能卸载"这个诉求 |
| **41-b 缩小 IMMUTABLE_BUNDLES** | 例如只保留 `DESKTOP_PACKAGE_NAMES`（launcher 自身），让 `dsh-base`/`dsh-web-app`/`dsh-community-market` 可卸 | ⚠️ **高危**：可直接把 app 卸到起不来；且卸载后无自动恢复（市场不做回滚）。要给"卸载后如何恢复"设计兜底才敢做 |
| **41-c 折中** | 不动卸载，改为在恢复助手里让这些 bundle **可禁用**（disable 也受 `mutable` 管） | 需同步放开 disable 的闸，改动与 41-b 同源，风险相近 |

**我的建议：41-a**。你真正要的"能卸载自己装的插件"，**现在就是成立的**——这一点建议先实测一次（装一个第三方插件 → 看是否有卸载按钮），我把验证方法写在第 4 节。

---

## 三、第 42 项（问题三）：插件文件夹和安装路径

### 3.1 事实（磁盘 + 源码双证据）

装完的 app 是**便携模式**（我们的第 13 项改动）：`DSH_HOME = <安装目录>\data`（`src/main.ts:389-392`）。

```
E:\app\deepseekharness\                     ← 安装目录（可执行文件在这里）
└─ data\                                    ← DSH_HOME（便携：跟着安装目录走）
   ├─ profiles\
   │  └─ desktop\                           ★ 这就是 Profile 目录 = 插件的安装地
   │     ├─ package.json                    清单：dependencies + dsh.profile.bundles
   │     ├─ cordis.patch.yml                用户自己的补丁层（当前是 []）
   │     ├─ pnpm-lock.yaml / pnpm-workspace.yaml
   │     ├─ .dsh-module-fallback\
   │     └─ node_modules\                   ★ 插件包实体落在这一层
   │        ├─ .pnpm\                        pnpm 虚拟 store
   │        ├─ .modules.yaml / .package-map.json
   │        └─ <插件包名>\                    ← 装完的插件在这里
   ├─ agents-anywhere\bridge\               AA 的数据
   ├─ desktop\                              Electron userData（缓存，非 profile）
   ├─ sessions\ / storages\
   └─ settings.yaml / .credentials.yaml / .anonymous-user-id
```

**安装动作的真相**（不是猜）：
- `desktopPnpm.run()` 的 **cwd = 当前 profile 目录**（`src/pnpm.ts:163`：`cwd: this.bootstrap.activeProfileDir`），命令是 `pnpm add <pkg>@<精确版本>`；
- 之后 Host 把包**写进 `dsh.profile.bundles`**（`docs/install-and-uninstall.zh.md:25`）；
- 卸载 = `pnpm remove <pkg>` + 从 bundles 删除（同文档 `:48`）。

**pnpm 的两个关键配置**（读 profile 的 `.modules.yaml` 实测）：
- `nodeLinker: hoisted` → node_modules 是**扁平**布局（不是 `.pnpm` 软链树）
- **全局 store：`E:\.pnpm-store\v11`**（在 E 盘，符合你"不占 C 盘"的偏好）；registry 已设为 `https://registry.npmmirror.com/`

### 3.2 两个容易踩的点

1. **市场只能装 npm 上的包**：安装前 Host 会请求 `https://registry.npmjs.org/<pkg>/latest` 并要求返回精确稳定版本（`docs/install-and-uninstall.zh.md:22`）；而 Desktop 的 pnpm 策略对**市场通道**强制 `add <pkg>@<精确semver>`（`src/pnpm.ts:95-115`）。
   → **本地 tgz / file: 路径 不能走市场 UI**，只能用 CLI（`runPlugin` 那条通道校验宽松，`src/pnpm.ts:52,84-90`）。
   → 这也是为什么"剥离 AA 后要用 CLI 装"。
2. **`DSH_HOME` 是便携的**：插件的安装位置**跟着安装目录走**。移动/重装 app 目录 → 插件与数据一起走（除非你在恢复助手里改用别的数据目录）。
3. 想看现在到底装了哪些：直接读 `<profile>\package.json` 的 `dependencies` 与 `dsh.profile.bundles`（当前：只有 `dsh-base`、`dsh-web-app`，`dependencies` 为空）。

### 3.3 "独立插件的文件夹存放在什么地方"——两种含义分别回答

- **开发/源码目录（你自己维护的插件代码）**：由我们定，**必须纯 ASCII 路径**（中文路径会让 yarn 执行 bin 时炸，见 MEMORY 坑 1）。建议 `<某个 ASCII 根>\dsh-plugins\<插件名>\`，例如 `I:\dsh-plugins\`。
- **运行时装的位置**：就是上面那个 **Profile 目录** `<安装目录>\data\profiles\<profile>\node_modules\<包名>`。

---

## 四、动手前建议先做的两个小验证（低风险）

1. **验证"自己装的插件能卸载"**（回答第 41 项到底要不要改）：装一个第三方插件（例如从"可安装"里挑一个），装完到"已安装"看是否出现卸载按钮；再点卸载，确认恢复。**这一步最好在你确认不需要还原、且能接受再装一次的前提下做。**
2. **验证"关掉手机连接"是否满足第 40 项的诉求**：设置→桌面设置→关闭手机连接 → 重启 → 确认侧边栏入口消失、app 正常。若你接受"文件在但不用"，第 40 项到此结束，不用改一行代码。

> 未验证项（诚实标注）：`dsh plugin --profile desktop add <本地tgz>` 这条路我**没有实测**；`runPlugin` 的参数校验是宽松的，但 `file:` 说明符能否通过 `withDesktopPnpmPolicy` 尚未验证。真要走 C 方案，先做一次小实验。
