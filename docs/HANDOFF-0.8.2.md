# 0.8.2 封版交接（2026-11-03）

项目的基础架构、构建环境和历史坑点沿用 [0.8 技术交接](HANDOFF-0.8.md)。本文件补充人物攻略改动与本次发布范围。

版本：0.8.2-mobile，versionCode 12，包名 org.local.uw2mobile，Android 8.0+；测试证书与历史适配版一致。成品 dist/Uncharted-Waters-2-Mobile-0.8.2.apk，SHA-256 为 `02c769bbfea115c980bc44f0c228fbedeb58b38e538e7ae1bb59f1c1a0ef7f25`。

## 本次变化

- 攻略入口位于展开工具第一层，与菜单、修改器平级。mobile-ui.js 不再在菜单中重复放置入口。
- guide.html：六人物选择与通用攻略版面；guide-data.js：六条人物关键流程共 57 步；guide-app.js：人物切换、搜索、阅读勾选与来源链接。
- prepare.cjs 复制新增的两个攻略脚本；prepare-catalog.cjs 从本地 APK 的 KAO.LZW 解码六张原版头像。新增资源必须随 Android 正斜杠路径打包，verify-apk.ps1 已加入检查。
- 阅读勾选使用 uw2-guide-checks-v1，人物记忆用 uw2-guide-character-v1，均为 WebView localStorage。它们与游戏 DAT、人物剧情旗标无关，不区分各条存档。

## 资料与边界

主要依据是 Johan Li 的六个 DOS 剧本解码文档，MIT 许可继续随 APK 保留。来源、对照资料及版本差异见 [攻略来源](../mobile/docs/guide-sources.md)，六篇研究文档的内容哈希见 guide-source-manifest.json。

涉及随机港口时必须按当前游戏对话找线索，不能固化成某个攻略作者存档里的地点。部分条件与老攻略表述不同，已在对应人物中指出。资料核对不能代替中文版逐人物通关验收；下一轮优先验证阿兰航次计数、王宫召见、恩斯特区域码头顺序和各人物终章。

## 本次验证与运行方式

20 项 Node 单元测试通过；APK 的 254 个资源路径、长度与 SHA-256 内容一致，v2/v3 签名通过，应用名、包名、版本号核对通过。

浏览器验收脚本 mobile/tests/guide-ui.cjs 检查六个人物与结局、57 步计数、头像、搜索/空结果、勾选重开与清除、1000×600 / 640×360 / 390×750 布局、只允许本地请求，以及真实 DOS 游戏中工具 → 攻略入口与返回。

本机预览先运行 `node mobile/tools/dev-server.cjs`。浏览器测试需独立 context，单页快捷创建的 owned context 不允许继续 newPage；新运行时的 CDP 代理也可能不支持 Browser.setDownloadBehavior，因此可直接用 playwright-core 启动专用 headless Chrome，创建 context/page 后调用 guide-ui.cjs。通过 UW2_TEST_SAVE 提供本机测试用中文版阿兰记录 2；脚本会替换测试浏览器的存档，只可用于专用测试环境。

真机性能、所有场景和长剧情仍未验收。此次不改变剧情程序与存档修改偏移，原 0.8 的未验收项仍保留在验证记录。

## 封版与恢复

F:/aiworkfb 下使用独立 0.8.2 版本目录，包含 APK、精确源码包、Git bundle、文档、上游固定原料、生成资源、研究资料、截图、构建工具和逐文件哈希。仅本地私密备份区保留覆盖安装需要的签名及测试存档，禁止将该区随公开源码上传；GitHub 只发布审查后的源码与 Release 附件。

先复制封版到工作目录，再运行 07-构建工具/重建.ps1，避免改变原封版；源码入口与工具路径按该脚本设置。
