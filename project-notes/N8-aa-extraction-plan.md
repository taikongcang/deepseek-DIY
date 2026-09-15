# N8 · 「手机连接」(Agents-Anywhere) 真剥离 + 独立插件化 —— 方案书

> 2026-09-15 19:45 起草　状态：**待 Z 拍板**（1 项前置验证 + 3 项决策）
> 用户指令原文：「"手机连接"需要真剥离，剥离出来做出单独的插件，不在打包内，插件形式后续安装进去，不管用不用，这样插件都可以管理。」
> 方法：读源码 + 读磁盘实际布局，**无推断**。所有结论均标出处。

---

## 〇、结论先说

| 问题 | 结论 |
|---|---|
| **能不能剥离成独立插件？** | **能。** 有硬证据（见 §一） |
| **前后有没有不能回头的坑？** | 没有。剥离是**代码改动 + 不打进包**，tgz 留着就永远能装回来 |
| **必须先做的一件事** | **§二 的前置验证** —— "装回来"这条路我**没实测过**，不过不给方案定案 |
| **需要你定的事** | **3 件**（§三）：装回来的入口 / tgz 存哪 / 上不上 GitHub |

---

## 一、可行性：三条硬证据（读源码所得）

### 证据 1 · 它本身就是合法的 dsh 插件
`@agents-anywhere/dsh-bridge-next/package.json`（版本 `0.1.0-dev.0.desktop.c00df092c98b2.rcda81994`）：

```json
"dsh": {
  "bundle": { "patch": "./cordis.patch.yml" },     ← 满足 profile bundle 的强制要求
  "client": { "platform": "web", "inject": [ …slots / connection / sidebar ] }  ← 侧边栏「手机连接」入口是它自己提供的
}
```
运行时依赖只有 3 个纯 JS 包：`clsx` / `lucide-react` / `qrcode`。**没有任何原生模块**。
→ 也就是说：**它和你在市场里装的第三方插件，形态上是同一类东西。**

### 证据 2 · 它**自己就能找到** Python connector，不需要 Desktop 喂路径
`lib/index.js:318`：
```js
const connectorSourceDir = config.connectorSourceDir ?? fileURLToPath(new URL("./bundled-connector/", import.meta.url));
```
默认值是**「我自己的模块旁边」**（相对它自己的文件位置）。
→ 只要它被装进 profile 的 `node_modules`，这个默认值就**天然正确**。
→ 附带好处：装进 profile 后它是**普通文件系统目录**，社区那套「ASAR 里路径不存在、所以要 Desktop 改写 `app.asar` → `app.asar.unpacked`」的隐患**自动消失**。

### 证据 3 · 数据目录它**自己也能找到**
`lib/index.js:6019`：
```js
const home = config.dshHome ?? process.env["DSH_HOME"] ?? join(homedir(), ".dsh");
```
Desktop 注入的只有两项：`dshHome`、`connectorSourceDir`（`profile.ts:975-977`）。而：
- `dshHome` → 我们的**便携模式已经设了 `process.env.DSH_HOME`**（`main.ts:391`，实测数据目录 `data\agents-anywhere\bridge` 就是这么来的）
- `connectorSourceDir` → 见证据 2，有模块相对默认值

→ **两项注入都不是硬需求，AA 独立也能跑。**

### 一个附带收益（与"走最稳路线"相关）
剥离后，打包不必再跑 `aa:prepare-release`（`package.json` 里 **6 个命令都带这个前缀**）→ **构建链更短，更容易做到完全离线**。

---

## 二、⚠️ 前置验证（第 0 步，必须先过，不动产品代码）

### 为什么必须先做
「装回来」目前**只有一条路**：把本地 tgz 用 DSH CLI 装进 profile。而这条路
**我没有实测过**（社区那套机制校验宽松，但能不能通过 Desktop 的策略尚未验证）。

**如果这条路不通，"剥离成独立插件"就变成"剥离后装不回来"** —— 那就不是插件化，是删除。

### 怎么做（在一个**临时 profile**里做，绝不动 `desktop`）
1. 新建一个临时 profile（CLI：`dsh profile --help` 找创建方式；或直接复制目录）
2. `dsh plugin --profile <临时> add <tgz 绝对路径>`
3. 启动 app 指向该 profile → 看**侧边栏是否出现「手机连接」**、连接页是否正常
4. 再 `remove` 一次 → 看是否干净卸载

### 判据
- ✅ 装上、能起、侧边栏出现、remove 干净 → **方案定案，进入剥离**
- ❌ 装不上（peer 冲突 / file: 说明符被策略拒） → **回到你面前，我给替代方案**（可能是：把 tgz 发到私有 npm registry、或做一个"本地 tgz 安装"的自制入口）

