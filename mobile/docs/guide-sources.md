# 0.8.1 人物攻略修订

0.8 原攻略只有通用入门内容，不满足人物剧情攻略的需求。0.8.1 首页改为六个人物，提供 57 个关键步骤、条件、卡点、原版头像、行程示意、搜索及手动进度勾选。通用图文说明另保留。

## 主要依据（MIT）

Johan Li 对 DOS 版剧本 SNR1–SNR6.DAT 与 MAIN.EXE 的解码研究，按其文档重新组织为中文玩家步骤；未把英文人名直接当作中文版显示名。源项目附 MIT 许可，现有 mobile/licenses/JohanLi-MIT.txt 继续随 APK 保留。

- [约翰](https://github.com/JohanLi/uncharted-waters-2-research/blob/main/game-details/scenarios/scenario-1-joao-franco.md)
- [卡特琳娜](https://github.com/JohanLi/uncharted-waters-2-research/blob/main/game-details/scenarios/scenario-2-catalina-erantzo.md)
- [奥托](https://github.com/JohanLi/uncharted-waters-2-research/blob/main/game-details/scenarios/scenario-3-otto-baynes.md)
- [恩斯特](https://github.com/JohanLi/uncharted-waters-2-research/blob/main/game-details/scenarios/scenario-4-ernst-von-bohr.md)
- [皮耶德](https://github.com/JohanLi/uncharted-waters-2-research/blob/main/game-details/scenarios/scenario-5-pietro-conti.md)
- [阿兰](https://github.com/JohanLi/uncharted-waters-2-research/blob/main/game-details/scenarios/scenario-6-ali-vezas.md)

## 对照与差异

[PTT 作者实跑整理](https://www.ptt.cc/bbs/Koei/M.1618752726.A.50B.html)、[同文转帖](https://www.ptt.cc/bbs/Old-Games/M.1618753256.A.28D.html) 用于核对中文地名和玩家路线，未逐字转载全文。[卡特琳娜日文资料](https://w.atwiki.jp/offlinedaikoukai/pages/46.html)、[阿兰日文资料](https://w.atwiki.jp/offlinedaikoukai/pages/42.html) 也作对照，包含不同平台的经验，不能直接当成本 APK 的已验证行为。

主线按程序研究保留了容易被旧流程简化的区别：卡特琳娜后期 30,000 海盗声望；阿兰六个达到第 5 天的航次；50 同盟港控制提示而非该章王宫会见的必要检查；恩斯特 40,000 阶段先后访问不同区域码头；皮耶德必须去两个日本港口。中文 DOS 是否所有细节完全一致尚未逐项通关验证，页面明确说明资料依据，随机地点仍以本局对话为准。

## 图像与实现

头像从工作区上游 APK 中 KAO.LZW 的前六条记录解码，未下载其他平台人像。LS11/平面像素解码参考源项目 scripts/ls11/index.ts、scripts/shared.ts（MIT）。原游戏素材权利仍归原权利人，说明见 NOTICE.md。

guide-data.js 保存独立人物步骤；guide-app.js 只在 DOM 内渲染正文，不解释网页脚本或更改游戏数据。勾选按人物保存到本机 localStorage，和游戏存档、任务标志无关；清除按钮只清本人物的阅读勾选。研究来源链接用于溯源，Android 本地资源策略不允许在游戏 WebView 内访问外站，查原文可将地址交给外部浏览器。

验证范围：六页内容、搜索/清空、勾选/重开、图片加载、窄屏布局、离线阅读及游戏内攻略入口需要实际浏览器检查；不能把这些 UI 检查称作六人物全剧情通关。
