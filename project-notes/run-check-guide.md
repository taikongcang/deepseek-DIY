# 手动跑 yarn check（拿完整红名单）

> ## 📍 工作副本位置（2026-09-14 已搬迁）
>
> 工作副本现在是 **`I:\dsh-913`** —— **纯 ASCII 的真实目录**（不再是 junction）。
> 原目录 `I:\deepseekharness9-13\9-13deepseekharness最新更新修改` 保留作**备份**，不再使用。
>
> **为什么必须搬到纯 ASCII 路径**：路径含中文时，yarn 执行 script 去启动 `node_modules/.bin` 下的可执行文件
> （tsdown / tsc / vitest …）会把路径弄坏（反斜杠被吞 + UTF-8↔GBK 往返），报
> `Cannot find module 'I:\...<乱码>\node_modules\...\run.mjs'`。
> 触发条件是**脚本内部的嵌套 `yarn run`** —— 它会把 cwd 解析回真实中文路径，之后 `.bin` 就坏了。
> 搬迁后 realpath 解析出来仍是 `I:\dsh-913`（ASCII），问题从根上消失。
>
> **⚠️ 一条经验（看日志时别忘了）**：日志里出现中文乱码**不一定代表失败** ——
> PowerShell 把 Node 的 UTF-8 输出按 GBK 读也会显示乱码（`鏈€鏂版洿鏂颁慨鏀` 这种），
> 那种情况下程序本身是正常的。**只以「命令是否真的失败」为准。**

---

## 0. 前置（每条命令窗口都要设一次）

```powershell
cd I:\dsh-913

# npm 镜像
$env:YARN_NPM_REGISTRY_SERVER = "https://registry.npmmirror.com"

# electron 二进制镜像（test 需要；和 builder 那个是两回事）
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"

node -v      # 期望 v24.x
yarn -v      # 期望 4.18.0
```

---

## 1. 装依赖

```powershell
New-Item -ItemType Directory -Force -Path .\_logs | Out-Null
yarn install 2>&1 | Tee-Object .\_logs\01-install.log
```

**会应用我们新增的 3 个补丁** → 补丁有问题这里就报错。Yarn 走**全局缓存**，应该很快。

---

## 2. Electron 二进制（desktop 的 test 需要）

项目 `.yarnrc.yml` 设了 `enableScripts: false` → **所有 postinstall 都不跑** → Electron 二进制从来没下载过。
测试的 setup 会去 `require('electron')`，没有就现场下载（国内直连 GitHub 会 `fetch failed`）。所以**先手动装**：

```powershell
cd I:\dsh-913\dsh-plugin-desktop
node node_modules\electron\install.js
cd I:\dsh-913
```

---

## 3. 分步跑检查（**关键：逐条跑，不要用 `yarn check`**）

```powershell
# ---------- 根层结构检查 ----------
yarn check:layout   2>&1 | Tee-Object .\_logs\02-layout.log
#  ↑ 需要 deepseek-harness submodule 的内容，submodule 还没拉就先跳过

# ---------- 市场包（我们改过 5 个文件）----------
yarn workspace dsh-community-market check    2>&1 | Tee-Object .\_logs\03-market.log

# ---------- fabric 包 ----------
yarn workspace dsh-community-fabric check    2>&1 | Tee-Object .\_logs\04-fabric.log

# ---------- desktop 包（必须拆开：它是 11 步 && 串联）----------
yarn workspace dsh-plugin-desktop build      2>&1 | Tee-Object .\_logs\10-desktop-build.log
yarn workspace dsh-plugin-desktop typecheck  2>&1 | Tee-Object .\_logs\11-desktop-typecheck.log
yarn workspace dsh-plugin-desktop test       2>&1 | Tee-Object .\_logs\12-desktop-test.log
```

> 若某条仍报 `Cannot find module '...<乱码>...'`（说明还有路径问题残留），改成**进子包再跑**：
> `cd I:\dsh-913\dsh-community-market` → `yarn check`。

**说明**

- `build` 会生成图标 + 编译产物（`lib\`、`dist\`）—— 都 **gitignored**，**不会动源码改动**
- `test`（`vitest run`）是**红名单的主要来源**
- 后面还有 7 个 `verify:*`，**先不跑**

---

## 4. 把日志发我

| 文件 | 看什么 |
|---|---|
| `03-market.log` | 市场包（我们改过 5 个文件） |
| `04-fabric.log` | fabric 包 |
| `10-desktop-build.log` | 编译是否通过（我们改过 38 个文件） |
| `11-desktop-typecheck.log` | **类型错误** |
| `12-desktop-test.log` | **测试红名单** |

---

## 5. 已经验过的（2026-09-14，别重复跑）

| 检查项 | 结果 |
|---|---|
| `dsh-community-market` 的 `test` | ✅ **264 / 264 全绿** |
| `dsh-community-fabric` 的 `check` | ✅ 通过 |
| `dsh-plugin-desktop` 的 `build` | ✅ 通过 |
| `dsh-plugin-desktop` 的 `typecheck` | ✅ 通过（**零类型错误** —— 我们改的 38 个文件没问题） |
| `dsh-plugin-desktop` 的 `test` | ⏳ 卡在 Electron 二进制（见第 2 节） |

---

## 6. 预期会红的地方（不必惊讶）

| 位置 | 原因 |
|---|---|
| `tests/terminal.spec.ts` | 托盘文案已改成 `Open R9` |
| `tests/updates.spec.ts`（约 10 处） | 托盘 / 通知文案改成 `deepseek harness …` |
| `tests/notifications.spec.ts`（4 处） | 同上 |
| `tests/startup-recovery-window.spec.ts`（3 处） | 恢复提示文案 |
| `tests/profile-selection-window.spec.ts`（2 处） | 重启提示文案 |
| `tests/recovery-native-ui.spec.ts`（1 处） | 恢复页 R9 文本 |
| `dsh-plugin-desktop/scripts/`（约 30 处） | 旧名漏网 —— 属**第 1 项补遗**，待你点头才改 |

---

## 7. 跑完先别动手

拿到日志后**不要自己改任何东西**。把日志发我 —— 我按红名单出修补方案给你审，**审完再动**。
