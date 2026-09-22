# PyInstaller 打包 vs Windows SAC 拦截 —— 对照实验记录

> 起因：用户 2026-09-22 提出「安装 pyinstaller，用 `pyinstaller --onefile --windowed --name="QMT自动交易" gui_app_integrated.py` 打包，**这种打包方法好像就不会被 Windows 阻拦**」。
> 关联：清单 **N12**（SAC 阻断未签名 exe）／ `tech-notes.md` §五 坑 #9。
> 实验时间：**2026-09-22 22:30–22:45**，实验机 = 本机（SAC 处于**强制模式**）。

---

## 〇、实验前置状态（先确认环境没变）

| 项 | 值 |
|---|---|
| SAC 状态 | `VerifiedAndReputablePolicyState` = **1（强制）** —— **与 09-21 报障时完全一致，用户没关** |
| 09-22 22:25 之后的 CodeIntegrity 事件 | **0 条**（实验前干净） |
| 我们的 `deepseekharness.exe` | `NotSigned`；`LastWriteTime` = 2026/9/15 0:28:10 |

---

## 一、实验步骤与结果

### 准备
- 隔离环境：`C:\Users\50667\.workbuddy\binaries\python\envs\default`（venv，Python 3.13.14）
- 安装：`pip install -U pyinstaller` → **PyInstaller 6.22.3**（**注意：PyPI 默认源与清华源都装不上，走阿里云镜像 `https://mirrors.aliyun.com/pypi/simple/` 才成功**）
- 实验目录：`.workbuddy/_probe/pysac-test/`

### 实验 1 —— 严格按用户给的命令打包
```
pyinstaller --onefile --windowed --name="QMT自动交易" gui_app_integrated.py
```
| 项 | 结果 |
|---|---|
| 是否成功 | ✅ 成功，产物 `dist\QMT自动交易.exe` = **7,429,044 字节** |
| 签名 | ❌ **NotSigned**（与我们的 deepseekharness.exe **完全一样**） |
| **能否运行** | ✅ **能**。启动后抛 `ModuleNotFoundError: No module named 'tkinter'`（这个 venv 的 Python 没编 tkinter）—— **关键：这条 traceback 证明 PyInstaller 的引导程序已经解包并执行了 Python 代码**，即**进程确实被创建并运行了** |
| CodeIntegrity 拦截事件 | **0 条**（全日志搜 `QMT` / `pysac-test` 命中 **0**） |

### 实验 2 —— 体积对照：加到 207 MB（≈ 我们被拦那个的 215 MB）
用 `--add-data` 塞进 200 MB 随机数据（避免被压缩），产物 = **217,208,691 字节 ≈ 207 MB**。
| 项 | 结果 |
|---|---|
| 签名 | ❌ NotSigned |
| **能否运行** | ✅ **能**（同样跑到 Python，报 tkinter 缺失） |
| 拦截事件 | **0 条** |

⇒ **体积不是原因**（7 MB 与 207 MB 都通过）。

### 实验 3 —— 决定性实验：纯控制台包，看完整输出与退出码
换成不依赖 tkinter 的脚本（打印 `STAGE-1/2/3` 再退出），`--onefile` 控制台模式：
```
STAGE-1: python started, argv= ['I:\\...\\dist\\ConsoleProbe.exe']
STAGE-2: frozen = True
STAGE-3: completed normally
EXIT=0
```
✅ **完整跑完，退出码 0。**

