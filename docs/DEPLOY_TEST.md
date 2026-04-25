# Mini Atoms 部署/测试文档

## 1. 环境要求

```text
Node.js >= 20
npm >= 10
```

## 2. 本地启动

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

## 3. 生产构建

```bash
npm run build
npm run start
```

默认生产地址：

```text
http://localhost:3000
```

## 4. Vercel 部署

推荐部署到 Vercel。

步骤：

1. 推送代码到 GitHub。
2. 在 Vercel 新建项目并选择该仓库。
3. Framework Preset 选择 Next.js。
4. Build Command 使用 `npm run build`。
5. Output Directory 保持默认。
6. 如需真实模型，在 Environment Variables 中配置：

```text
OPENAI_API_KEY
OPENAI_BASE_URL
OPENAI_MODEL
```

## 5. API 测试

### 模板接口

```bash
curl -sS http://localhost:3000/api/templates
```

### Reviewer 接口

```bash
curl -sS -X POST http://localhost:3000/api/review \
  -H 'content-type: application/json' \
  -d '{"files":{"/App.tsx":"function App(){return <h1>Hello</h1>}","/styles.css":"body{margin:0}"}}'
```

预期：

- 返回 `files`。
- 返回 `review.score`。
- `review.repairs` 包含 CSS import、default export 或 responsive 修复记录。

### SSE 生成接口

```bash
curl -N -X POST http://localhost:3000/api/generate \
  -H 'content-type: application/json' \
  -d '{"prompt":"Build a support operations dashboard with SLA tracking","mode":"balanced"}'
```

预期会看到：

```text
event: agent-start
event: agent-delta
event: review
event: result
event: done
```

## 6. 手动功能测试清单

| 测试项 | 预期 |
| --- | --- |
| 打开首页 | 页面显示 Prompt、模板、Agent、Sandpack |
| 点击模板 | Prompt 被替换为模板内容 |
| 点击 Generate | Agent 状态逐步变化 |
| 生成完成 | Sandpack 显示 React 应用 |
| Quality | 显示 Review 分数 |
| Refine | 生成一个新的历史版本 |
| History | 点击历史项恢复项目 |
| ZIP | 浏览器下载生成源码 ZIP |
| 移动端宽度 | 控制区和工作区纵向排列 |

## 7. TypeScript 检查

```bash
npm run typecheck
```

## 8. 构建检查

```bash
npm run build
```

## 9. 已知限制

- localStorage 历史仅在当前浏览器可见。
- 默认本地生成器是确定性原型生成，不等同于完整 LLM 编程能力。
- Sandpack runtime error 目前由 Sandpack UI 展示，自动二次修复接口已具备，尚未接入 runtime error 自动回传。
