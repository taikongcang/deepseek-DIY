# 贡献与改动指南（自用版）

> **这是自用版，AI 只读这一份。**
> 通用开源项目的完整贡献指南（**仅供人参考学习**）在 [`docs/contributing-full-reference.md`](docs/contributing-full-reference.md) —— **AI 不要读那份**。

本仓库是**个人自用的定制分支**，没有外部贡献者。这份文档只服务两类读者：**你（Z）** 和 **AI 助手**。内容只有两件事：**怎么干活**、**怎么别把东西搞坏**。

## 一、开工前

1. **工作副本必须在纯 ASCII 路径**（当前 `I:\dsh-913`）。含中文的路径会让 Yarn 执行 `package.json` 脚本时破坏路径，报 `Cannot find module '<乱码>\…'`。
2. `yarn install` 装依赖（可离线执行）。若要跑测试，确认 Electron 二进制在：`dsh-plugin-desktop\node_modules\electron\dist\electron.exe`。
3. 摸不清某块代码为什么这么写时，先读 **`AGENTS.md`**（仓库规则，**唯一权威**）。

## 二、改动规矩

| 想改什么 | 怎么改 |
|---|---|
| 桌面外壳（标题栏、托盘、终端、设置页、更新、Profile、打包脚本） | 直接改 `dsh-plugin-desktop/src` 或 `dsh-plugin-desktop/scripts` —— **有源码，直接改源码** |
| 市场（市场壳、插件安装/卸载、目录源） | 直接改 `dsh-community-market/src` |
| 官方内核的行为（265 个包） | **只能叠补丁**：`patches/<包名>@<内核版本>.patch`，并在根 `package.json` 的 `resolutions` 里以 `patch:` 引用 |
| 第三方 npm 包 | 同上，叠补丁 |

**不要做的事**

- ❌ 不要编辑 `vendor/` 里的 tgz（那是成品；要改就叠补丁）
- ❌ 不要初始化 `deepseek-harness` submodule（已决定不拉）
- ❌ 不做"顺手优化"：只改必要的部分
- ❌ 不改 `patches/` 里补丁文件名中的版本号（除非确实更换了内核版本）

## 三、改完必须做的验证

```sh
yarn typecheck     # 类型检查（必须通过）
yarn test          # 单元测试
yarn build         # 构建
```

**如果改到了产品标识或文案**（产品名、终端名、标题等），注意两件事：
1. 源码里的文案有**多处落点**（`desktop-settings-locales` / `native-dialog-copy` / `tray-locale` / `recovery-copy` / `setup-wizard-copy` / 市场 `locales`），要一起改。
2. **测试里写死的期望值要跟着改** —— 否则测试会红。这不是"测试坏了"，是"期望值过期了"。

**改双语文档**（`README.md` / `PRIVACY.md` 这类成对文件）：

1. 两侧都改；
2. 重算哈希并写进对应的 `X.i18n.yaml`：
   ```powershell
   git hash-object --path=README.md README.md
   ```
   ⚠️ **必须带 `--path=`** —— `.gitattributes` 有 `* text=auto eol=lf`，不带就因换行规范化而对不上；
3. 跑 `yarn check:bilingual-docs` 确认。

## 四、打包

```powershell
# 推荐：双击 I:\deepseekharness更新DIY\工具\build-win.cmd（已设好 pinned + 镜像）
# 手工等价：
cd I:\dsh-913
$env:DSH_AA_SOURCE_REF = "pinned"
yarn dist:win
```

- ⛔ 不用 `yarn package:dir`（Windows 上游缺陷）。
- 打包前让 Windows Defender 排除工作副本目录。

## 五、踩过的坑（别再踩）

| 坑 | 现象 | 对策 |
|---|---|---|
| 中文路径 | `Cannot find module '<乱码>\…'` | 工作副本放纯 ASCII 路径 |
| 不设 `DSH_AA_SOURCE_REF=pinned` | 打包时联网拉上游 Agents-Anywhere，并**改写仓库**（vendor/ + package.json + yarn.lock） | 打包前**必设** |
| 用 `yarn package:dir` | 打包后校验钩子报 `cannot determine requested Electron architecture(s)` | 用 `dist:win` |
| 脚本用 `git ls-files` 找文件 | 删了目录却报 `ENOENT`（文件系统已删、git 索引还在） | `git add -A -- <路径>` 把删除登记进索引 |
| `X.i18n.yaml` 哈希不同步 | `check:bilingual-docs` 报哈希不一致 | 用 `git hash-object --path=` 重算 |
| PowerShell 读 UTF-8 中文显示乱码 | 看着像文件坏了 | **别把显示乱码当文件损坏**，用 Read 工具核对 |
| `Set-Content` 写 JSON | 写入 BOM → `JSON.parse` 失败 | 用 `[System.IO.File]::WriteAllText`（不加 BOM） |

## 六、发版

见 `README.md` 的「版本号」与「更新源」两节，以及 [`UPSTREAM-ALIGNMENT.md`](UPSTREAM-ALIGNMENT.md)。