> 诚实标注：还有一处**未验证** —— AA 的 peerDependencies 精确锁 `@deepseek-ai/dsh-*: 0.1.5-rc.1`（与我们内核**完全一致**，理论上无冲突），但 pnpm 的 `auto-install-peers` 会不会额外拉一堆包，要跑了才知道。

---

## 三、需要你定的 3 件事

### 决策 1 · 「装回来」的入口
市场 UI **装不了本地 tgz**（它强制走 `registry.npmjs.org` 取稳定版；AA 是 dev 版、且**不在 npm 上**，registry 实测 404）。所以：

| 选项 | 做法 | 好处 | 代价 |
|---|---|---|---|
| **1-a** | 接受"**终端装、UI 卸**"：装用 CLI，卸用市场"已安装"里的卸载按钮 | 零额外开发 | 装的时候要开终端敲命令 |
| **1-b** | 我另做一个"**从本地 tgz 安装**"的自制入口（进丁组 N30+） | 全程 UI 化，"插件都可以管理"这句话才真正成立 | 需要开发（改我们自己的 `dsh-community-market`，是一次性成本） |
| **1-c** | 先只做剥离，安装方式留到后面单独议 | 最快拿到剥离结果 | 中间一段"装不回来" |

### 决策 2 · AA 插件包（tgz, 522 KB）存在哪
- 现址：`I:\dsh-913\vendor\agents-anywhere\…tgz`（剥离后会从仓库里移走）
- 候选：① `I:\dsh-plugins\`（纯 ASCII，符合"插件源码另立目录"的旧约定）② 更新源 `I:\deepseekharness更新DIY\发布\` 一起分发 ③ 你自己指定

### 决策 3 · 要不要跟代码一起传 GitHub 公开仓
- 我们的公开仓 `taikongcang/deepseek-DIY`（代码 + 文档上传，安装包不上传）
- AA 的 tgz 是**第三方 MIT 包**（不是我们写的），里面含 Python connector 脚本
- 传 → 以后换机器能直接取；不传 → 只在本机留存

---

## 四、改动面清单（一处不落）

### A 组 · 核心加载逻辑（我们自己的源码 → 直接改）
| 文件 | 命中数 | 要动什么 |
|---|---|---|
| `dsh-plugin-desktop/src/profile.ts` | **35** | 删 `AA_PACKAGE_NAME`/`AA_ROW_ID`/`isAaEntry`；删 `517-518` 的过滤、`527` 的注入、`975-981` 的注入块、`959-960` 的 `aaPatches`/`aaFailure`、`958` 过滤参数 |
| `dsh-plugin-desktop/src/main.ts` | 10 | 删 `aaEnabled` 的读取/传递/安全模式分支 |
| `dsh-plugin-desktop/src/host-bootstrap.ts` | 3 | 删 `readAa` 等 |
| `dsh-plugin-desktop/src/safe-mode.ts` | 2 | 删安全模式里的 AA 默认值 |

**关键**：删掉后，AA 变成**普通 bundle** → 立刻落入现有的 `mutable` / `uninstallable` / `disabledBundles` 机制 → **「可管理」是自动获得的，不用另写代码。**

### B 组 · 偏好存储
| 文件 | 命中数 | 要动什么 |
|---|---|---|
| `profile-preferences.ts` | 9 | 把 `aaEnabled` 从 `SELECTION_KEYS`/`STATE_KEYS`/接口里整个摘掉 |
| ⚠️ 你机器上的既有数据 | — | `data\desktop\profile-preferences\<hash>\state.json` 里现存的 `"aaEnabled": true` 要处理（多一个键会不会报错，需实测确认） |

### C 组 · 首次运行向导
| 文件 | 命中数 |
|---|---|
| `setup-wizard-copy.ts` | 27 |
| `native-ui/setup-wizard/App.tsx` | 14 |
| `setup-wizard-window.ts` | 5 |
| `setup-wizard-contract.ts` | 4 |
→ 向导里少一步（"要不要手机连接"）。⚠️ **要读代码确认步骤编号/状态机有没有连锁改动**（未查证，标为风险）。

### D 组 · 设置页 + 中英文案
| 文件 | 命中数 | 说明 |
|---|---|---|
| `client/DesktopSettingsSection.tsx` | 22 | 整个"手机连接"单选块（`638-651`） |
| `client/desktop-settings-locales.ts` | 20 | `aaSaving/aaLoadFailed/aaTitle/aaIntro/aaDisabled(Body)/aaEnabled(Body)/aaSaveFailed/aaSaved` × 中英两套（`:6-16` / `:127-137`） |
→ 按你已定的口径：**改文案只改中文那套**（英文那套走 A 方案：不动、也不管）。

### E 组 · 打包与脚本
| 文件 | 要动什么 |
|---|---|
| `dsh-plugin-desktop/package.json` | 删依赖 `@agents-anywhere/dsh-bridge-next`；删 3 处 `asarUnpack` 里的 `bundled-connector/**`（`win:397` / `mac:367` / `linux:433`） |
| 根 `package.json` | 6 个命令去掉 `yarn aa:prepare-release && ` 前缀（`:596,598-602`）；删 `aa:check` / `aa:prepare-release`（`:609,610`） |
| `scripts/prepare-agents-anywhere-release.mjs` | 删除 |
| `dsh-plugin-desktop/scripts/verify-packaged-runtime.ts` | 删白名单条目（`:693` 的 AA 例外） |
| `dsh-plugin-desktop/scripts/verify-profile-boot.mjs` | 删 AA 相关 |
| `vendor/agents-anywhere/` | 移出仓库（去哪见决策 2） |
| 打包入口 `工具\build-win.cmd` | 里面的 `DSH_AA_SOURCE_REF=pinned` 变成无用（**不删也不报错**，可留可不留） |

### F 组 · 测试（9 个文件）
`client-aa-settings.spec.ts`（整个文件删）、`profile.spec.ts`（34 处，重灾）、`package.spec.ts`（12）、`setup-wizard-native-ui.spec.ts`（8）、`setup-wizard-window.spec.ts`、`profile-preferences.spec.ts`、`safe-mode.spec.ts`、`host-process-integration.spec.ts`、`verify-packaged-runtime.spec.ts`

### G 组 · 收尾
- 你机器上 `data\agents-anywhere\`（现存的 AA 数据）要不要清
- 剥离后 AA 的日志会去 `C:\Users\50667\.agentsanywhere\dsh-bridge-next\logs`（它自己的默认值，与 Desktop 无关）—— 这是**原本就如此**，不是新问题

---

## 五、风险与不确定（不隐瞒）

| # | 风险 / 不确定 | 程度 | 处理 |
|---|---|---|---|
| 1 | **CLI 装本地 tgz 未实测** | 🔴 高 | §二 前置验证，不过就改方案 |
| 2 | 向导步骤机可能有连锁改动 | 🟡 中 | 动 C 组前先读代码确认 |
| 3 | 旧 `state.json` 多出的 `aaEnabled` 键会不会被拒 | 🟡 中 | 实测（校验逻辑若是白名单则会报错） |
| 4 | pnpm 装 AA 时 peers 会不会额外拉包 | 🟡 中 | 前置验证时观察 |
| 5 | 剥离后 app 里**再也不会有**「手机连接」入口（除非装插件） | 🟢 低（预期行为） | 无 |
| 6 | `dsh-plugin-desktop` 若将来想吸收社区某处改动，这层 diff 要重新对齐 | 🟢 低 | 我们的方针是不追社区升级；真到那天再说 |

---

## 六、执行顺序（每步可停，可回退）

```
第 0 步  前置验证：临时 profile 里 CLI 装 AA → 起 → 卸          ← 【现在等你点头】
第 1 步  决策 1/2/3 定案 → 把 tgz 安置到最终位置
第 2 步  动 A + B 两组（核心逻辑 + 偏好），跑 desktop 测试
第 3 步  动 C + D 两组（向导 + 设置页文案），跑测试
第 4 步  动 E + F 两组（打包脚本 + 测试），跑全量测试 + 类型检查
第 5 步  清 G 组残留
第 6 步  报告 → 等 N90 统一打包时验收
```

---

## 七、验证方案（怎么算做对了）

| 层 | 验证 | 判据 |
|---|---|---|
| 单元 | `dsh-plugin-desktop` 全量测试 | 全绿（AA 相关用例已删；其余不回归） |
| 类型 | `tsc` 三个 tsconfig | 全部 exit 0 |
| 静态 | 全仓 grep `agents-anywhere` / `aaEnabled` | 除文档外**零残留** |
| 安装包 | `dist:win` 后查 `app.asar` | **无** `@agents-anywhere` 条目；`verify-packaged-runtime` 通过 |
| 功能（N90 一起做） | 装 AA 插件 → 侧边栏出现「手机连接」→ 卸载 → 干净 | 全通过 |
| 回归 | 不带 AA 启动 app | 正常启动、设置页无「手机连接」、向导少一步 |

---

## 附：与旧记录的差异（已更正）

旧文档 `plugin-extraction-and-uninstall.md` 里有两处已作废：
1. 「方案 A 每次追社区版都要重做这层 diff」→ **作废**（我们不追社区升级，`dsh-plugin-desktop` 是我们自己的源码 → 一次性改动）
2. 「AA 约 1.1 MB unpacked + Python connector」→ **实测 1.7 MB，不含独立 Python 运行时**
