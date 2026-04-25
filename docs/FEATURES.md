# Mini Atoms 功能文档

## 1. Prompt 生成应用

用户在左侧 Prompt 输入框描述应用需求，点击 Generate 后进入 Agent 生成流程。

示例 Prompt：

```text
Build a support operations dashboard with SLA tracking, assignee workload, and escalation actions.
```

生成完成后，右侧 Sandpack 会显示 React 项目代码和运行预览。

## 2. 模板快捷入口

内置四类模板：

| 模板 | 场景 |
| --- | --- |
| SaaS | 订阅收入、账户健康、流失风险 |
| Commerce | 商品发现、转化指标、购物车 |
| Ops Tool | 工单、SLA、负责人、升级处理 |
| Fitness | 周计划、打卡、目标进度 |

点击模板会填充 Prompt，用户仍可继续编辑。

## 3. Agent 流式状态

生成过程会展示四个 Agent：

| Agent | 角色 | 输出 |
| --- | --- | --- |
| PM | 产品经理 | 产品范围、目标用户、核心能力 |
| Designer | 设计师 | 视觉方向、布局、信息密度 |
| Engineer | 工程师 | React TypeScript 项目文件 |
| Reviewer | 评审者 | 质量检查和自动修复 |

状态通过 SSE 实时返回，前端逐步更新。

## 4. Sandpack React 预览

生成文件被传入 Sandpack：

```text
/App.tsx
/styles.css
/package.json
/README.md
```

评估者可以直接看到：

- 文件树
- 代码编辑器
- 实时运行预览

## 5. Reviewer 自动修复

Reviewer 会自动修复影响预览的常见问题：

- 入口文件缺失。
- CSS 文件缺失。
- CSS 未导入。
- React 组件没有 default export。
- 缺少响应式样式。
- 缺少 package metadata。

修复数量展示在 Quality 区域，具体修复记录展示在工作区上方。

## 6. Refine 二次修改

生成完成后，用户可以输入修改要求，例如：

```text
Make it darker and add a priority queue.
```

系统会结合上一次 Prompt 重新生成项目，并保存为新的历史版本。

## 7. 项目历史

每次成功生成或 Refine 都会自动保存到浏览器 localStorage。

规则：

- 最多保存 12 条。
- 历史只保存在当前浏览器。
- 点击历史项可恢复当时的项目和预览。

## 8. ZIP 导出

点击 ZIP 按钮会导出：

```text
App.tsx
styles.css
package.json
README.md
mini-atoms-result.json
```

导出的 ZIP 可以作为生成项目源码交付或二次开发。

## 9. 可选真实 AI Provider

默认使用本地生成器，保证没有 API Key 时也能运行。

配置以下环境变量后，后端会尝试调用 SiliconFlow 的 Chat Completions 兼容接口，默认模型为 `Pro/zai-org/GLM-5.1`：

```text
LLM_PROVIDER=siliconflow
SILICONFLOW_API_KEY
SILICONFLOW_MODEL=Pro/zai-org/GLM-5.1
```

Provider 失败时会自动回退到本地生成器。
