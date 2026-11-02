# 0.8 封版交接（2026-11-02）

## 项目与入口

仓库：https://github.com/creamycalf/Uncharted-Waters2

上游：https://github.com/maxleolee-eng/Uncharted-Waters-2-Android ，固定基线为用户提供的 v7.8 APK。

这是原 DOS 中文游戏运行于 js-dos / DOSBox-X、外包 Android WebView 的手机适配项目。保留原游戏剧情、资源与规则，新增触屏控制、可选补丁及存档修改器。不是原生游戏引擎重写，也未把 Windows 修改器 EXE 嵌入 Android。

版本 0.8-mobile / versionCode 10；包名 org.local.uw2mobile；Android 8.0+，横屏；本地测试证书签名。直接覆盖本项目旧版可保留存档，与上游原包的私有存档不自动互通。

## 技术路径

- `mobile/android/MainActivity.java`：本地 HTTPS 虚拟域名资源拦截、WebView 生命周期、Android 返回键。
- `mobile/tools/bootstrap.ps1`：从上游 APK 提取资源和原始 MAIN.EXE。
- `mobile/tools/prepare.cjs`：对固定上游 JS 做严格匹配补丁；不可直接套用其他上游版本。生成到 mobile/assets，业务代码应修改 mobile/src。
- `mobile/src/mobile-core.js`：坐标、视口、存档基础字段、水粮程序补丁及 ZIP。
- `mobile-ui.js`：直触/滑鼠、滑动/摇杆/点按、速度、菜单、备份写入及悬浮控件。
- `mobile-motion.js` / `mobile-navigation.js`：方向短脉冲与保守的画面识别寻路。
- `mobile-fleet.js` / `mobile-extras.js` / `mobile-trainer-form.js`：已有船、海员、武器和地图编辑与触屏表单。
- `prepare-catalog.cjs`：从 GRAPH.DAT 解码 25 张原版船图；guide.html 是原创离线入门攻略，不是全角色剧情流程。

布局与存档偏移详见 mobile/docs 下两份结构文档。研究基于 JohanLi/uncharted-waters-2-research 与 genishs/dh2-py-editor，MIT 署名随包保留；Dk2Edit 只作调研。

## 已踩过的坑

1. Windows 打包可能生成反斜杠 ZIP 项，Android AssetManager 找不到页面，表现为 appassets 页面 HTTP 错误。必须保留 build.ps1 的正斜杠打包和 verify-apk.ps1 的逐项校验。
2. 原画布 640×480，但鼠标有效纵向为 440；黑边裁剪时坐标不可简单按可见图高换算。修改全屏必须同时验收原菜单直触。
3. 持续按住方向键会堆积重复输入，换向后仍沿旧方向走。使用可取消短脉冲，换向和失焦先释放。
4. 加速曾让启动音频条件失效导致无声。速度、读档临时恢复正常时钟、音频解锁和用户静音状态须联动。
5. 画面识别节流必须补查最后一帧，否则静止菜单可能漏识别；原生读存档检测不能按显示帧一起节流。
6. 中文存档总长 328991，头长 151，记录跨度 32884，和英文研究不同。不能直接搬英文偏移；必须做记录/对象/范围校验。
7. 修改器写的是磁盘存档，应用后须读取记录；需要保留 mobilePending，防止后台自动保存覆盖刚修改的数据。备份仅保留最近一次应用前的完整十记录文件。
8. 武器新增须空物品格，不能覆盖任务物品；地图保留藏宝、已发现/报告等标记；换船型只改已有船，不修改世界所有船模板或造船厂售卖解锁。
9. 确认/返回为键盘 Enter/Space/Escape，鼠标左右键按光标位置操作，两者不等价。场景判断失败可展开工具使用备用按键。
10. 0.8 悬浮控件会覆盖少量游戏区域；全屏铺满会拉伸原图，可切回等比。摇杆只在已识别城市/航海移动状态显示。
11. 首页图片原先按比例居中，透明加载层会露出 DOSBox。现在背景 cover 铺满、不透明遮挡，按钮另按安全区域布局，沿用实际就绪事件撤下。
12. GitHub 公共源码不能带真实测试 DAT、私钥、账号配置。历史发布出现过 Windows 中文附件名称异常，发布附件统一用 ASCII 名称并核对服务端 digest。

## 构建与复现

需要 Node 20+、JDK 21、Android SDK platform 36/build-tools 36.0.0、PowerShell、tar；不依赖 Gradle。把原 APK 放源码根目录，名称保持 Uncharted-Waters-2-Android-v7.8.apk。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File mobile/tools/build.ps1 -SdkRoot C:/Android/Sdk -JdkRoot C:/Java/jdk-21
node --test mobile/tests/core.test.cjs mobile/tests/mobile04.test.cjs mobile/tests/fleet.test.cjs mobile/tests/extras.test.cjs mobile/tests/frame-scheduling.test.cjs
```

输出 dist/Uncharted-Waters-2-Mobile-0.8.apk。首次构建会生成测试密钥。若要覆盖安装已发布版本，须使用原签名文件，放回 mobile/build/local-test.jks；本地封版的私密备份区保留该文件，不得上传公共仓库。

浏览器预览先 prepare，再运行 mobile/tools/dev-server.cjs。自动化需要 playwright-core 与 Chrome，PLAYWRIGHT_MODULE/CHROME_PATH 可指定绝对路径；--browser 启动专用测试实例，browser.cjs 连接 CDP 9223。实际存档测试通过 UW2_TEST_SAVE 指向本地阿兰初始记录 2，会替换测试浏览器数据，勿在玩家浏览器运行。

## 验证范围与后续优先项

20 个单元测试、246 个 APK 资源逐字节校验、v2/v3 签名通过。历史实跑和本版覆盖范围见 docs/verification.json；不能把历史检查都称为本次重新跑过。

下一版优先：Android 真机低端/高端性能和不同安全区；海上摇杆与海战；各类对话、数量框的悬浮控件；各主角与各城市寻路；连续海上水粮消耗对照；所有武器及地图解锁后长期剧情/藏宝兼容。

本地 Android 模拟器曾在启动前报 Windows 0xC0000135，未完成 Android 运行验收。浏览器截图不是手机截图。点按寻路主要验证塞维尔，未实现跨地图路线、海上自动航行、自动进门。不要宣称全剧情无 bug。

## 本地封版目录约定

成品含当前 APK/源码包/校验；源码含当前提交和 Git bundle；构建原料含上游 APK/GPL 归档和项目生成资源；资料含研究源码、偏移说明、截图与日志；私密区仅用于本机恢复签名及测试复现。私密区不是公开发布附件。封版总清单记录每个文件的相对路径、大小、SHA-256；发布结果另记录 Git commit 和 GitHub 附件链接。
