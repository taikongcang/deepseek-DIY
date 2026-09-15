# Privacy Notice

[中文](PRIVACY.zh.md)

**This is a personal, self-used build. It is not distributed and does not operate any online service.** There is therefore no "service provider collecting your data" here — everything stays on your own machine.

## Where data lives

Portable mode: `<install dir>\data\` (this is `DSH_HOME`).

| Content | Location |
|---|---|
| Profiles and settings | `data\profiles\<profile>\` |
| Session records | Under `<DSH_HOME>` (exact root depends on the profile's persistence configuration) |
| Credentials | `data\profiles\<profile>\.credentials.yaml` |
| Logs | `data\desktop\logs\` |
| Diagnostic archives | Created locally only when you export them; never uploaded automatically |

## When the application talks to the network

| Case | Target | What is sent |
|---|---|---|
| Model calls | The DeepSeek or compatible `baseURL` you configure | Prompts, responses, session ID, API key |
| Plugin market catalog | The market source you select (DSH 1024Store / dshfind / a standard source) | IP, time, a fixed Market User-Agent, and the requested catalog resource |
| Plugin install | npm (npmmirror / registry.npmjs.org) | Package name and version |
| Version check | **The local update source** (`file:///I:/deepseekharness更新DIY/发布/version.json`) | Nothing — no installation UUID, no version header |
| Phone connection (Agents Anywhere, optional) | Its own cloud or your self-hosted instance | Determined by that plugin |

## What we changed relative to upstream

- The version check reads a **local file**; it sends **no installation UUID** and **no version header**.
- Portable mode keeps data next to the installation, so deleting the install directory removes all of it.

## What this build does not do

No telemetry, no automatic diagnostic upload, no third-party analytics, no built-in remote push service.

## Credentials

API keys and other credentials are stored in the profile directory on this machine. Keep that directory out of version control; the repository's `.gitignore` already excludes it.
