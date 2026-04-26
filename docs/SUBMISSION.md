# ROOT 全栈岗位笔试提交说明

## 项目名称

Mini Atoms

## 项目简介

Mini Atoms 是一个 AI Native App Builder 原型。用户输入自然语言需求后，系统通过 PM、Designer、Engineer、Reviewer 四个 Agent 生成一个可运行的 React TypeScript 项目，并通过 Sandpack 在页面内展示代码和实时预览。

## 对笔试要求的覆盖

| 要求 | 实现 |
| --- | --- |
| 可运行网页应用 | Next.js 应用，可本地运行和部署 |
| 类似 Atoms 的能力与 UI 交互体验 | Prompt 输入、Agent 流程、应用生成、预览、Refine |
| 智能体驱动代码/应用生成 | PM / Designer / Engineer / Reviewer Pipeline |
| 生成应用可视化展示 | Sandpack React 项目预览 |
| 可访问链接 | 部署后填写 |
| GitHub 源码链接 | 提交后填写 |
| 简要说明文档 | README 和 docs 目录 |

## 本次增强点

- Next.js + TypeScript 重构。
- Sandpack 预览 React 项目。
- SSE 流式返回 Agent 输出。
- Reviewer 自动修复代码错误。
- 项目历史保存。
- ZIP 导出生成项目源码。
- 可选 SiliconFlow `Pro/moonshotai/Kimi-K2.6` Provider。

## 技术选型

| 模块 | 技术 |
| --- | --- |
| 前端 | React + TypeScript |
| 框架 | Next.js App Router |
| 预览 | Sandpack |
| 流式输出 | SSE over fetch ReadableStream |
| 导出 | JSZip |
| 历史 | localStorage |
| AI | SiliconFlow `Pro/moonshotai/Kimi-K2.6` Provider + 本地兜底生成器 |

## 运行方式

```bash
npm install
npm run dev
```

访问：

```text
http://localhost:3000
```

## 部署方式

推荐 Vercel：

```bash
npm run build
```

部署环境变量可选：

```text
LLM_PROVIDER=siliconflow
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_API_KEY
SILICONFLOW_MODEL=Pro/moonshotai/Kimi-K2.6
```

不配置模型时，项目使用本地确定性生成器，仍可完整体验。

## 项目链接

- 已部署可测试链接：待填写
- GitHub 源码链接：待填写
- 笔试文档链接：待填写

## 已知限制

- 历史记录保存在当前浏览器 localStorage，未做云端同步。
- 默认生成器用于保证 Demo 稳定，不等价于完整生产级 AI 代码生成。
- Sandpack runtime error 自动回传 Reviewer 是下一步扩展方向。
