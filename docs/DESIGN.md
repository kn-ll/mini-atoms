# Mini Atoms 设计文档

## 1. 背景

ROOT 笔试要求完成一个可运行的 Atoms-Demo：它需要具备类似 Atoms 的能力和 UI 交互体验，通过智能体驱动的方式完成代码或应用生成，并将生成的应用以可视化网页形式展示。

本项目选择实现一个 Mini Atoms：面向“输入想法 -> Agent 生成 React 应用 -> 在线预览 -> 继续修改 -> 导出源码”的完整闭环。

## 2. 产品目标

Mini Atoms 的目标是用有限时间交付一个可体验、可解释、可扩展的 AI App Builder 原型：

1. 用户输入自然语言需求。
2. 系统流式展示 Agent 执行过程。
3. 系统生成 React TypeScript 项目文件。
4. Reviewer 自动检查并修复常见预览错误。
5. 前端通过 Sandpack 展示代码和运行效果。
6. 用户可以继续输入修改要求。
7. 用户可以从历史记录恢复项目。
8. 用户可以导出 ZIP 源码。

## 3. 用户流程

```text
输入 Prompt 或选择模板
  -> 点击 Generate
  -> PM Agent 定义产品范围
  -> Designer Agent 定义信息架构和视觉方向
  -> Engineer Agent 生成 React 文件
  -> Reviewer Agent 检查并修复文件
  -> Sandpack 展示预览与代码
  -> 保存到 History
  -> Refine 或 ZIP 导出
```

## 4. 信息架构

主界面分为两大区域：

| 区域 | 内容 |
| --- | --- |
| 左侧控制区 | Prompt、模板、模式、Generate、历史记录 |
| 右侧工作区 | 标题、操作按钮、Agent 状态、质量摘要、Refine、Sandpack |

这样的结构能让评估者快速看到三个关键信号：输入是什么、Agent 如何工作、最终应用是否可运行。

## 5. Agent 设计

### PM Agent

职责：

- 从 Prompt 推断应用领域。
- 生成产品标题、目标用户、核心能力。
- 输出可供 Designer 和 Engineer 消费的产品范围。

### Designer Agent

职责：

- 根据 Prompt 推断视觉语气：modern、dark、warm、enterprise。
- 规划工作台式布局。
- 控制信息密度，避免只做静态落地页。

### Engineer Agent

职责：

- 生成 React TypeScript 文件。
- 输出 Sandpack 可运行的 `/App.tsx`、`/styles.css`、`/package.json`。
- 避免远程图片和不可控外部资源。

### Reviewer Agent

职责：

- 检查入口文件是否存在。
- 检查 CSS 是否导入。
- 检查默认导出是否存在。
- 检查响应式样式。
- 缺失时自动修复并记录 repairs。

## 6. 技术架构

```text
Browser
  ├─ BuilderShell
  ├─ SSE Reader
  ├─ Sandpack Preview
  ├─ localStorage History
  └─ JSZip Export

Next.js App Router
  ├─ /api/templates
  ├─ /api/generate  text/event-stream
  ├─ /api/refine    text/event-stream
  └─ /api/review

Core Library
  ├─ generator.ts
  ├─ reviewer.ts
  ├─ agents.ts
  ├─ sse.ts
  └─ types.ts
```

## 7. 关键取舍

| 选择 | 原因 |
| --- | --- |
| Next.js App Router | 同时覆盖前端、后端 API、部署，适合笔试交付 |
| TypeScript | 让生成结果、Agent、Review、SSE 数据结构可维护 |
| Sandpack | 浏览器内运行 React 项目，不需要后端执行用户代码 |
| SSE | 可以展示 Agent 实时执行状态，交互更像真实产品 |
| localStorage | 不引入登录和数据库，仍能满足项目历史保存 |
| 本地生成器兜底 | 没有 API Key 时也能完整体验 |

## 8. 安全设计

- 后端不执行用户生成代码。
- Sandpack 在浏览器隔离环境中运行预览。
- API Key 仅通过环境变量读取，不进入前端 bundle。
- Reviewer 只修复项目结构和常见运行问题，不运行任意脚本。
- 历史记录保存在本地浏览器，不上传用户 Prompt。

## 9. 可扩展方向

- 接入真实多 Agent 编排，每个 Agent 独立调用模型。
- 捕获 Sandpack runtime error 后自动调用 Reviewer 再修复。
- 增加 Supabase 登录和云端项目保存。
- 增加模板市场和组件库。
- 增加 GitHub 仓库一键发布。
