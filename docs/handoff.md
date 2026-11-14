# Handoff — keyboard and gamepad input test build

## Current state

- Local branch: `codex/keyboard-gamepad-controls`.
- Latest keyboard/gamepad, market/map, and save-transfer changes are being published to the fork branch [`codex/keyboard-gamepad-controls`](https://github.com/shrekzki/Uncharted-Waters2/tree/codex/keyboard-gamepad-controls), which is the head branch for upstream PR #2. The public `main` branch and published 0.8.2 APK remain separate.
- The user reports authorization to modify the Creamy Calf project.
- Current test app: package `org.local.uw2mobile.inputtest`, version `0.9.16-input-test`, versionCode 29. It uses the existing local test signing key and remains separate from the published package and its saves.

## Controls

- Keyboard: arrows/WASD move; Enter/Space confirm; Escape/Backspace back; M expands tools; F1 opens the game menu. Physical 0–9 keys enter digits while the game's numeric editor is active.
- Gamepad: D-pad/left stick move; A confirm; B back; X/Y left/right click; Start expands tools; Select opens the game menu; right stick moves the pointer. LB/L1 selects 情报; LT/L2 selects 经营; RB/R1 selects 命令; RT/R2 selects 航海术. LT/RT support digital key codes and analog trigger axes.
- Startup: the enabled start action is focused; D-pad/arrows navigate Continue/New Game and A/Enter selects.
- Save/load: an available record is focused first; D-pad/arrows navigate records, A/Enter selects, and B/Escape closes the picker. Orange outline indicates hardware focus; empty records cannot be selected.
- Numeric editor: the detected prompt receives a focus outline directly over the original in-game calculator, initially on `1`. D-pad/arrows navigate the screenshot-calibrated 4-row, 5-column grid; holding a direction repeats after an initial delay. A/Enter clicks the highlighted game-screen coordinate. Physical digits, touch, and mouse continue to use the original calculator. No separate numeric menu is opened.
- Input state is cleared on app pause, window-focus loss, and controller removal. Focused HTML text fields retain normal keyboard behavior.

## Build

- Supply `Uncharted-Waters-2-Android-v7.8.apk` at the repository root. The macOS script checks its SHA-256 before extraction. The APK, extracted assets, `inspection/`, `mobile/build/`, `dist/`, saves, and local signing key are ignored by Git.
- macOS: `bash mobile/tools/build-macos.sh`.
- Windows: `powershell -NoProfile -ExecutionPolicy Bypass -File mobile/tools/build.ps1 -SdkRoot <SDK> -JdkRoot <JDK>`.
- The macOS build uses Android SDK Platform 36 or newer, Build Tools 36.0.0 by default, and Android Studio's bundled JDK when available. The generated local test key is not committed.
- Output: `dist/Uncharted-Waters-2-Mobile-0.9.16-input-test.apk` (`versionCode` 29).

## Validation and limits

- The 0.9.3 approach opened a separate digit panel; supplied screenshots clarified that focus belongs on the in-game calculator. 0.9.4 added the overlay and direct DOS mouse clicks. After screenshot-driven adjustments in 0.9.6–0.9.7, the user confirmed the focus/click alignment on iPlay 50 Mini. Version 0.9.8 changed the outline visibility behavior; the latest save-sharing and market navigation still need target-device checks.
- The 0.9.6 macOS build completed. `aapt` reports package `org.local.uw2mobile.inputtest`, version `0.9.8-input-test`, versionCode 21; APK v2/v3 signature verification passed. Certificate SHA-256: `0deb3833795579c669310d9eb6a28498c871cd2f37e81e694483dec7f2955a64`. APK SHA-256: `b6a65972ff11a0d7fa058133621f500678b2eeb7d68c6875da2d9013031f10ba`.
- The same package and local signing key permit updating the existing input-test app while retaining its local data.
- The user previously verified directional, A/B, stick, shoulder shortcut, startup, save-picker, and corrected calculator focus/click alignment on iPlay 50 Mini. The later market-panel hardware navigation and 0.9.16 Android system-share/cloud-drive receiver still need target-device validation.
- This build does not include game files, saves, signing keys, or APKs in Git. The local signing key differs from the published APK key; the separate package avoids replacing the published installation.
- The previously observed WebView 101 `deflate-raw` startup issue is separate from keyboard/gamepad routing and may still prevent startup on the tablet.

- 0.9.7: user screenshots show the top focus on 4 and the bottom focus clipped. Shifted all four calculator focus and click centers upward by 30 game coordinates. Upstream `dos_input.js` uses popup y + 60 for MAX, corroborating the top row. Real-device click validation remains pending.

- 0.9.8: user confirmed 0.9.7 calculator coordinates accurate on iPlay 50 Mini; changed SVG focus visibility to use the hidden attribute so the outline hides when the calculator closes. The hidden-state change itself was not separately retested on hardware.

- 0.9.8 build: versionCode 21, v2/v3 signatures verified; APK SHA-256 `fecbc41742f99e78034638c74d50f8d918fc8eb486663ece154ae5afa8d07091`.

## 0.9.9 port market overlay

- Upstream v8.9 release notes describe per-item buy port, sell port, and per-unit spread. Its GPL source archive was downloaded from the official release and matched the release API SHA-256 `e693a88650fe15d239c1550771ebeac60e3069cfd85676ee1351041d74d29290`.
- `trade-core.js` calculates 100 regular ports × 46 goods from live economy, market, controller, and permit tables. Upstream source SHA-256: `c22b0d79594f16aa90484d90b8c384a784632d4bdf90094b1bf3329c77b2d1f2`; `port-goods.json`: `03f8e466cffa722e85dce39e8661202d6e862e1840514baff8d29f2f35e9191d`. The local build adapts the read-only worker observer from `world-position.js`; local DOSBox-X `wdosbox-x.js` (`f2a23549e71c7ab1023f66c752a1b217e41141ce00920124d31040e6dfe3005f`) and WASM (`8e6bbbee26a70433c3a78d0f3a3152a8d7762d016cd2024f6f13d69e93e9f689`) hashes match v8.9. Supported v7.8 Traditional-Chinese `MAIN.EXE` hash: `76ab2f81a465b393313831ac81f7ff7b8d450b87b2fae06886b0a8740f3c0281`.
- `mobile-market.js` adds a Tools → 行情 panel for the local specialty route and up to two positive per-unit spreads. The overlay blocks game input while open, supports controller focus/back, and does not pause or alter game state. It omits negotiation, route costs, carried quantity, and future market changes.
- The exact `trade-core.js` source and `port-goods.json` are retained with attribution; the worker observer is a local GPL-derived adaptation. GPL-2.0 text is packaged with the APK. See `NOTICE.md`.
- The 0.9.9 APK was built locally as package `org.local.uw2mobile.inputtest`, versionCode 22. The build verified v2/v3 signing; APK SHA-256: `f43818cf6b61bd439e9d6fa0f815d48aa30a6ab4d3fa6eeb628221c21743434a`. Packaged market modules, port catalog, and GPL-2.0 text were checked. No gameplay/emulator check of the market panel has been completed; verify it in a port screen before relying on the quotes. No APK, game asset, or save is committed, and nothing is pushed.


## 0.9.10 港口卖价与世界坐标图

“工具 → 行情/地图”提供本港可购商品的其他港口卖价，可按坐标距离或单位差价排序；展示前 12 个目的港。世界坐标图使用运行中游戏内存里的 130 个港口坐标及玩家坐标，城市和海上可打开。图为坐标示意，尚未校准海岸线；坐标直线距离不是实际海上航程。基于 v7.8 中文版和已验证布局，真实游戏及设备验收待完成。构建依赖、基础 APK 和保存规则沿用本交接既有说明。


### 0.9.11 本地行情联动

港口行情加入本港全部可购商品切换、简繁中文港口名称搜索、附近/利润排序及列表与坐标图选择联动。显示少量附近港口名及选中港口信息；图仍为坐标示意，海岸线投影尚未校准，距离不等同实际航程。APK 输出 `dist/Uncharted-Waters-2-Mobile-0.9.11-input-test.apk`，versionCode 24；保留原始 v8.9 港口表，另以 ICU Traditional-Simplified 生成简体名称表。模拟行情交互检查和现有 20 项测试通过；没有可用的 Android 模拟器和 iPlay 真机，实际行情与手柄仍需验证。构建依赖与存档保护沿用本文件既有说明。

0.9.11 构建产物 SHA-256 `45ef50a77c80fbc65c9076fac9f2091cadb4ac5aef272bc10774ba038f5291e2`；简体名称表 SHA-256 `545531d039f61f710d9b2bdc580f455d250085a18ee8594baa62a1aaf9888f0b`。无可用模拟器；Browser plugin 不可用且 Playwright 未安装，尚未做渲染交互验收。


### 0.9.12 航海图与缩放

本机 Android 测试版使用用户自行提供的上游 v8.9 APK 中的 `world-projection.json` 和 v7.8 基础 APK 中同哈希的世界海图底图，按上游网格插值把港口及当前位置叠上海岸线。港口圆点缩小但保留较大触摸范围；默认只显示当前及选中港口名。地图支持 1×、2×、4× 按钮缩放及拖动/滚动，距离仍为游戏坐标直线距离。

macOS 构建需准备既有 v7.8 基础 APK，并设 `UW2_V89_APK` 指向用户自行准备的 v8.9 APK 后运行 `bash mobile/tools/build-macos.sh`；构建脚本校验 APK、投影及底图哈希，不提交 APK、投影资源、游戏文件或存档。不设置该变量时显示坐标网格，Windows 构建未增加 v8.9 投影导入步骤。Android API 37 模拟器中已验证里斯本海图显示及 2× 放大，用户确认可拖动；4×、实体平板触摸和手柄操作仍待验证。

资源校验：v8.9 APK SHA-256 `a26bb6a1265bd715842f7c9f70315ed35141f06869954002bf7ccf0052e34f94`；投影 SHA-256 `e166c3d5f02bbe970ce4c1d038e6b3271fb721af12e6fbd66aba536540182a75`；海图 WebP SHA-256 `2994492343631e4572662c274afc70515c674f09cdcaca81e65377e9835976ee`。投影与 v8.9 manifest 所指海图相匹配。基础游戏 MAIN 的里斯本、塞维尔、伦敦、长崎四组坐标通过投影范围检查；模拟行情测试覆盖商品、搜索、选择及 2× 缩放；没有进行真实游戏验证。

0.9.12 APK SHA-256 `3ba90cd69e48d999b081933802a2b6a2f2813d7aca8c4e76a99d29cf6e531fe0`。对 1000 个游戏坐标将本地投影与 v8.9 上游 `world-position.js` 插值比较，结果逐项一致；20 项现有 Node 检查、模拟 2× 缩放与商品/港口交互检查通过。运行中的模拟器当前前台是输入测试版；为保护未保存进度，等待用户保存后再覆盖安装。

模拟器 API 37 上覆盖安装后曾在 WebView 初始化崩溃（日志提示当前 WebView 包不可见）；manifest 加入对 `com.google.android.webview` 和 `com.android.webview` 的精确包可见性后重新构建安装，已进入启动画面。用户进入里斯本画面后，已在模拟器确认海图底图、当前位置和港口标记；用户确认 2× 放大及拖动正常。4×、实体平板触摸和手柄尚未验证。未执行存档覆盖。

0.9.12 最终 APK SHA-256 `3ba90cd69e48d999b081933802a2b6a2f2813d7aca8c4e76a99d29cf6e531fe0`；Android API 37 模拟器覆盖安装后启动成功，海图 1× 实际显示、2× 按钮及用户拖动通过。


### 0.9.13 存档转移

港口或自由航海主画面中，先保存游戏，再通过“工具 → 菜单 → 存档转移”导出或导入。两个设备都应安装同一兼容测试版。Android 系统文件选择器用于选择保存位置和待导入文件；需要使用双方可访问的云盘或手动传输文件，应用本身不会自动联网同步。模拟器里的 Downloads 属于虚拟设备，需要通过 Android Studio Device Explorer、adb 或已安装的云盘应用传出；不要假定它等于 Mac 的 Downloads。

导出的 `.uw2save.json` 包含整份十条记录、已校验的 v7.8 MAIN 版本标识和 SHA-256 摘要。导入前校验长度、游戏版本、有效记录及文件摘要，并展示源/目标记录号；确认后保存一份独立于修改器的本机导入前备份。导入会替换全部十条记录；成功后必须读取一条导入记录才能继续。取消读取会返回保护面板。可恢复最近一次导入前备份；备份保存在应用本地，卸载或清除数据时也会被删除。

构建：在项目根目录准备已核验 v7.8 APK 和可选 v8.9 投影 APK，运行 `UW2_V89_APK=<v8.9 APK路径> bash mobile/tools/build-macos.sh`；产物 `dist/Uncharted-Waters-2-Mobile-0.9.13-input-test.apk`，包名 `org.local.uw2mobile.inputtest`，versionCode 26。签名密钥、用户存档、APK 和游戏资源不进入 Git。编码、拒绝损坏文件、导入确认、独立备份、回滚、恢复和取消读取采用合成数据检查；Android 文件选择器及两台真实设备迁移仍需实测。

### 0.9.14 行情手柄导航与地图倍率记忆

- 本地测试包 `dist/Uncharted-Waters-2-Mobile-0.9.14-input-test.apk`，包名 `org.local.uw2mobile.inputtest`，versionCode 27；未推送。
- Start 展开工具后优先聚焦行情；行情初始聚焦已选港口或第一条比较结果，左右切换筛选、结果、地图缩放，上下浏览当前区域，A 选择，B 关闭并恢复游戏输入；长按方向重复。地图港口仍可触摸选取，刷新后保留焦点。肩键在游戏中的既有映射不变。
- 地图倍率 1×/2×/4× 使用 localStorage 保存并跨面板关闭及应用重启恢复；存储失败或异常值回退 1×。
- 使用已核验 v7.8 基础 APK 和 v8.9 用户提供的海图投影构建（`UW2_V89_APK`，来源与哈希见 0.9.12 记录）；v2/v3 签名验证通过，APK SHA-256 `6a87e11414982502abc075f653c926542601c2b673a9ff6439d7bed6c1639526`。
- 方向分区、边界、长按重复及缩放保存的 5 项 Node 定向测试通过；既有输入、存档等测试通过。尚未在 Android 模拟器或 iPlay 真实场景验证新导航和倍率记忆。

### 0.9.15 系统分享存档

- 存档转移新增“分享至123云盘”：从已核验游戏存档生成包含十条记录的 `.uw2save.json`，使用 Android ACTION_SEND 系统分享，由用户选 123 云盘和目标目录并自行完成上传。系统分享可接收其他支持 JSON 文件的应用；123 客户端是否显示为可选目标尚待验证。未实现自动上传、云端登录或上传结果查询。
- Android provider 不导出，仅读取内部 cache 中按受限文件名创建的快照；通过单个 content URI 和临时只读权限分享，快照可能随系统清理 cache 消失。已有本机导出及校验导入不变，不会读取或保存云盘凭证。
- macOS 构建增加 `UW2_WORLD_PROJECTION`：当 v8.9 APK 不在本机时，可传入自行持有的投影 JSON，脚本校验既有投影哈希并由 prepare 再校验匹配的海图底图。本次投影从已核验 0.9.14 APK（SHA-256 `6a87e11414982502abc075f653c926542601c2b673a9ff6439d7bed6c1639526`）提取，投影 SHA-256 `e166c3d5f02bbe970ce4c1d038e6b3271fb721af12e6fbd66aba536540182a75`；基础 v7.8 APK 与底图仍按原脚本校验。
- APK `dist/Uncharted-Waters-2-Mobile-0.9.15-input-test.apk`，versionCode 28；SHA-256 `37a9544e48ebd963da5e5df076f4562c503f940436f4a601fadd2a3df736f90d`，签名 v2/v3 通过，证书与 0.9.14 一致。40 项 Node 检查通过，包含分享成功回调、失败不写存档及导入回滚；构建期间无 Android 设备连接，尚未验证系统分享、123 客户端选择或云盘上传。

### 0.9.16 日期时间存档文件名

- 分享与系统导出的建议文件名改为 `UW2-yyyy-MM-dd_HH-mm-ss.uw2save.json`，时间使用设备本地时区。同秒重复分享会原子预留 `-01` 至 `-99`，不会覆盖已有 cache 文件；旧 UUID 分享 URI 仍被 provider 接受。云盘客户端是否保留分享文件名须在实际 Android 设备上确认。
- APK：`dist/Uncharted-Waters-2-Mobile-0.9.16-input-test.apk`，versionCode 29，SHA-256 `cbf071dfd8caf30c51229ca4ce5b2893202b8e4ea5e685cf80d59a0390ee8108`；v2/v3 签名及证书与前版一致。构建使用用户现有 v7.8 基础 APK 及从已核验 0.9.14 APK 提取并校验的 v8.9 海图投影，方法见 0.9.15。
- 41 项 Node 检查通过，包含真实 Java 文件命名、同秒冲突不覆盖、旧文件名兼容和路径拒绝；未在模拟器/iPlay 验证分享目标与云盘显示。
