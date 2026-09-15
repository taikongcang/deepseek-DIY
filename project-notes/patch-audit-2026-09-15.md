# 21 个补丁逐个审查（2026-09-15）

> 方法：逐篇读 `patches/*.patch` 的实际改动行（`+`/`-`），按「这个改动是干什么的 → 我们是否需要」定性。
> 判据口径：**这个补丁解决的是不是「官方包本身不含、而我们的用法必须有的东西」**。

## 结论速览

| 判定 | 数量 | 说明 |
|---|---|---|
| ✅ **必须保留** | **14** | 桌面版功能命脉 + Windows 打包命脉 + 我方自有需求 |
| 🔒 **现在必须留（ASAR 依赖）** | **4** | 都是为 ASAR 打包服务的；只要我们还用 ASAR 就得留（社区 2.0.10 关掉 ASAR 后它们会变得可省） |
| 🔶 **真正待你定** | **3** | 一个性能优化、一个改了官方 UI 观感、一个为旧插件做兼容 |

---

## 一、官方内核包补丁（13 个）

| # | 补丁 | 实际改了什么 | 判定 |
|---|---|---|---|
| 1 | `dsh@0.1.5-rc.1` | ① 给 `parseDshArgs` 加 `allowDesktopProfile` 开关，允许桌面版使用 `desktop` profile（绕过 `rejectElectronProfile`）② CLI 子进程 `windowsHide: true` | ✅ **必需** —— 桌面版靠它才能用 `desktop` profile |
| 2 | `dsh-agent-presets` | 检测全局符号 `dsh-plugin-desktop.asar-module-resolver`，命中时改用 `createRequire(base).resolve()` 判断插件是否存在（不触发求值） | 🔒 ASAR 依赖 |
| 3 | `dsh-app-boot` | 检测同一个 ASAR 符号；`healProfileModuleFallback` 增加 `installAnchor` 参数 + `isInstallationPackage` 判定 | 🔒 ASAR 依赖 |
| 4 | `dsh-client-modules` | 统计换行数：`for (const char of value)` 逐字符 → 改成 `indexOf("\n", offset+1)` 跳转 | 🔶 **待定**（纯性能优化，1 行；大字符串下更快，无行为变化） |
| 5 | `dsh-client-ui-directory-picker-browse` | 给官方目录浏览器加**原生文件夹选择器**（Windows）+ 目录校验钩子 + `browser.nativePicker` 文案；`browser.showHidden` 字号 | ✅ **必需** —— 桌面版"用 Windows 选择文件夹"按钮就靠它 |
| 6 | `dsh-client-ui-primitives` | 改 `MarkdownText.module.css`：宽表格的横向滚动条从「悬停/聚焦才出现」改成**常显 8px thin 滚动条**（含 `::-webkit-scrollbar-thumb` 配色） | 🔶 **待定** —— **这是改官方 UI 观感**，属审美取舍 |
| 7 | `dsh-client-ui-settings-general` | 给设置页新增「桌面」项的自绘图标 `IconDesktopSettings`（显示器形状 SVG） | ✅ **必需** —— 设置里"桌面"那一项的图标 |
| 8 | `dsh-host-directory-picker-browse` | Windows 的 reparse 点 / 系统目录可能 `stat` 失败 → 改成同时接受 `isDirectory || isSymbolicLink`，失败也不让父目录列表塌掉 | ✅ **必需** —— Windows 兼容 |
| 9 | `dsh-plugin-package-inventory-deepseek` | 检测同一个 ASAR 符号，改用 `createRequire(anchor).resolve(...)` 找包清单；只吞 `MODULE_NOT_FOUND` / `ERR_PACKAGE_PATH_NOT_EXPORTED` | 🔒 ASAR 依赖 |
| 10 | `dsh-settings` | 恢复 alpha.2 之前的**旧 API**：`settingsNamespace()`、`installSettingsSection()`、并再导出 `deepEqualJson`（全部标 `@deprecated`，内部转发到新实现） | 🔶 **待定** —— 为"alpha.2 之前构建的插件"做兼容；若我们只用自己的插件，可省 |
| 11 | `dsh-subprocess-local` | Windows runner 强制 `ELECTRON_RUN_AS_NODE=1`（先删掉同名变量再设，避免重复） | ✅ **必需** |
| 12 | `dsh-web-app` | 启动前清掉 `ELECTRON_RUN_AS_NODE`；子进程 `windowsHide: true` 并显式设 `ELECTRON_RUN_AS_NODE: "1"` | ✅ **必需** |
| 13 | `dsh-win32-process` | 创建进程 `dwFlags` 256 → 257、新增 `wShowWindow: 0`（**不弹控制台窗口**） | ✅ **必需** —— 否则 Windows 上会闪黑框 |

## 二、第三方包补丁（5 个）

