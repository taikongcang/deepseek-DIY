# 清理方案（2026-09-15）

> 目的：把 `deepseekharness` 项目中**确定过时/可删**的东西分批清掉，回收空间、消除混淆。
> 原则：**小批量、每批先列清单、要确认、优先回收站（可还原）**。
> 总可回收：约 **5.9 GB**（不含"需立项"的项）。

## 批次总表

| 批 | 内容 | 体积 | 方式 | 状态 |
|---|---|---|---|---|
| **1** | AI 临时探测文件（61 个）+ 纯空目录（9 个 / 约 1883 个空子目录） | ~0.4 MB | 回收站 | ✅ **已完成并复核**（剩余 0/9、0/61） |
| **2** | `.workbuddy` 里 **42 个一次性产物** | ~2.5 MB | **移动到 `.workbuddy\_archive\`**（非破坏） | ✅ **已完成**（42/42） |
| **3** | 最早手搓原型：`制作\dist` + `制作\node_modules` + 散件 | **~1.4 GB** | 回收站 | ✅ **已完成**（16/16） |
| **4** | `I:\dsh-desktop` + 旧工作副本 | **~4.5 GB** | 回收站 | ✅ **已完成**（2/2） |
| **5** | 工作副本内可再生项：`dsh-plugin-desktop\dist`(710MB) + 孤儿 tgz + `beta\node_modules`(620MB) | **~1.3 GB** | 回收站 | ✅ **已完成**（3/3） |
| **6** | `I:\deepseekharness` 野目录 | **0 MB**（只有一个空的 `AI股票` 目录） | — | ⏳ **只报告，待你确认** |
| **7** | 2026-09-15 查证 UI 归属时我在 `I:\` 根留下的探测文件 | 小 | 回收站（或先归档） | ◐ **部分完成**：6 个已删（见下），剩 **14 个**待清 |

**批 7 明细**：`_q1_old.txt` `_q1b.txt` `_q1c.txt` `_q2_history.txt` `_q3_aa.txt` `_q3_aa2.txt` `_q4.txt` `_q5.txt` `_q5b.txt` `_rb.txt` `_arch.txt` `_tail.txt` `_core_loc.txt` `_verify_after_clean.txt`（**14 个**，待清）
> - ✅ 2026-09-15 11:3x：按用户要求已删 `_old_titlebar.txt` / `_old_extstyles.txt`（v2.0.4 旧版源码副本）+ 我新产生的 `_ins1..4.txt`。⚠️ **这 6 个是永久删除、没进回收站**（沙箱回收站接口被禁，safe-delete 报 `trash-failed` 但文件已移除；回收站搜索 0 命中）。**内容零损失**：那 2 份旧版源码随时可用 `git show v2.0.4:<路径>` 重新导出。

**执行结果（2026-09-15 10:2x，用户跑脚本）**：全部批次成功，**无一条 ERR**。

## 🟡 重要：空间还没真正释放

删掉的东西**都进了回收站**，所以回收站里压着 **7.03 GB（I 盘）**。

| 指标 | 数值 |
|---|---|
| `I:\` 可用空间（清理后实测） | **484.7 GB** |
| `I:\` 可用空间（9-14 22:00 测） | 487.8 GB |
| `I:\$RECYCLE.BIN` 占用 | **7.03 GB** |

→ 看起来"可用空间没变多"，是因为**回收站占着**。**要真正拿回约 7 GB，需要清空回收站。**
**建议**：先确认几天没问题（或至少确认不需要还原），再清空。

## ⚠️ 连带影响（下一步动手前必做）

`dsh-plugin-desktop-beta\node_modules` 被删 → **下次改完代码、打包之前，先跑一次 `yarn install`**。
- 这是**离线**的（包都在本地 Yarn 缓存 758 MB 里）；
- 目的是恢复 Yarn 的一致性状态；
- 只是多花几分钟，**不需要联网**。

## 批 2 明细 —— 保留 vs 归档

**保留（9 个权威文件 + 6 个目录，不动）**

| 文件 | 作用 |
|---|---|
| `redolist.html` | **唯一权威需求清单（38 项）** |
| `plan-01-rename.html` / `plan-b-fix.html` | 施工/修补方案 |
| `run-check-guide.md` / `run-package-guide.md` | 验证指引 / 打包指引 |
| `directory-map.md` | 目录现状与用途（含本方案的上级文档） |
| `scripts-rename-audit.mjs` | 改名审计工具（被记忆与清单引用） |
| `item01-supplement-audit.html` | 第 1 项补遗审计报告（证据） |
| `plugin-index.txt` | 官方插件一行用途索引（产出，可复用） |
| `功能盘点清单.md` | 需求来源 |
| 目录：`memory\` `backups\` `pics\` `awesome-catalog\` `tmp-conn\` `tmp-homepaths\` | 记忆/备份/资料，**本轮不动** |

**归档（42 个，移到 `.workbuddy\_archive\`）**

- 命令行探测：`commands-found.txt` `commands-found2.txt` `find-commands.mjs` `find-commands2.mjs`
- 性能抽样：`cpu_delta.txt` `yarn_cpu.txt` `yarn_cpu2.txt` `yarn_cpu3.txt`
- 各项施工的 diff/verify 记录：`item02-diff.txt` `item03-diff.txt` `item05-diff.txt` `item30-diff.txt` `item32-verify.txt` `item33-diff.txt` `item33-verify.txt`
- 改名审计：`rename-audit-full.txt` `rename-audit.mjs` `rename-apply.mjs` `rename-tests.mjs`
- 各类一次性脚本：`dump-diff.mjs` `extract-css.mjs` `locale-gap.mjs` `scan-persona.mjs` `simulate-variant-check.mjs` `url-check.mjs` `verify-item32.mjs` `verify-item33.mjs` `probe-local-update-fetch.js`
- 状态快照：`git-diff-stat.txt` `gitstate.txt` `sac_state.txt` `session_check.txt` `tmp_env_check.txt` `launch_done.txt` `exclusion_list.txt` `variant-drift.txt` `persona-scan.txt` `sidebar-css.txt` `pkgdiff.txt`
- **过时副本**：`requirements.html`（已全量并入 `redolist.html`）
- 过期快照：`ourdiff.txt`（2.2 MB）
- 旧报告：`update-report.html`

## 为什么批 3/4 我建议"直接回收站"、不做 zip 归档

1. **回收站本身就是一层安全网** —— 只要没清空，随时可还原。再套一层 zip 是重复保险。
2. 两个旧代码副本**内容都能重建**：社区版原样 clone 还在（`9-13DSH-desktop最新更新一套`），我方改动沉淀在 `patches\`（21 个）+ `I:\dsh-913`。
3. zip 压缩 4.5 GB 的 `node_modules`（十几万小文件）**又慢又占地方**，收益很低。
4. ⚠️ **一个风险如实说**：若回收站容量不足，Windows 会弹窗问"是否永久删除" —— **那时你可以取消**，改成分批或先归档。

## 不在本次清理范围

- **`E:\app\deepseekharness`（616 MB）** —— 这是**现行 2.0.9 安装**（含 `data\` 真实数据），**绝不能删**。
- `9-13DSH-desktop最新更新一套`（267 MB）—— 社区版只读参照。
- `I:\deepseek-harness\`（113 MB，含 `.dsh` / `插件` / 其他项目）。
- `I:\deepseekharness更新DIY\`（129 MB，更新源）。
- I 盘上**你其他项目**的目录（`AI股票`、`codex`、`workbuddy*`、`股票面板制作`、`量化制作和工作流程`、`Python学习`、`AI-ashare-review`、`tmp`、`.pnpm-store`）—— **不是本项目的，我一律不动**。

## 怎么执行

批 2–5 已写成一个脚本（**每批独立打印清单 + 独立确认**）：

```powershell
powershell -ExecutionPolicy Bypass -File "I:\deepseekharness更新DIY\工具\cleanup-batch2-5.ps1"
```

- 脚本会**逐批**列出完整路径与体积，然后问 `Y`；输入 `Y` 才执行，其它键跳过该批。
- 全部走**回收站**；批 2 是**移动到 `.workbuddy\_archive\`**（不删）。
- 格式已加固：UTF-8 带 BOM（防 PS 5.1 把中文路径按 ANSI 读坏）+ 语法检查 0 错误。
- 已核实：保留的 `scripts-rename-audit.mjs` 只 import `node:fs` / `node:path`，**删掉 `制作\node_modules` 不会让它失效**。

## 待你决定的一件事

批 4 的两个旧代码副本（4.5 GB）：**直接回收站删除**（我的建议）还是**先 zip 归档再删**？
脚本里只做了"回收站删除 / 跳过"两个选项 —— 若你想要 zip 归档，先告诉我，我另给一个归档脚本。
