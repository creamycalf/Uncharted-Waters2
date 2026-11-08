# Architecture

The Android shell is a small Java `Activity` hosting a local WebView. Web content and the js-dos/DOSBox runtime are packaged as Android assets; the game itself runs inside that WebView.

## Hardware input path

`MainActivity` intercepts physical keyboard and gamepad button events through `dispatchKeyEvent`, and joystick/trigger axes through `dispatchGenericMotionEvent`. D-pad and face/shoulder buttons become normalized actions. LT/RT can arrive as digital L2/R2 key events or analog trigger axes; per-device pressed state merges both paths and applies press/release hysteresis.

`mobile-hardware.js` merges keyboard, D-pad, and analog-stick direction state, applies a dead zone, and prevents mapped keyboard events from reaching WebView focus navigation. It routes actions into the `K2Mobile` adapter in `mobile-ui.js`.

`mobile-ui.js` sends movement through the existing js-dos key-event path, game confirmation/back through `K2UI`, shoulder shortcuts to the four root game tabs (`shortcut(0..3)`), and pointer clicks through the existing DOS mouse path. The tab order is 情报、经营、命令、航海术. When the startup screen is active, hardware navigation focuses the custom start actions. The native save/load dialog focuses an available record and routes confirm/back to its focused button or the dialog's Back button. Focused HTML controls take directional navigation; native text inputs retain normal keyboard behavior. Input state is released when the app pauses, loses window focus, or a controller disconnects.

## Build packaging

`mobile/tools/prepare.cjs` extracts the mobile adaptations into the WebView asset tree from the supplied v7.8 APK. Windows uses `build.ps1`; macOS uses `build-macos.sh`. Both compile the minimal Java shell with Android SDK build tools, package assets, align, sign with a local test key, and verify the resulting APK signature.