### 实验 4 —— 位置对照：挪到和"被拦那个"同一目录
| 位置 | 结果 |
|---|---|
| 原地（`I:\...\_probe\pysac-test\dist\`） | ✅ EXIT=0 |
| `E:\app\_sac_probe.exe` | ✅ EXIT=0 |
| **`E:\app\deepseekharness\_sac_probe2.exe`（紧挨着被拦的 exe）** | ✅ **EXIT=0** |

⇒ **位置/目录不是原因**。（探针副本已清理）

### 实验 5 —— 反向对照（**结论不确定，如实记录**）
从命令行启动我们自己的 `E:\app\deepseekharness\deepseekharness.exe`（2026-09-22 22:38:58）：
- CodeIntegrity 日志 **没有**新增拦截事件；
- **但** `data\desktop\logs\` **也没有任何新日志** ⇒ **它根本没真正跑起来**。
- ⇒ **本次对照无效**：既不能证明"SAC 放行了它"，也不能证明"被拦了"。**启动方式（双击 vs 命令行）是否影响判定，我没有结论。**

---

## 二、结论

### ✅ 可以确认的（有实测支撑）
1. **PyInstaller 产物是未签名的**（`NotSigned`）—— **它不做代码签名**。连它自带的引导壳 `runw.exe` 也是未签名。
2. **但在本机当前的 SAC 强制模式下，未签名的 PyInstaller 产物可以正常运行** —— 4 种情况（7 MB 窗口 / 207 MB 窗口 / 7 MB 控制台 / 换 3 个位置）**全部通过，零拦截事件**。
3. ⇒ **用户"这种做法不会被 Windows 拦"的说法，在我这次实测里成立**（样本 3 个构建、4 种运行场景）。

### ⚠️ 我不能确认的（不编）
1. **机制完全不清楚** —— **为什么**我们的 Electron exe 被拦、PyInstaller 产物不被拦，**我查不到权威解释**。可猜的方向（**均未证实**）：SAC 的云信誉模型对"标准 PyInstaller 引导器结构"与"被改造过的 Electron 二进制"给出了不同判定。**不当作结论。**
2. **样本量小** —— 只有 PyInstaller 这一种打包器、只有本机、只有这次；**不代表所有机器、所有版本都这样**。
3. **实验 5 无效**，启动方式的影响未知。

### 🔴 最关键的一条：这个方法**对 deepseekharness 不适用**
**PyInstaller 只能打包 Python 程序** —— 它的原理是把 **Python 解释器 + 你的 .py + 依赖库** 塞进一个自解压 exe。
**我们的 `deepseekharness` 是 Electron / Node 应用，不是 Python 程序 ⇒ 用不了 PyInstaller。**

| 目标 | 能否用 PyInstaller |
|---|---|
| 用户的 `gui_app_integrated.py`（QMT 自动交易，Python） | ✅ **可以** |
| `deepseekharness`（Electron 桌面版） | ❌ **不可以**（要用 electron-builder，而它就是产出未签名 exe 的那个） |

⇒ **这条路解决不了 N12 的痛点**，但它**是另一个项目（QMT）的可行打包方案**。

---

## 三、PyInstaller 打包方法是什么（大白话）

`pyinstaller --onefile --windowed --name="QMT自动交易" gui_app_integrated.py` 逐段拆开：

| 参数 | 干什么（大白话） |
|---|---|
| `pyinstaller` | 打包工具本体 |
| `--onefile` | **打成"一个 exe 文件"**。它会把 Python 解释器、你的脚本、用到的库全塞进这一个 exe 里；**运行时先解压到系统临时目录再启动** ⇒ 代价是**启动慢**（几百 MB 的包每次启动都要解压一次） |
| `--windowed`（= `--noconsole`） | **不弹黑色命令行窗口**（适合 GUI 程序）。代价：**程序出错时看不到报错**，只能写日志文件 |
| `--name="QMT自动交易"` | 产物名字。**中文名可以**，但要注意某些脚本/工具对中文路径处理不好 |
| `gui_app_integrated.py` | 入口脚本 |

**它不做的事**：❌ **不签名**、❌ 不做安装程序、❌ 不处理依赖冲突。

**对比：Electron 那套（我们用的）**
`electron-builder` → NSIS 安装包 + 未签名 exe。两边**都产未签名 exe**，区别只在"文件长什么样"，而 SAC 似乎就是按"文件长什么样"给的判定。

---

## 四、如果要给 QMT 那个程序打包，我的建议

1. **先按原命令打一个，然后双击实测** —— 别只信"应该不会被拦"。
2. **留一份"能跑"的证据**：打完在 CodeIntegrity 日志里确认**没有**新拦截事件（判据见下）。
3. **`--onefile` 的启动慢是真的**；如果 QMT 程序大、要求启动快，改用 `--onedir`（打成文件夹）—— 但它就**不再是一个 exe 文件**了，分发要整个文件夹。
4. **`--windowed` 出错看不到报错** —— 建议**开发期先用控制台模式**（不加 `--windowed`），跑通了再加。
5. **如果哪天也被拦了**，说明这条路不是"永远免疫" —— 那就回到 N12 的两个方案（关 SAC / 买证书签名）。

### 怎么自己验证"有没有被拦"（可复现步骤）
用**管理员** PowerShell 跑：
```powershell
Get-WinEvent -LogName 'Microsoft-Windows-CodeIntegrity/Operational' -MaxEvents 40 |
  Where-Object { $_.Id -in 3033,3077,3118 } |
  Select-Object TimeCreated, Id, Message -First 10 | Format-List
```
- **输出为空 / 没有你那个 exe 的路径** = 没被拦 ✅
- **出现你的 exe 路径 + `Policy ID:{0283ac0f-…}`** = 被 SAC 拦了 ❌

---

## 五、可复现材料（已保留在 `.workbuddy/_probe/pysac-test/`）

| 文件 | 说明 |
|---|---|
| `gui_app_integrated.py` | 窗口版测试脚本（用了 tkinter） |
| `console_probe.py` | 控制台版测试脚本（实验 3/4 用的，无 tkinter 依赖） |
| `ConsoleProbe.spec` | PyInstaller 生成的构建配置 |
| `dist/ConsoleProbe.exe` | **实测通过的那个产物**（7.4 MB，未签名）—— 你可以直接双击试试看会不会被拦 |

（207 MB 的载荷与大体积产物是临时对照物，**已删除**，目录从 217 MB 压回 7.1 MB。）
