# Handoff — keyboard and gamepad input test build

## Current state

- Local branch: `codex/keyboard-gamepad-controls`; no remote push.
- User reports the required authorization to modify the Creamy Calf project has been obtained.
- Input source files include `mobile/android/MainActivity.java`, `mobile/android/AndroidManifest.xml`, `mobile/src/mobile-ui.js`, `mobile/src/mobile-hardware.js`, and `mobile/tools/prepare.cjs`.
- The test app uses package `org.local.uw2mobile.inputtest`, version `0.9.2-input-test`, versionCode 15. It can update the 0.9.1 test app with the persistent local signing key and retain its separate WebView storage/saves; it remains separate from the published package.

## Controls

- Keyboard: arrows/WASD move; Enter/Space confirm; Escape/Backspace back; M expands tools; F1 opens the game menu.
- Gamepad: D-pad/left stick move; A confirm; B back; X/Y left/right click; Start expands tools; Select opens the game menu; right stick moves the pointer. LB/L1 selects 情报; LT/L2 selects 经营; RB/R1 selects 命令; RT/R2 selects 航海术. LT/RT support digital key codes and analog trigger axes.
- Direction input is routed to in-game actions rather than WebView focus navigation. The startup screen automatically focuses an enabled start action; D-pad/arrows move between Continue/New Game, and A/Enter selects. Save/load opens with the first usable record focused; D-pad/arrows navigate records, A/Enter selects, and B/Escape closes the picker. Orange outline indicates hardware focus. Other open HTML panels use D-pad/arrow navigation. Focused text fields keep keyboard input.
- Input state is cleared on app pause, window-focus loss, and controller removal.

## Build

- Supply `Uncharted-Waters-2-Android-v7.8.apk` at the repository root. The macOS script checks its SHA-256 before extraction. The APK, extracted assets, `inspection/`, `mobile/build/`, `dist/`, saves, and local signing key are ignored by Git.
- macOS: `bash mobile/tools/build-macos.sh`.
- Windows: `powershell -NoProfile -ExecutionPolicy Bypass -File mobile/tools/build.ps1 -SdkRoot <SDK> -JdkRoot <JDK>`.
- The macOS build used Android SDK Platform 37.0, Build Tools 36.0.0, and Android Studio's bundled JDK 25. Its generated local test key is not committed.
- Output: `dist/Uncharted-Waters-2-Mobile-0.9.2-input-test.apk`.

## Validation and limits

- The APK compiled and `apksigner verify --verbose` passed with v2 and v3 signatures. The signer SHA-256 matches 0.9.1 (`0deb3833795579c669310d9eb6a28498c871cd2f37e81e694483dec7f2955a64`), and package/version metadata is `org.local.uw2mobile.inputtest` / `0.9.2-input-test` / code 15, so it can update in place.
- User has tested the 0.9.2 startup menu and save picker navigation on iPlay 50 Mini and reports no issues. The user also previously confirmed D-pad, A/B confirm/back, stick, and LB/LT/RB/RT shortcuts work on that device. No separate Android emulator interaction check was run; behavior on other controllers remains unverified.
- The previously observed WebView 101 `deflate-raw` startup issue is separate from keyboard/gamepad routing and may still prevent startup on the tablet.
- The local signing key differs from the published APK key; the separate package avoids replacing or deleting the user's existing installation and saves.
