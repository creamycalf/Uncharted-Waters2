# Architecture

The Android shell is a small Java `Activity` hosting a local WebView. Web content and the js-dos/DOSBox runtime are packaged as Android assets; the game itself runs inside that WebView.

## Hardware input path

`MainActivity` intercepts physical keyboard and gamepad button events through `dispatchKeyEvent`, and joystick/trigger axes through `dispatchGenericMotionEvent`. D-pad and face/shoulder buttons become normalized actions. LT/RT can arrive as digital L2/R2 key events or analog trigger axes; per-device pressed state merges both paths and applies press/release hysteresis.

`mobile-hardware.js` merges keyboard, D-pad, and analog-stick direction state, applies a dead zone, and prevents mapped keyboard events from reaching WebView focus navigation. It routes actions into the `K2Mobile` adapter in `mobile-ui.js`.

`mobile-ui.js` sends movement through the existing js-dos key-event path, game confirmation/back through `K2UI`, shoulder shortcuts to the four root game tabs (`shortcut(0..3)`), and pointer clicks through the existing DOS mouse path. The tab order is 情报、经营、命令、航海术. When the startup screen is active, hardware navigation focuses the custom start actions. The native save/load dialog focuses an available record and routes confirm/back to its focused button or the dialog's Back button. When `K2Input` detects the game's numeric editor, `mobile-ui.js` places an SVG focus outline over the original on-screen calculator. Its four-row, five-column focus centers are calibrated to the supplied iPlay screenshots; D-pad/arrows move between actual key centers, and holding a direction repeats after a short delay. A/Enter sends a DOS mouse click at the focused game-screen coordinate; no second numeric menu is opened. Physical digit keys still enter through `K2Input`, while touch and mouse continue to target the original calculator. Other focused HTML controls keep their existing navigation. Input state is released when the app pauses, loses window focus, or a controller disconnects.

## Port market overlay

`mobile-market-core.js` contains the upstream v8.9 GPL-2.0 per-unit quote algorithm; `port-goods.json` supplies the port/goods labels. `mobile-market.js` wraps only the classic `wdosbox-x.js` worker and samples the known Traditional-Chinese `MAIN.EXE` memory layout. It validates the game signature, fleet pointer, calendar, coordinates, and port before reading market/economy tables. The bounded signature scan runs at most 2 ms per sample and polls at 4 Hz. It does not write guest memory, input, time, or save files.

On a port scene, **工具 → 行情** opens a compact, hardware-focusable panel with the local specialty route and up to two highest positive per-unit spreads. Quotes reflect the current game state and exclude haggling, travel cost, carried quantity, and future supply/demand changes. Supply ports show no-exchange status. The derivation and GPL attribution are recorded in `NOTICE.md`; the full license is copied into the APK's `assets/release-docs/licenses/` directory.

## Build packaging

`mobile/tools/prepare.cjs` extracts the mobile adaptations into the WebView asset tree from the supplied v7.8 APK, including the market observer and catalog. Windows uses `build.ps1`; macOS uses `build-macos.sh`. Both compile the minimal Java shell with Android SDK build tools, package assets, align, sign with a local test key, and verify the resulting APK signature.


## 0.9.10 港口卖价与世界坐标图

“工具 → 行情/地图”提供本港可购商品的其他港口卖价，可按坐标距离或单位差价排序；展示前 12 个目的港。世界坐标图使用运行中游戏内存里的 130 个港口坐标及玩家坐标，城市和海上可打开。图为坐标示意，尚未校准海岸线；坐标直线距离不是实际海上航程。基于 v7.8 中文版和已验证布局，真实游戏及设备验收待完成。构建依赖、基础 APK 和保存规则沿用本交接既有说明。


### 0.9.11 本地行情联动

