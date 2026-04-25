# Mini Atoms 实现文档

## 1. 工程重构

本次实现为 Next.js + TypeScript 项目：

```text
app/            Next.js App Router 页面与 API
components/     React Client Component
lib/            业务逻辑、类型、Agent、SSE、Reviewer
docs/           交付文档
```

当前启动链路以 `npm run dev`、`npm run build`、`npm run start` 为准。

## 2. 前端实现

主界面位于：

```text
components/builder-shell.tsx
```

核心职责：

- 管理 Prompt、模式、Refine 输入。
- 调用 `/api/generate` 和 `/api/refine`。
- 解析 SSE 事件并更新 Agent 状态。
- 将生成文件传给 Sandpack。
- 将项目保存到 localStorage。
- 使用 JSZip 导出生成项目。

### SSE 解析

前端没有使用 `EventSource`，因为生成接口需要 POST body。实现方式是：

```text
fetch POST
  -> response.body.getReader()
  -> TextDecoder
  -> 按 "\n\n" 切分 SSE block
  -> 读取 event/data
```

这样既支持请求体，也支持流式体验。

### Sandpack 预览

使用：

```tsx
<SandpackProvider template="react-ts" files={files}>
  <SandpackLayout>
    <SandpackFileExplorer />
    <SandpackCodeEditor />
    <SandpackPreview />
  </SandpackLayout>
</SandpackProvider>
```

生成文件至少包含：

```text
/App.tsx
/styles.css
/package.json
/README.md
```

## 3. 后端实现

### /api/generate

位置：

```text
app/api/generate/route.ts
```

职责：

1. 接收 Prompt 和 mode。
2. 发送 Agent start/delta SSE 事件。
3. 调用 `generateProject`。
4. 发送 Review、Repair、Result 事件。

### /api/refine

位置：

```text
app/api/refine/route.ts
```

职责：

- 基于上一次 Prompt 和用户修改要求组合新的 Prompt。
- 复用生成、Review 和 SSE 逻辑。

### /api/review

位置：

```text
app/api/review/route.ts
```

职责：

- 接收 files。
- 调用 Reviewer。
- 返回修复后的 files 和 review。

## 4. 生成器实现

位置：

```text
lib/generator.ts
```

生成器分两层：

| 层 | 说明 |
| --- | --- |
| Compass Provider | 参考 `deep_reasoning_debate`，默认 `LLM_PROVIDER=compass`，配置 `COMPASS_API_KEY` 后启用 `glm-5` |
| Local Generator | 默认启用，保证无 API Key 时仍可体验 |

本地生成器会根据 Prompt 推断：

- domain：commerce、fitness、internal、saas、workspace
- tone：modern、dark、warm、enterprise
- features
- metrics
- rows
- React + CSS 文件

## 5. Reviewer 实现

位置：

```text
lib/reviewer.ts
```

Reviewer 执行检查和修复：

| 检查项 | 修复方式 |
| --- | --- |
| 缺少 `/App.tsx` | 创建 fallback React 入口 |
| 缺少 `/styles.css` | 创建 fallback CSS |
| 未导入 CSS | 在 `/App.tsx` 顶部添加 `import "./styles.css"` |
| 缺少 default export | 添加 `export default App` 或替换为 fallback |
| 缺少响应式 CSS | 追加移动端 media query |
| 缺少 package metadata | 创建 `/package.json` |

修复记录会进入 `review.repairs`，前端显示并写入历史。

## 6. 历史保存

历史保存在浏览器 localStorage：

```text
mini-atoms-history-v2
```

保存策略：

- 每次生成或 Refine 成功后保存。
- 最多保存 12 条。
- 点击历史项可恢复项目、Review、Agent 状态。

## 7. ZIP 导出

导出位于前端：

```text
components/builder-shell.tsx
```

实现：

1. 创建 JSZip 实例。
2. 写入所有 generated files。
3. 写入 `mini-atoms-result.json`。
4. 生成 Blob。
5. 触发浏览器下载。

## 8. 错误处理

- API body 非法时返回 SSE error。
- Provider 失败时自动回退本地生成器。
- 前端读取 SSE 失败时将 Reviewer Agent 标记为 error。
- Sandpack 运行错误由 Sandpack 自身展示，后续可扩展为自动捕获并调用 `/api/review`。
