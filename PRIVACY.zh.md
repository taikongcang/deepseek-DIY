# 隐私说明

[English](PRIVACY.md)

**这是个人自用版本，不对外分发、不运营任何在线服务。** 因此不存在"服务提供方收集你的数据"这回事 —— 所有数据都在你自己的机器上。

## 数据存放在哪

便携模式：`<安装目录>\data\`（即 `DSH_HOME`）。

| 内容 | 位置 |
|---|---|
| Profile 与设置 | `data\profiles\<profile>\` |
| 会话记录 | `<DSH_HOME>` 下（具体根目录取决于该 profile 的持久化配置） |
| 凭据 | `data\profiles\<profile>\.credentials.yaml` |
| 日志 | `data\desktop\logs\` |
| 诊断包 | 只在你主动导出时本地生成，不会自动上传 |

## 会主动联网的情形

| 情形 | 目标 | 发送什么 |
|---|---|---|
| 模型调用 | 你配置的 DeepSeek 或兼容 `baseURL` | 提示词、回复、会话 ID、API Key |
| 插件市场目录 | 你选的市场源（DSH 1024Store / dshfind / 标准源） | IP、时间、固定的 Market User-Agent、请求的目录资源 |
| 插件安装 | npm（npmmirror / registry.npmjs.org） | 包名与版本 |
| 版本检查 | **本机更新源**（`file:///I:/deepseekharness更新DIY/发布/version.json`） | 不发送任何内容 —— 无安装 UUID、无版本头 |
| 手机连接（Agents Anywhere，可选） | 它自己的云端或你自建的实例 | 由该插件决定 |

## 相对上游我们改了什么

- 版本检查改为读**本机文件**，**不发安装 UUID、不发版本头**。
- 便携模式让数据跟随安装目录 —— 删掉安装目录，数据就一起带走了。

## 这个版本不做的事

不做遥测、不自动上传诊断、不接第三方分析、不内置任何远程推送服务。

## 凭据

API Key 等凭据保存在本机 profile 目录中。不要把该目录纳入版本控制；仓库的 `.gitignore` 已排除。