港口行情加入本港全部可购商品切换、简繁中文港口名称搜索、附近/利润排序及列表与坐标图选择联动。显示少量附近港口名及选中港口信息；图仍为坐标示意，海岸线投影尚未校准，距离不等同实际航程。APK 输出 `dist/Uncharted-Waters-2-Mobile-0.9.11-input-test.apk`，versionCode 24；保留原始 v8.9 港口表，另以 ICU Traditional-Simplified 生成简体名称表。模拟行情交互检查和现有 20 项测试通过；没有可用的 Android 模拟器和 iPlay 真机，实际行情与手柄仍需验证。构建依赖与存档保护沿用本文件既有说明。


### 0.9.12 航海图与缩放

本机 Android 测试版使用用户自行提供的上游 v8.9 APK 中的 `world-projection.json` 和 v7.8 基础 APK 中同哈希的世界海图底图，按上游网格插值把港口及当前位置叠上海岸线。港口圆点缩小但保留较大触摸范围；默认只显示当前及选中港口名。地图支持 1×、2×、4× 按钮缩放及拖动/滚动，距离仍为游戏坐标直线距离。

macOS 构建需准备既有 v7.8 基础 APK，并设 `UW2_V89_APK` 指向用户自行准备的 v8.9 APK 后运行 `bash mobile/tools/build-macos.sh`；构建脚本校验 APK、投影及底图哈希，不提交 APK、投影资源、游戏文件或存档。不设置该变量时显示坐标网格，Windows 构建未增加 v8.9 投影导入步骤。Android API 37 模拟器中已验证里斯本海图显示及 2× 放大，用户确认可拖动；4×、实体平板触摸和手柄操作仍待验证。


### 0.9.13 存档转移

港口或自由航海主画面中，先保存游戏，再通过“工具 → 菜单 → 存档转移”导出或导入。两个设备都应安装同一兼容测试版。Android 系统文件选择器用于选择保存位置和待导入文件；需要使用双方可访问的云盘或手动传输文件，应用本身不会自动联网同步。模拟器里的 Downloads 属于虚拟设备，需要通过 Android Studio Device Explorer、adb 或已安装的云盘应用传出；不要假定它等于 Mac 的 Downloads。

导出的 `.uw2save.json` 包含整份十条记录、已校验的 v7.8 MAIN 版本标识和 SHA-256 摘要。导入前校验长度、游戏版本、有效记录及文件摘要，并展示源/目标记录号；确认后保存一份独立于修改器的本机导入前备份。导入会替换全部十条记录；成功后必须读取一条导入记录才能继续。取消读取会返回保护面板。可恢复最近一次导入前备份；备份保存在应用本地，卸载或清除数据时也会被删除。

构建：在项目根目录准备已核验 v7.8 APK 和可选 v8.9 投影 APK，运行 `UW2_V89_APK=<v8.9 APK路径> bash mobile/tools/build-macos.sh`；产物 `dist/Uncharted-Waters-2-Mobile-0.9.13-input-test.apk`，包名 `org.local.uw2mobile.inputtest`，versionCode 26。签名密钥、用户存档、APK 和游戏资源不进入 Git。编码、拒绝损坏文件、导入确认、独立备份、回滚、恢复和取消读取采用合成数据检查；Android 文件选择器及两台真实设备迁移仍需实测。

行情面板使用独立手柄焦点分区（筛选、比较结果和地图缩放），刷新列表时按港口或控件标识恢复焦点；地图点保留触摸，避免进入常规方向导航。地图倍率保存在 WebView localStorage 的 `uw2-market-map-zoom`，只接受 1、2、4，存储不可用时使用 1×。

存档分享复用 `K2TransferCore.pack`，导出前检查游戏版本、记录与 SHA-256。Android shell 将快照写入应用私有 cache，通过不导出的 `SaveShareProvider` 和临时只读 URI 授权交给系统 ACTION_SEND 选择器；不接收网盘凭证，也不把打开选择器当作上传成功。现有手动导入/导出流程保持独立。

存档分享文件名以设备时区生成日期时间；私有 cache 以原子方式预留文件，避免同秒冲突。provider 继续接受旧版 UUID 文件名，以免破坏已有分享 URI。普通导出的系统建议文件名也使用日期时间。
