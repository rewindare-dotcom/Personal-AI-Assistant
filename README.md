# Personal-AI-Assistant

个人 AI 助手项目，基于开源项目 nanoMuse 改造。

原项目为 GPL-3.0-or-later，本项目作为衍生作品同样以此协议发布，详见 LICENSE。

## 目录结构

| 目录 | 内容 | 语言 |
|---|---|---|
| android/ | 手机端：Android 与 iOS 应用 | Kotlin / Swift |
| nanomuse/ | 运行时核心：agent、工具、记忆、协议 | Python |
| cloud/ | 服务端：账号与中继 | Python |
| web/ | 网页控制台 | TypeScript |
| harness/ | 桌面端插件包 | TypeScript |
| docs/ | 技术文档 | Markdown |
| tests/ | 测试 | Python |

## 开发约定

- 唯一开发主线为 main，不建并行分支。
- 改动前先读现有实现，不重复造同类模块。
- 每处改动必须经过编译或测试验证，未验证不得声明完成。

## 协议与来源

原始项目 nanoMuse，作者为 nano-muse 社区。原始协议 GPL-3.0-or-later，本项目继承。第三方组件见 THIRD_PARTY_NOTICES.md。
