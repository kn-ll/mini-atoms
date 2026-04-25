# Mini Atoms API 文档

Base URL:

```text
http://localhost:3000
```

## GET /api/templates

返回 Prompt 模板。

### Response

```json
{
  "templates": [
    {
      "id": "saas",
      "label": "SaaS",
      "prompt": "Build a subscription analytics SaaS..."
    }
  ]
}
```

## POST /api/generate

根据用户 Prompt 生成应用。该接口返回 `text/event-stream`，前端通过 `fetch` 读取 ReadableStream。

### Request

```json
{
  "prompt": "Build a support operations dashboard with SLA tracking",
  "mode": "balanced"
}
```

### SSE Events

#### agent-start

```json
{
  "id": "pm",
  "name": "产品代理",
  "role": "产品经理",
  "text": "正在把输入整理成产品范围"
}
```

#### agent-delta

```json
{
  "id": "pm",
  "text": "产品范围已整理完成"
}
```

#### review

```json
{
  "score": 100,
  "checks": [
    {
      "name": "React 入口文件",
      "passed": true,
      "detail": "/App.tsx 已存在。"
    }
  ],
  "repairs": []
}
```

#### repair

仅在 Reviewer 做了修复时返回。

```json
{
  "repairs": ["已为 /App.tsx 补充缺失的样式导入。"]
}
```

#### result

```json
{
  "id": "project-uuid",
  "summary": "运营值班台是一个根据需求生成的可运行内部运营 React 原型。",
  "spec": {
    "id": "project-uuid",
    "prompt": "构建一个客服运营看板，包含 SLA 跟踪",
    "mode": "balanced",
    "domain": "internal",
    "tone": "modern",
    "title": "运营值班台",
    "audience": "处理日常业务流转的运营团队",
    "features": ["SLA 总览", "负责人看板"],
    "primaryAction": "创建方案",
    "secondaryAction": "分配负责人",
    "createdAt": "2026-04-25T00:00:00.000Z"
  },
  "agents": [],
  "files": {
    "/App.tsx": "import \"./styles.css\";...",
    "/styles.css": "...",
    "/package.json": "...",
    "/README.md": "..."
  },
  "review": {
    "score": 100,
    "checks": [],
    "repairs": []
  },
  "provider": "compass"
}
```

#### done

```json
{
  "ok": true
}
```

#### error

```json
{
  "message": "prompt is required"
}
```

## POST /api/refine

基于上一次项目和用户修改要求重新生成。

### Request

```json
{
  "prompt": "Make it darker and add a priority queue.",
  "previousPrompt": "Build a support operations dashboard with SLA tracking",
  "previousFiles": {
    "/App.tsx": "..."
  },
  "mode": "polished"
}
```

### Response

同 `/api/generate`，返回 `text/event-stream`。

## POST /api/review

检查并修复生成文件。

### Request

```json
{
  "files": {
    "/App.tsx": "function App(){return <h1>Hello</h1>}",
    "/styles.css": "body{margin:0}"
  }
}
```

### Response

```json
{
  "files": {
    "/App.tsx": "import \"./styles.css\";\nfunction App(){return <h1>Hello</h1>}\nexport default App;",
    "/styles.css": "body{margin:0}\n@media..."
  },
  "review": {
    "score": 100,
    "checks": [],
    "repairs": [
      "Added missing styles import to /App.tsx.",
      "Added missing default export for Sandpack."
    ]
  }
}
```

## curl 示例

```bash
curl -sS http://localhost:3000/api/templates
```

```bash
curl -N -X POST http://localhost:3000/api/generate \
  -H 'content-type: application/json' \
  -d '{"prompt":"Build a support operations dashboard with SLA tracking","mode":"balanced"}'
```

```bash
curl -sS -X POST http://localhost:3000/api/review \
  -H 'content-type: application/json' \
  -d '{"files":{"/App.tsx":"function App(){return <h1>Hello</h1>}","/styles.css":"body{margin:0}"}}'
```
