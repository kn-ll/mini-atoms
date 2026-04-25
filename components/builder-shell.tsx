"use client";

import { SandpackCodeEditor, SandpackFileExplorer, SandpackLayout, SandpackPreview, SandpackProvider } from "@codesandbox/sandpack-react";
import JSZip from "jszip";
import { Clock3, Download, History, Loader2, Play, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { agentDefinitions } from "@/lib/agents";
import type {
  AgentDefinition,
  AgentId,
  AgentStatus,
  GenerateRequest,
  GeneratedFiles,
  GeneratedProject,
  GenerationMode,
  ReviewResult,
  StreamEventName,
  TemplatePrompt
} from "@/lib/types";

const historyKey = "mini-atoms-history-v2";

type AgentView = AgentDefinition & {
  status: AgentStatus;
  text: string;
};

type ParsedStreamEvent = {
  event: StreamEventName;
  data: unknown;
};

const starterFiles: GeneratedFiles = {
  "/App.tsx": `import "./styles.css";

export default function App() {
  return (
    <main className="starter-preview">
      <section>
        <p className="eyebrow">Mini Atoms</p>
        <h1>可以开始生成了</h1>
        <p>输入你的产品想法，然后启动智能体流水线。</p>
      </section>
    </main>
  );
}
`,
  "/styles.css": `.starter-preview {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background: #f5f7fa;
  color: #1d232b;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.starter-preview section {
  width: min(620px, 100%);
  padding: 28px;
  border: 1px solid #dbe2ea;
  border-radius: 8px;
  background: white;
}

.eyebrow {
  color: #0b8f83;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}
`
};

function initialAgents(): AgentView[] {
  return agentDefinitions.map((agent) => ({
    ...agent,
    status: "queued",
    text: agent.queued
  }));
}

function updateAgent(agents: AgentView[], id: AgentId, status: AgentStatus, text: string): AgentView[] {
  return agents.map((agent) => (agent.id === id ? { ...agent, status, text } : agent));
}

function isAgentId(value: unknown): value is AgentId {
  return value === "pm" || value === "designer" || value === "engineer" || value === "reviewer";
}

function isProject(value: unknown): value is GeneratedProject {
  return Boolean(value && typeof value === "object" && "files" in value && "spec" in value);
}

function isReview(value: unknown): value is ReviewResult {
  return Boolean(value && typeof value === "object" && "score" in value && "checks" in value);
}

function parseSseChunk(block: string): ParsedStreamEvent | null {
  const lines = block.split("\n");
  const eventLine = lines.find((line) => line.startsWith("event:"));
  const dataLines = lines.filter((line) => line.startsWith("data:"));
  if (!eventLine || dataLines.length === 0) {
    return null;
  }

  const event = eventLine.replace("event:", "").trim() as StreamEventName;
  const rawData = dataLines.map((line) => line.replace("data:", "").trim()).join("\n");
  return {
    event,
    data: JSON.parse(rawData)
  };
}

async function readAgentStream(
  endpoint: string,
  payload: GenerateRequest,
  onEvent: (event: ParsedStreamEvent) => void
) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok || !response.body) {
    throw new Error(await response.text());
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() || "";

    for (const block of blocks) {
      const parsed = parseSseChunk(block);
      if (parsed) {
        onEvent(parsed);
      }
    }
  }
}

function loadStoredHistory(): GeneratedProject[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(historyKey);
    return raw ? (JSON.parse(raw) as GeneratedProject[]) : [];
  } catch {
    return [];
  }
}

function storeHistory(projects: GeneratedProject[]) {
  window.localStorage.setItem(historyKey, JSON.stringify(projects.slice(0, 12)));
}

