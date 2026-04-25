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
  "name": "Emma",
  "role": "Product Manager",
  "text": "Turning the prompt into product scope"
}
```

#### agent-delta

```json
{
  "id": "pm",
  "text": "Product scope ready"
}
```

#### review

```json
{
  "score": 100,
  "checks": [
    {
      "name": "React entry file",
      "passed": true,
      "detail": "/App.tsx is present."
    }
  ],
  "repairs": []
}
```

#### repair

仅在 Reviewer 做了修复时返回。

```json
{
  "repairs": ["Added missing styles import to /App.tsx."]
}
```

#### result

```json
{
  "id": "project-uuid",
  "summary": "OpsPilot Console is a runnable internal React prototype generated from the prompt.",
  "spec": {
    "id": "project-uuid",
    "prompt": "Build a support operations dashboard with SLA tracking",
    "mode": "balanced",
    "domain": "internal",
    "tone": "modern",
    "title": "OpsPilot Console",
    "audience": "operations teams resolving daily work",
    "features": ["SLA overview", "Assignee board"],
    "primaryAction": "Create Plan",
    "secondaryAction": "Assign Owner",
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
  "provider": "local"
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
