# deepseekharness

Our own desktop build of DeepSeek Harness: built on the **official DeepSeek Harness core**, reworked from the desktop shell of the community project **DSH Desktop**, with substantial custom changes of our own.

> **This is not the upstream repository of the community DSH Desktop project, and it does not follow that project's releases.**
> Community releases serve only as **reference intelligence** ("what changed upstream → what the community did in response"); only what we actually need is borrowed.

---

## 1. What this is

An Electron desktop application that wraps the DeepSeek Harness local Web UI, Host service, and plugin system in a native window.

- **Three presentation modes**: Compatibility / Enhanced / Extended (switch from the badge on the left of the title bar)
- **Desktop-side capabilities**: native window and tray, built-in terminal (R9), native directory picker, update check, multi-Profile switching
- **Plugin market**: a built-in market shell for discovering and installing plugins; plugins you install yourself can be uninstalled from the market
- **Phone connection** (optional): the Agents Anywhere bridge, exposed as a switch you can turn off
- **Portable mode**: all data follows the install directory (`<install dir>\data`), nothing is written elsewhere

## 2. Relationship to upstream (how we change things)

| Layer | Source | How we change it |
|---|---|---|
| Official core (265 packages) | DeepSeek's [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness), shipped as **prebuilt tgz** under `vendor/dsh-runtime/<version>/` | ❌ No source → **patch it** (`patches/`) |
| Third-party npm packages (`app-builder-lib` / `open` / `pnpm` / `fs-ext` / `vscode-ripgrep` / `dshmarket`) | npm | ❌ No source → **patch it** |
| Desktop shell (`dsh-plugin-desktop` / `dsh-community-market` / `dsh-community-fabric`) | Reworked from community DSH Desktop | ✅ Has source → **edit source directly** |

## 3. Build and run

**Prerequisites**: Node.js `^22.19.0` or `>=24.0.0`; Yarn `4.18.0` (via Corepack).

> ⚠️ **The working copy must live on a pure ASCII path** (currently `I:\dsh-913`). A path containing non-ASCII characters makes Yarn corrupt the path when it runs `package.json` scripts, failing with `Cannot find module '<mojibake>\…'`.

```sh
yarn install      # install dependencies (works offline)
yarn build        # build market + desktop
yarn typecheck    # type check
yarn test         # unit tests
yarn dev          # start in development mode
```

## 4. Packaging (Windows)

**Recommended: double-click `I:\deepseekharness更新DIY\工具\build-win.cmd`** (it sets `DSH_AA_SOURCE_REF=pinned` plus mirror fallbacks, then runs `yarn dist:win`).

Equivalent manual command:

```powershell
cd I:\dsh-913
$env:DSH_AA_SOURCE_REF = "pinned"   # required! otherwise it resolves upstream over the network and rewrites vendor/ and package.json
yarn dist:win
```

Artifact: `dsh-plugin-desktop\dist\deepseekharness-<version>-x64-Setup.exe`

⛔ **Do not use `yarn package:dir`** — on Windows, electron-builder never registers `--dir` as a target, so the post-package verification hook fails with `cannot determine requested Electron architecture(s) for win` (upstream defect).

Before packaging, add the working copy to Windows Defender exclusions (the last NSIS step runs a zero-reputation temporary exe, which real-time protection may block).

## 5. Versioning

**Own version sequence**, unrelated to the community project's version numbers. Currently `3.0.0`.

- Single source of truth: `version` in `dsh-plugin-desktop/package.json`
- A new version **must be greater than the last released one** (the client's update check compares version numbers)
- Each time we align with a community release or a new official core, **add a row** to **`UPSTREAM-ALIGNMENT.md`**

## 6. Update source

The client reads its version and installer from a local update source:

```
I:\deepseekharness更新DIY\发布\
  ├─ version.json                            ← {"version": "..."}
  └─ deepseekharness-<version>-x64-Setup.exe    ← copy the build artifact in; no renaming needed
```

Three steps to release: ① package → ② copy the installer into `发布\` → ③ bump the version in `version.json`.

## 7. Directory layout

| Path | Contents |
|---|---|
| `dsh-plugin-desktop/` | Desktop main package (Electron bootstrap, Host/Client faces, packaging and release tests) |
| `dsh-community-market/` | Plugin market shell |
| `dsh-community-fabric/` | Community interoperability RFC (documentation scaffold) |
| `patches/` | Patches for official core packages and third-party packages (21) |
| `vendor/dsh-runtime/<version>/` | Prebuilt official core tgz files (265) |
| `vendor/agents-anywhere/` | Agents Anywhere bridge (pinned tgz) |
| `docs/` | Retained upstream documentation (architecture / plugin development / packaging experiment notes) |
| `.agents/notes/` | Community design notes (**for human reference only; AI must not read**) |
| `AGENTS.md` | This repository's rules (**the single authority**) |

## 8. Data and privacy

**All data stays on this machine**: in portable mode `DSH_HOME = <install dir>\data`. See [`PRIVACY.md`](PRIVACY.md).

## 9. License and acknowledgements

- The agent core, tools, sessions, Web UI, and plugin ecosystem come from DeepSeek's official [`deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness)
- The plugin foundation comes from [Cordis](https://github.com/cordiverse/cordis)
- The desktop shell was reworked from the community project [`anywhere-labs/dsh-desktop`](https://github.com/anywhere-labs/dsh-desktop)

This repository is a **personal custom fork** with no affiliation, partnership, authorization, or endorsement relationship with the projects above. License: MIT (see [`LICENSE`](LICENSE)).
