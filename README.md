# Mini Atoms

Mini Atoms 是一个面向 ROOT 全栈笔试要求的 Atoms-Demo：用户输入应用想法后，系统用 PM、Designer、Engineer、Reviewer 四个 Agent 生成一个可运行的 React 项目，并通过 Sandpack 在浏览器内实时预览。

## 已实现能力

- Next.js + TypeScript 重构。
- Agent Pipeline：PM / Designer / Engineer / Reviewer。
- SSE 流式返回 Agent 执行状态。
- Sandpack 预览 React TypeScript 项目。
- Reviewer 自动检查并修复常见运行问题。
- Prompt 生成与 Refine 二次修改。
- 项目历史保存到浏览器 localStorage。
- ZIP 导出生成项目源码。
- 可选 DeepSeek `deepseek-v4-flash` 模型接入，未配置时使用本地确定性生成器。

## 技术栈

| 层 | 技术 |
| --- | --- |
| Web 框架 | Next.js App Router |
| 语言 | TypeScript |
| UI | React + CSS Modules style global CSS |
| 预览 | `@codesandbox/sandpack-react` |
| 流式输出 | SSE over `fetch` ReadableStream |
| ZIP 导出 | JSZip |
| 图标 | lucide-react |
| AI Provider | DeepSeek Chat Completions 兼容接口，可选 |
| 历史保存 | Browser localStorage |

## 快速开始

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

## 环境变量

默认不需要 API Key，会使用本地生成器，保证 Demo 可稳定体验。

如需接入 DeepSeek 的 `deepseek-v4-flash` 模型，复制 `.env.example` 为 `.env.local`：

```bash
LLM_PROVIDER=deepseek
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_API_KEY=your_api_key
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_TIMEOUT_MS=295000
```

`DEEPSEEK_TIMEOUT_MS` 默认是 `295000`，用于兼容 Vercel Hobby 的 300 秒上限。
如果你的部署环境允许更长函数执行时间，可以按需调大。
`DEEPSEEK_BASE_URL` 默认使用 DeepSeek 官方兼容接口地址，通常不需要修改。

## 目录结构

```text
atoms-demo/
  app/
    api/
      generate/route.ts    # SSE 生成接口
      refine/route.ts      # SSE 二次修改接口
      review/route.ts      # Reviewer 检查/修复接口
      templates/route.ts   # 模板接口
    globals.css
    layout.tsx
    page.tsx
  components/
    builder-shell.tsx      # 主产品界面
  lib/
    agents.ts              # Agent 定义与结果
    generator.ts           # 需求推断、代码生成、AI Provider 接入
    reviewer.ts            # 自动检查与修复
    sse.ts                 # SSE 响应工具
    templates.ts           # Prompt 模板
    types.ts               # 共享类型
  docs/
    DESIGN.md
    IMPLEMENTATION.md
    FEATURES.md
    DEPLOY_TEST.md
    API.md
    SUBMISSION.md
```

## 文档

- [设计文档](docs/DESIGN.md)
- [实现文档](docs/IMPLEMENTATION.md)
- [功能文档](docs/FEATURES.md)
- [部署/测试文档](docs/DEPLOY_TEST.md)
- [API 文档](docs/API.md)
- [笔试提交说明](docs/SUBMISSION.md)

## 核心流程

```text
User Prompt
  -> /api/generate SSE
  -> PM Agent scope
  -> Designer Agent UI plan
  -> Engineer Agent React files
  -> Reviewer repair
  -> Sandpack preview
  -> History save
  -> ZIP export
```
