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
        <h1>Ready to generate</h1>
        <p>Enter a product idea and run the agent pipeline.</p>
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
  const [prompt, setPrompt] = useState("Build a support operations dashboard with SLA tracking, assignee workload, and escalation actions.");
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
          const text = typeof payloadData.text === "string" ? payloadData.text : "Running";
          setAgents((current) => updateAgent(current, agentId, "running", text));
        }

        if (event === "agent-delta" && typeof data === "object" && data) {
          const payloadData = data as { id?: unknown; text?: unknown };
          if (!isAgentId(payloadData.id)) {
            return;
          }
          const agentId = payloadData.id;
          const text = typeof payloadData.text === "string" ? payloadData.text : "Done";
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
      const message = streamError instanceof Error ? streamError.message : "Generation failed";
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
    link.download = `${project.spec.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "mini-atoms"}.zip`;
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
            <span>Agent app builder</span>
          </div>
        </div>

        <section className="control-block">
          <div className="section-head">
            <label htmlFor="prompt">Prompt</label>
            <Sparkles size={16} aria-hidden="true" />
          </div>
          <textarea id="prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        </section>

        <section className="control-block">
          <span className="field-label">Templates</span>
          <div className="template-grid">
            {templates.map((template) => (
              <button key={template.id} type="button" onClick={() => setPrompt(template.prompt)}>
                {template.label}
              </button>
            ))}
          </div>
        </section>

        <section className="control-block">
          <span className="field-label">Mode</span>
          <div className="segment-control">
            <button type="button" className={mode === "balanced" ? "active" : ""} onClick={() => setMode("balanced")}>
              Balanced
            </button>
            <button type="button" className={mode === "polished" ? "active" : ""} onClick={() => setMode("polished")}>
              Polished
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
          <span>{busy ? "Working" : "Generate"}</span>
        </button>

        <section className="history-block">
          <div className="section-head">
            <span className="field-label">History</span>
            <History size={16} aria-hidden="true" />
          </div>
          <div className="history-list">
            {history.length === 0 ? (
              <p>No saved projects yet.</p>
            ) : (
              history.map((item) => (
                <button key={item.id} type="button" onClick={() => persistProject(item)}>
                  <Clock3 size={15} aria-hidden="true" />
                  <span>{item.spec.title}</span>
                  <small>{new Date(item.spec.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                </button>
              ))
            )}
          </div>
        </section>
      </aside>

      <section className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">AI Native Prototype</p>
            <h1>{project?.spec.title || "Atoms Demo Builder"}</h1>
          </div>
          <div className="toolbar">
            <button type="button" onClick={() => project && run("/api/refine", { prompt: "Refresh the visual hierarchy and keep the same scope.", previousPrompt: project.spec.prompt, previousFiles: project.files, mode })} disabled={busy || !project} title="Run a quick refinement">
              <RefreshCw size={17} />
              <span>Refresh</span>
            </button>
            <button type="button" onClick={exportZip} disabled={!project} title="Export generated project as ZIP">
              <Download size={17} />
              <span>ZIP</span>
            </button>
          </div>
        </header>

        <section className="agent-strip" aria-label="Agent status">
          {agents.map((agent) => (
            <article key={agent.id} data-status={agent.status}>
              <span>{agent.role}</span>
              <strong>{agent.name}</strong>
              <p>{agent.text}</p>
            </article>
          ))}
        </section>

        {error ? <div className="error-banner">{error}</div> : null}

        <section className="review-row">
          <article>
            <span>Quality</span>
            <strong>{review?.score ?? project?.review.score ?? 0}%</strong>
          </article>
          <article>
            <span>Provider</span>
            <strong>{project?.provider || "local"}</strong>
          </article>
          <article>
            <span>Repairs</span>
            <strong>{repairLog.length}</strong>
          </article>
        </section>

        <section className="refine-bar">
          <input
            value={refinePrompt}
            onChange={(event) => setRefinePrompt(event.target.value)}
            placeholder="Refine the generated app"
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
            <span>Refine</span>
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
