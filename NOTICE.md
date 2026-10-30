# 来源、权利与组件说明

本仓库保存针对上游 Android v7.8 的本地适配源码、构建脚本和验收记录；不是原游戏权利人的官方产品。

- 基础 APK：[maxleolee-eng/Uncharted-Waters-2-Android](https://github.com/maxleolee-eng/Uncharted-Waters-2-Android)。原版游戏资源不作为松散文件提交到 Git，构建时从用户自行准备的 v7.8 APK 提取。
- 上游作者的 [原始许可文本](docs/upstream/LICENSE.txt) 与 [第三方说明](docs/upstream/THIRD_PARTY_NOTICES.md) 原样保留。它们的作者声明属于上游说明，不代表本仓库另行取得或转授原作及上游素材的公开分发、修改或再许可权利。
- 原作程序、人物、地图、音频、字模、名称与商标归各自权利人所有。非商业使用声明不等于原作授权。
- Johan Li 的存档研究和 genishs 的编辑器参考实现适用 MIT：见 [JohanLi-MIT.txt](mobile/licenses/JohanLi-MIT.txt)、[genishs-MIT.txt](mobile/licenses/genishs-MIT.txt)。Dk2Edit 的 Windows 可执行文件未嵌入，也未作为本仓库源码发布。
- DOSBox / DOSBox-X / js-dos emulators 相关组件继续适用各自许可，GPL 权利不受上游独立素材许可的非商业条款限制。v0.6.1 未修改 v7.8 的模拟器二进制；[本版本 Release](https://github.com/creamycalf/Uncharted-Waters2/releases/tag/v0.6.1) 同时附上原样保留的 `GPL-Components-v7.8.tar.gz`。它包含上游固定源码、子模块和本地补丁，不是游戏资源包。此次新增适配源码位于本仓库。
- APK 内 `assets/release-docs/` 保留上游许可、第三方归属说明及两份修改器参考实现的 MIT 文本。

本仓库不将整个游戏、APK 或上游专有素材宣称为 MIT、GPL 或公有领域。需要使用或再分发相关内容时，应分别核对对应权利及许可。
