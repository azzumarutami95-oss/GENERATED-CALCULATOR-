# Connection Design desktop

Windows desktop packaging for the English embedded head plate calculator. The application runs offline and uses native project file dialogs. It does not change the engineering calculation models or their stated limitations.

## Installation

Download [Connection-Design-Setup-1.0.0-x64.exe](https://raw.githubusercontent.com/azzumarutami95-oss/GENERATED-CALCULATOR-/refs/heads/embedded-beam-worksheet-20261026/windows/Connection-Design-Setup-1.0.0-x64.exe). Run the Windows x64 setup, choose an installation directory, and launch **Connection Design** from the Start menu or desktop. Double-click an `.epd` project to open it. Uninstall through Windows Settings; project files in your own folders are retained.

The installer is currently unsigned. A code-signing certificate is not included in this repository. The desktop runtime was smoke-tested on Linux. Direct Windows installation has not been executed for this repository-hosted build; the included Windows workflow provides that additional validation when run.

## Reproducible build

Use Node.js 24 and npm. From `desktop/`:

```powershell
npm ci
npm run runtime:install
npm run stage
npm run test:desktop
npm run build:windows
```

The complete offline installer is written to `desktop/dist/`. English is the only bundled Chromium locale. The custom NSIS script generates its uninstaller at installation time, allowing cross-builds without Wine; uninstall removes only the packaged file manifest and preserves unknown files and project data. `package-lock.json` pins build and test dependencies. Electron downloads are checked against the package's release checksums. On networks that require a proxy, retain the configured proxy and CA settings; Node 24 supports `NODE_USE_ENV_PROXY=1` for its fetch-based downloader. Do not disable TLS or checksum validation.

The stage script copies the current `../embedded-beam.html` and adds the desktop file-dialog adapter. It records the HTML's SHA-256 in `app/source.json`; the engineering code is otherwise unchanged. Generated files and dependency caches are ignored by Git.

The GitHub workflow `.github/workflows/windows-desktop.yml` builds on Windows, tests native project read/write and PDF export, installs the resulting setup, and runs the same smoke test against the installed executable. A `desktop-v*` tag publishes the tested setup with its SHA-256 checksum. Manual workflow dispatch builds a test artifact without publishing a release. Manual dispatch requires the workflow on the repository default branch and Actions enabled. Inclusion of a workflow is not evidence that a Windows run has completed.

## Runtime boundaries

The renderer has no Node.js access. Context isolation and sandboxing are enabled. Project file access uses opaque tokens issued by native file dialogs or `.epd` launch arguments; the main process validates the sender and project format and replaces files through a temporary file. The desktop adapter implements only the file-picker methods used by the calculator. External navigation and network requests are disabled.

No engineering project data is sent to GitHub. Releases contain the application and default examples only.
