# 第三方组件与发布范围

## 模拟器

包内 emulators 标识版本为 **8.5.2**。npm 元数据指向上游提交 `6bbf0925d221a7304ea8e0dda1e89b8dc01569b2`，许可为 GPL-2.0。上游包含 DOSBox / DOSBox-X 等后端。v6.7 修改了 `wdosbox-x.js` 的等待调度，属于必须纳入对应源码核对的本地变化。

- [上游仓库](https://github.com/caiiiycuk/emulators)
- [固定提交](https://github.com/caiiiycuk/emulators/tree/6bbf0925d221a7304ea8e0dda1e89b8dc01569b2)
- [GPL v2 原文](licenses/GPL-2.0.txt)

独立自有内容的非商用、禁止修改条款不限制GPL组件的修改或商业使用权。Releases 同时提供 GPL-Components-v7.8.tar.gz：固定提交的模拟器源码、固定子模块、本地调度补丁、v7.8 前端适配脚本、音频处理器首选源码及补丁、版本对应记录。v7.8 的音频变动包含在 GPL 源码附件中，WASM 与固定上游对应关系另列清单。该归档不是游戏资源包或另一个安装包；对应组件仍适用原许可。

## 前端与原生依赖

运行包可见 React 19.2.3、React Router 7.18.4、core-js 3.30.0 版本标识，以及 Kotlin / AndroidX 原生代码。各组件保留各自许可；许可原文见 licenses 目录；压缩包版本标识不是完整SBOM。

## 原作与素材

原作程序、音乐、图像、字模和商标权利归原权利人。本地原生字体说明明确指出字模来自游戏资产、版权归 KOEI。发布者已确认持有本次资源分发授权；授权依据待发布者另行补充，本仓库不公开私人授权文件。非商业声明本身不替代授权，也不向接收者转授原作资产的修改或再分发权利。本项目不是 KOEI 官方 Android 产品。