| # | 补丁 | 实际改了什么 | 判定 |
|---|---|---|---|
| 14 | `app-builder-lib@26.15.7` | ① macOS 签名用独立 keychain 密码 ② NSIS 加 `ManifestLongPathAware true` ③ **NSIS 判定"程序是否在运行"从"路径前缀匹配"改成"文件名匹配"** ④ **NSIS 安装从"写临时目录再原子复制"改成"就地覆盖"**（提速）+ 卸载器返回码 2 容错 ⑤ 支持 `DSH_ELECTRON_BUILDER_TRAVERSAL_ONLY=1` 跳过包管理器探测 | ✅ **必需** —— ③ 是 `deepseekharness.exe` 改名后安装/卸载能认出进程的关键；④ 是我们的安装速度；⑤ 是离线打包的开关 |
| 15 | `fs-ext@2.1.1` | Electron 下改走 `prebuilds/<platform>-<arch>/electron.abi<modules>.node`；`install.js` 在非 Windows 才跑 node-gyp（Windows 跳过） | ✅ **必需** |
| 16 | `open@11.0.1` | 子进程 `windowsHide = true` | ✅ **必需** |
| 17 | `pnpm@11.8.0` | `minimumReleaseAge` 解析容错：`NaN`、`0` 都不再当成"有效阈值"（`Number(undefined)` 原本是 `NaN`，`>=1` 语义被误触发） | ✅ **必需** —— 安装/卸载插件走的 `pnpm add/remove --config.minimumReleaseAge=0` 依赖它 |
| 18 | `vscode-ripgrep@1.18.0` | 把解析到的 `rg` 路径从 `app.asar/...` 改写为 `app.asar.unpacked/...` | 🔒 ASAR 依赖 |

## 三、我方自有补丁（3 个）—— 全部保留

| # | 补丁 | 实际改了什么 | 判定 |
|---|---|---|---|
| 19 | `dsh-api-session-controller` | 新增 `diyTimestampedSessionId()`：会话目录名从 `session-<uuid>` 改为 `session-YYYY-MM-DD-HHMMSS-<8位随机>`（便于找到和删除） | ✅ 我方需求 |
| 20 | `dsh-session-persistence-jsonl` | ① 项目目录键**不再转义中文**（`isReadableProjectKeyChar`），CJK 直接可读 ② 保留 `legacyProjectKey()` 兼容旧目录，旧目录存在时优先用它 | ✅ 我方需求 |
| 21 | `dsh-client-ui-sidebar` | 侧边栏根节点 CSS `flex-direction`（两列布局） | ✅ 我方需求 |

---

## 四、已定 —— **三个都暂时保留**（用户 2026-09-15 16:0x 决定："暂时先保留着，以后我再考虑"）

> 结论：**全部留，不动。** 下面三条的取舍说明保留作日后参考。

### 6 · `dsh-client-ui-primitives`（改官方 UI 观感）

- **现状**：宽表格的横向滚动条**常显**（8px thin + 自定义配色）。
- **官方原样**：滚动条**悬停/键盘聚焦**才出现，且用 `padding-bottom` 预留高度避免跳动。
- **留**：表格多的时候一眼能看出"这表能横向滚"。
- **去**：完全跟随官方观感，但宽表格需要悬停才知道能横滚。
- **补充**：这条改的是官方包的 CSS，**换内核版本时要重新适配**（CSS Module 哈希会变）。
- **我倾向**：**留**（更好用），但这是你的审美决定。

### 10 · `dsh-settings`（为旧插件做的向后兼容）

- **现状**：把 alpha.2 之前被移除的三个 API 重新导出（`settingsNamespace` / `installSettingsSection` / `deepEqualJson`），全部标 `@deprecated`、内部转发到新实现。
- **留**：任何"按旧 API 写的第三方插件"能继续跑。
- **去**：少一处要跟内核版本适配的补丁；但若你以后装到老插件，会报"函数不存在"。
- **我倾向**：**留**（成本是一处补丁的维护，收益是插件兼容面更大）。

### 4 · `dsh-client-modules`（性能优化，1 行）

- **现状**：统计字符串换行数从"逐字符迭代"改成"`indexOf` 跳转"。
- **留/去都不影响功能**，只是大文本时更快（V8 下字符串迭代器有额外开销）。
- **我倾向**：**留**（零风险、无行为变化）。

### 🔒 关于 ASAR 四件套（2、3、9、18）

这 4 个补丁全部是**为 ASAR 打包服务的**（把 `app.asar` 内的路径重写、或用 Desktop 自己的 resolver 去解析）。

- **只要我们还用 ASAR**（`dsh-plugin-desktop/build` 配置里仍是 `"asar": {"smartUnpack": true}`），**就必须保留**。
- 社区 v2.0.10 把 ASAR 关掉了（`"asar": false`），那时这些补丁才可能变可省 —— 但**关 ASAR 是打包层的大变化**（产物结构、fuse 校验语义都变），不是"顺手"能做的事。
- **结论：现在全部保留，不动。**

---

## 五、审查中发现的 1 个附带事实

`dsh-client-ui-directory-picker-browse@0.1.5-rc.1.patch` 里新增的中文文案有一处**字符异常**（补丁里 `"browser.nativePicker": "使用 Windows 选择文件夹` 后面紧跟换行、引号不闭合的形态）：

```
+					"browser.nativePicker": "使用 Windows 选择文件夹
```

英文那条是完整的（`"Choose with Windows"`）。这**很可能是补丁文件本身的行尾/引号问题**，但因为该补丁此刻**能正常 apply**（安装已成功、功能可用），说明它没坏 —— 只是补丁文件在生成时把该行截断了（GitHub diff 尾部无换行符之类的常见现象）。
**结论：不用动**，但换内核版本重做这个补丁时要留意这一行。