export function BuilderShell() {
  const [templates, setTemplates] = useState<TemplatePrompt[]>([]);
  const [prompt, setPrompt] = useState("构建一个客服运营看板，包含 SLA 跟踪、负责人负载和升级处理动作。");
  const [refinePrompt, setRefinePrompt] = useState("");
  const [mode, setMode] = useState<GenerationMode>("balanced");
  const [busy, setBusy] = useState(false);
  const [agents, setAgents] = useState<AgentView[]>(initialAgents);
  const [project, setProject] = useState<GeneratedProject | null>(null);
  const [history, setHistory] = useState<GeneratedProject[]>([]);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repairLog, setRepairLog] = useState<string[]>([]);

  useEffect(() => {
    setHistory(loadStoredHistory());
    fetch("/api/templates")
      .then((response) => response.json())
      .then((data: { templates: TemplatePrompt[] }) => setTemplates(data.templates))
      .catch(() => setTemplates([]));
  }, []);

  const files = useMemo(() => project?.files || starterFiles, [project]);
  const visibleFiles = useMemo(() => Object.keys(files), [files]);

  function persistProject(nextProject: GeneratedProject) {
    setProject(nextProject);
    setReview(nextProject.review);
    setRepairLog(nextProject.review.repairs);
    setAgents(
      agentDefinitions.map((agent) => {
        const run = nextProject.agents.find((item) => item.id === agent.id);
        return {
          ...agent,
          status: run?.status || "done",
          text: run?.output || agent.done
        };
      })
    );

    setHistory((previous) => {
      const next = [nextProject, ...previous.filter((item) => item.id !== nextProject.id)].slice(0, 12);
      storeHistory(next);
      return next;
    });
  }

  async function run(endpoint: "/api/generate" | "/api/refine", payload: GenerateRequest) {
    setBusy(true);
    setError(null);
    setReview(null);
    setRepairLog([]);
    setAgents(initialAgents());

    try {
      await readAgentStream(endpoint, payload, ({ event, data }) => {
        if (event === "agent-start" && typeof data === "object" && data) {
          const payloadData = data as { id?: unknown; text?: unknown };
          if (!isAgentId(payloadData.id)) {
            return;
          }
          const agentId = payloadData.id;
          const text = typeof payloadData.text === "string" ? payloadData.text : "执行中";
          setAgents((current) => updateAgent(current, agentId, "running", text));
        }

        if (event === "agent-delta" && typeof data === "object" && data) {
          const payloadData = data as { id?: unknown; text?: unknown };
          if (!isAgentId(payloadData.id)) {
            return;
          }
          const agentId = payloadData.id;
          const text = typeof payloadData.text === "string" ? payloadData.text : "已完成";
          setAgents((current) => updateAgent(current, agentId, "done", text));
        }

        if (event === "review" && isReview(data)) {
          setReview(data);
        }

        if (event === "repair" && typeof data === "object" && data && "repairs" in data && Array.isArray(data.repairs)) {
          setRepairLog(data.repairs.filter((item): item is string => typeof item === "string"));
        }

        if (event === "result" && isProject(data)) {
          persistProject(data);
        }

        if (event === "error" && typeof data === "object" && data && "message" in data && typeof data.message === "string") {
          throw new Error(data.message);
        }
      });
    } catch (streamError) {
      const message = streamError instanceof Error ? streamError.message : "生成失败";
      setError(message);
      setAgents((current) => updateAgent(current, "reviewer", "error", message));
    } finally {
      setBusy(false);
    }
  }

  async function exportZip() {
    if (!project) {
      return;
    }

    const zip = new JSZip();
    Object.entries(project.files).forEach(([path, content]) => {
      zip.file(path.replace(/^\//, ""), content);
    });
    zip.file("mini-atoms-result.json", JSON.stringify(project, null, 2));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.spec.title
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "-")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "mini-atoms"}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const canRefine = Boolean(project && refinePrompt.trim() && !busy);

  return (
    <main className="builder-shell">
      <aside className="control-rail">
        <div className="brand-row">
          <div className="brand-mark">MA</div>
          <div>
            <strong>Mini Atoms</strong>
            <span>智能体应用生成器</span>
          </div>
        </div>

        <section className="control-block">
          <div className="section-head">
            <label htmlFor="prompt">需求描述</label>
            <Sparkles size={16} aria-hidden="true" />
          </div>
          <textarea id="prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        </section>

        <section className="control-block">
          <span className="field-label">快捷模板</span>
          <div className="template-grid">
            {templates.map((template) => (
              <button key={template.id} type="button" onClick={() => setPrompt(template.prompt)}>
                {template.label}
              </button>
            ))}
          </div>
        </section>

        <section className="control-block">
          <span className="field-label">生成模式</span>
          <div className="segment-control">
            <button type="button" className={mode === "balanced" ? "active" : ""} onClick={() => setMode("balanced")}>
              平衡
            </button>
            <button type="button" className={mode === "polished" ? "active" : ""} onClick={() => setMode("polished")}>
              精修
            </button>
          </div>
        </section>

        <button
          className="primary-action"
          type="button"
          disabled={busy || !prompt.trim()}
          onClick={() => run("/api/generate", { prompt, mode })}
        >
          {busy ? <Loader2 className="spin" size={18} /> : <Wand2 size={18} />}
          <span>{busy ? "生成中" : "开始生成"}</span>
        </button>

        <section className="history-block">
          <div className="section-head">
            <span className="field-label">历史记录</span>
            <History size={16} aria-hidden="true" />
          </div>
          <div className="history-list">
            {history.length === 0 ? (
              <p>还没有保存过项目。</p>
            ) : (
              history.map((item) => (
                <button key={item.id} type="button" onClick={() => persistProject(item)}>
                  <Clock3 size={15} aria-hidden="true" />
                  <span>{item.spec.title}</span>
                  <small>
                    {new Date(item.spec.createdAt).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false
                    })}
                  </small>
                </button>
              ))
            )}
          </div>
        </section>
      </aside>

      <section className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">AI 原生原型</p>
            <h1>{project?.spec.title || "Atoms 原型工坊"}</h1>
          </div>
          <div className="toolbar">
            <button
              type="button"
              onClick={() =>
                project &&
                run("/api/refine", {
                  prompt: "优化视觉层级，保持当前功能范围不变。",
                  previousPrompt: project.spec.prompt,
                  previousFiles: project.files,
                  mode
                })
              }
              disabled={busy || !project}
              title="快速优化当前原型"
            >
              <RefreshCw size={17} />
              <span>快速优化</span>
            </button>
            <button type="button" onClick={exportZip} disabled={!project} title="将生成结果导出为 ZIP">
              <Download size={17} />
              <span>导出 ZIP</span>
            </button>
          </div>
        </header>

        <section className="agent-strip" aria-label="智能体状态">
          {agents.map((agent) => (
            <article key={agent.id} data-status={agent.status}>
              <span>智能体</span>
              <strong>{agent.role}</strong>
              <p>{agent.text}</p>
            </article>
          ))}
        </section>

        {error ? <div className="error-banner">{error}</div> : null}

        <section className="review-row">
          <article>
            <span>质量评分</span>
            <strong>{review?.score ?? project?.review.score ?? 0}%</strong>
          </article>
          <article>
            <span>生成来源</span>
            <strong>{project?.provider === "compass" ? "Compass glm-5" : "本地生成器"}</strong>
          </article>
          <article>
            <span>修复项</span>
            <strong>{repairLog.length}</strong>
          </article>
        </section>

        {project?.providerNote ? <div className="provider-note">{project.providerNote}</div> : null}

        <section className="refine-bar">
          <input
            value={refinePrompt}
            onChange={(event) => setRefinePrompt(event.target.value)}
            placeholder="输入进一步优化要求"
          />
          <button
            type="button"
            disabled={!canRefine}
            onClick={() => {
              if (!project) {
                return;
              }
              run("/api/refine", {
                prompt: refinePrompt,
                previousPrompt: project.spec.prompt,
                previousFiles: project.files,
                mode
              });
              setRefinePrompt("");
            }}
          >
            <Play size={17} />
            <span>继续优化</span>
          </button>
        </section>

        {repairLog.length > 0 ? (
          <section className="repair-log">
            {repairLog.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </section>
        ) : null}

        <section className="sandpack-panel">
          <SandpackProvider
            key={project?.id || "starter"}
            template="react-ts"
            files={files}
            options={{
              activeFile: "/App.tsx",
              visibleFiles
            }}
          >
            <SandpackLayout>
              <SandpackFileExplorer />
              <SandpackCodeEditor closableTabs={false} showLineNumbers showTabs />
              <SandpackPreview showNavigator showRefreshButton />
            </SandpackLayout>
          </SandpackProvider>
        </section>
      </section>
    </main>
  );
}
