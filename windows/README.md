# Connection Design — Windows installer

[Download Connection-Design-Setup-1.0.0-x64.exe](https://raw.githubusercontent.com/azzumarutami95-oss/GENERATED-CALCULATOR-/refs/heads/embedded-beam-worksheet-20261026/windows/Connection-Design-Setup-1.0.0-x64.exe)

- Windows 10/11, 64-bit; approximately 100 MB.
- Complete offline installer; the runtime is included.
- Per-user installation, desktop / Start menu shortcuts, native `.epd` project files, and an uninstaller.
- Close Connection Design before reinstalling. Project files are retained during uninstall.

The installer is unsigned. Desktop runtime tests passed on Linux and the NSIS archive and Windows payload were checked; direct Windows installation has not been executed for this build. See [BUILD-INFO.json](BUILD-INFO.json) and [SHA256SUMS.txt](SHA256SUMS.txt) for the exact artifact and validation record.

The calculation models remain preliminary and retain the limitations stated in the application. Packaging as an executable does not certify an engineering design.

Source and build instructions: [desktop/README.md](../desktop/README.md).
