# 来源、权利与组件说明

本仓库保存针对上游 Android v7.8 的本地适配源码、构建脚本和验收记录；不是原游戏权利人的官方产品。

- 基础 APK：[maxleolee-eng/Uncharted-Waters-2-Android](https://github.com/maxleolee-eng/Uncharted-Waters-2-Android)。原版游戏资源不作为松散文件提交到 Git，构建时从用户自行准备的 v7.8 APK 提取。
- 上游作者的 [原始许可文本](docs/upstream/LICENSE.txt) 与 [第三方说明](docs/upstream/THIRD_PARTY_NOTICES.md) 原样保留。它们的作者声明属于上游说明，不代表本仓库另行取得或转授原作及上游素材的公开分发、修改或再许可权利。
- 原作程序、人物、地图、音频、字模、名称与商标归各自权利人所有。非商业使用声明不等于原作授权。
- Johan Li 的存档研究和 genishs 的编辑器参考实现适用 MIT：见 [JohanLi-MIT.txt](mobile/licenses/JohanLi-MIT.txt)、[genishs-MIT.txt](mobile/licenses/genishs-MIT.txt)。Dk2Edit 的 Windows 可执行文件未嵌入，也未作为本仓库源码发布。
- DOSBox / DOSBox-X / js-dos emulators 相关组件继续适用各自许可，GPL 权利不受上游独立素材许可的非商业条款限制。v0.6.1 未修改 v7.8 的模拟器二进制；[本版本 Release](https://github.com/creamycalf/Uncharted-Waters2/releases/tag/v0.6.1) 同时附上原样保留的 `GPL-Components-v7.8.tar.gz`。它包含上游固定源码、子模块和本地补丁，不是游戏资源包。此次新增适配源码位于本仓库。
- 港口行情面板使用上游 v8.9 GPL-2.0 前端组件中的 `trade-core.js` 与 `port-goods.json`，并依据 `world-position.js` 的只读 worker 内存观察方式适配本地输入测试工程。来源为 [v8.9 Release](https://github.com/maxleolee-eng/Uncharted-Waters-2-Android/releases/tag/v8.9) 附件 `GPL-Components-v8.9.tar.gz`；归档 SHA-256 为 `e693a88650fe15d239c1550771ebeac60e3069cfd85676ee1351041d74d29290`。本地行情代码在 `mobile/src/mobile-market-core.js`、`mobile/src/mobile-market.js`，港口/商品表在 `mobile/src/port-goods.json`；完整 GPL-2.0 文本位于 `docs/upstream/licenses/GPL-2.0.txt`，构建后随 APK 放在 `assets/release-docs/licenses/GPL-2.0.txt`。上游独立 UI/原作素材不包含于此授权说明。
- APK 内 `assets/release-docs/` 保留上游许可、第三方归属说明及两份修改器参考实现的 MIT 文本。

本仓库不将整个游戏、APK 或上游专有素材宣称为 MIT、GPL 或公有领域。需要使用或再分发相关内容时，应分别核对对应权利及许可。

## KOEI / 光荣特库摩权利声明

本项目是非官方适配与研究项目，与光荣特库摩（KOEI TECMO）、《大航海时代Ⅱ》原作权利人及其关联方不存在隶属、合作或背书关系。原作名称、程序、图像、音乐、人物、地图、文字字模、商标及其他原作内容的权利归各自权利人所有。本仓库中任何代码许可、个人或非商业用途说明，都不延伸至原作内容，也不构成原作资产的使用、修改或传播授权；此类说明本身不当然免除使用者依法应承担的责任。构建所需的原版 APK 和提取的游戏数据应由使用者自行准备，不应提交到本仓库；发布或传播原作资产前，应另行确认已取得所需授权。

- `mobile/src/port-goods-simplified.json` 从上述 v8.9 中文港口和商品表使用 ICU Traditional-Simplified 转换生成；原始表仍原样保留。
