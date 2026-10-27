!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"
!include "WinVer.nsh"
!include "${BUILD_RESOURCES_DIR}/uninstall-files.nsh"

Name "Connection Design"
RequestExecutionLevel user
InstallDir "$LOCALAPPDATA\Programs\Connection Design"
InstallDirRegKey HKCU "Software\ConnectionDesign" "InstallDir"
SetCompressor /SOLID lzma
SetCompressorDictSize 64
ShowInstDetails show
ShowUninstDetails show
BrandingText "Connection Design"

!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Connection Design Setup"
!define MUI_WELCOMEPAGE_TEXT "Install the offline embedded head plate design application.$\r$\n$\r$\nWindows 10/11, 64-bit. The calculation models and limitations are stated in the application.$\r$\n$\r$\nThis installs for your user account; no administrator account is required."
!define MUI_FINISHPAGE_RUN "$INSTDIR\Connection Design.exe"
!define MUI_FINISHPAGE_RUN_NOTCHECKED
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_ICONSTOP "Connection Design requires 64-bit Windows."
    Abort
  ${EndIf}
  ${IfNot} ${AtLeastWin10}
    MessageBox MB_ICONSTOP "Connection Design requires Windows 10 or later."
    Abort
  ${EndIf}
  SetRegView 64
  SetShellVarContext current
FunctionEnd

Section "Connection Design" MainSection
  SetOutPath "$INSTDIR"
  File /r "${PROJECT_DIR}/dist/win-unpacked/*"
  File /oname=Connection-Design.ico "${BUILD_RESOURCES_DIR}/icon.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Connection Design"
  CreateShortCut "$SMPROGRAMS\Connection Design\Connection Design.lnk" "$INSTDIR\Connection Design.exe" "" "$INSTDIR\Connection-Design.ico"
  CreateShortCut "$SMPROGRAMS\Connection Design\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortCut "$DESKTOP\Connection Design.lnk" "$INSTDIR\Connection Design.exe" "" "$INSTDIR\Connection-Design.ico"

  ReadRegStr $0 HKCU "Software\Classes\.epd" ""
  ${If} $0 != "ConnectionDesign.Project"
    WriteRegStr HKCU "Software\ConnectionDesign" "PreviousEpdAssociation" "$0"
  ${EndIf}
  WriteRegStr HKCU "Software\ConnectionDesign" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\Classes\.epd" "" "ConnectionDesign.Project"
  WriteRegStr HKCU "Software\Classes\ConnectionDesign.Project" "" "Connection Design Project"
  WriteRegStr HKCU "Software\Classes\ConnectionDesign.Project\DefaultIcon" "" '$\"$INSTDIR\Connection-Design.ico$\",0'
  WriteRegStr HKCU "Software\Classes\ConnectionDesign.Project\shell\open\command" "" '$\"$INSTDIR\Connection Design.exe$\" $\"%1$\"'

  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ConnectionDesign" "DisplayName" "Connection Design"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ConnectionDesign" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ConnectionDesign" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ConnectionDesign" "DisplayIcon" "$INSTDIR\Connection-Design.ico"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ConnectionDesign" "Publisher" "Connection Design"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ConnectionDesign" "UninstallString" '$\"$INSTDIR\Uninstall.exe$\"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ConnectionDesign" "QuietUninstallString" '$\"$INSTDIR\Uninstall.exe$\" /S'
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ConnectionDesign" "EstimatedSize" ${APP_ESTIMATED_SIZE_KB}
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ConnectionDesign" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ConnectionDesign" "NoRepair" 1
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
SectionEnd

Function un.onInit
  SetRegView 64
  SetShellVarContext current
FunctionEnd

Section "Uninstall"
  !insertmacro RemoveApplicationFiles
  Delete "$INSTDIR\Connection-Design.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$DESKTOP\Connection Design.lnk"
  Delete "$SMPROGRAMS\Connection Design\Connection Design.lnk"
  Delete "$SMPROGRAMS\Connection Design\Uninstall.lnk"
  RMDir "$SMPROGRAMS\Connection Design"
  ReadRegStr $0 HKCU "Software\Classes\.epd" ""
  ${If} $0 == "ConnectionDesign.Project"
    ReadRegStr $1 HKCU "Software\ConnectionDesign" "PreviousEpdAssociation"
    ${If} $1 == ""
      DeleteRegValue HKCU "Software\Classes\.epd" ""
      DeleteRegKey /ifempty HKCU "Software\Classes\.epd"
    ${Else}
      WriteRegStr HKCU "Software\Classes\.epd" "" "$1"
    ${EndIf}
  ${EndIf}
  DeleteRegKey HKCU "Software\Classes\ConnectionDesign.Project"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ConnectionDesign"
  DeleteRegKey HKCU "Software\ConnectionDesign"
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
SectionEnd
