import { buildAgentRuns } from "@/lib/agents";
import { reviewAndRepairFiles } from "@/lib/reviewer";
import type {
  AppSpec,
  DomainType,
  GeneratedFiles,
  GeneratedProject,
  GenerationMode,
  ToneType
} from "@/lib/types";

function clampText(value: unknown, max = 2200): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function jsxText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("{", "&#123;")
    .replaceAll("}", "&#125;");
}

function inferDomain(prompt: string): DomainType {
  const text = prompt.toLowerCase();
  if (/(shop|store|commerce|cart|sku|product|e-?commerce|retail|商品|购物|电商)/.test(text)) {
    return "commerce";
  }
  if (/(fitness|habit|workout|health|streak|gym|健身|打卡|习惯)/.test(text)) {
    return "fitness";
  }
  if (/(support|ticket|sla|crm|ops|internal|dashboard|工单|客服|运营|内部)/.test(text)) {
    return "internal";
  }
  if (/(revenue|subscription|saas|billing|churn|mrr|订阅|收入)/.test(text)) {
    return "saas";
  }
  return "workspace";
}

function inferTone(prompt: string): ToneType {
  const text = prompt.toLowerCase();
  if (/(dark|cyber|night|深色|暗色)/.test(text)) {
    return "dark";
  }
  if (/(warm|friendly|creator|生活|温暖)/.test(text)) {
    return "warm";
  }
  if (/(enterprise|b2b|admin|professional|企业|后台)/.test(text)) {
    return "enterprise";
  }
  return "modern";
}

function inferFeatures(prompt: string, domain: DomainType): string[] {
  const defaults: Record<DomainType, string[]> = {
    commerce: ["Collection filters", "Cart summary", "Conversion metrics", "Launch checklist"],
    fitness: ["Weekly plan", "Streak tracking", "Goal progress", "Workout notes"],
    internal: ["SLA overview", "Assignee board", "Escalation queue", "Resolution checklist"],
    saas: ["MRR snapshot", "Churn risk", "Account health", "Growth actions"],
    workspace: ["Task intake", "Build status", "Insight cards", "Action queue"]
  };

  const extracted = prompt
    .split(/[,，。.;；\n]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 4 && part.length < 48)
    .slice(0, 2)
    .map((part) => titleCase(part.replace(/[^\p{L}\p{N}\s_-]/gu, "")));

  return [...extracted, ...defaults[domain]].slice(0, 6);
}

export function buildSpec(promptInput: unknown, modeInput: unknown = "balanced"): AppSpec {
  const prompt = clampText(promptInput);
  const mode: GenerationMode = modeInput === "polished" ? "polished" : "balanced";
  const domain = inferDomain(prompt);
  const tone = inferTone(prompt);
  const titleByDomain: Record<DomainType, string> = {
    commerce: "LaunchCart Studio",
    fitness: "StrideFlow",
    internal: "OpsPilot Console",
    saas: "RevenueLens",
    workspace: "BuildBoard"
  };
  const audienceByDomain: Record<DomainType, string> = {
    commerce: "growth teams running online stores",
    fitness: "people building measurable routines",
    internal: "operations teams resolving daily work",
    saas: "founders tracking subscription momentum",
    workspace: "builders turning ideas into working tools"
  };

  return {
    id: `project-${crypto.randomUUID()}`,
    prompt,
    mode,
    domain,
    tone,
    title: titleByDomain[domain],
    audience: audienceByDomain[domain],
    features: inferFeatures(prompt, domain),
    primaryAction: domain === "commerce" ? "Publish Collection" : domain === "fitness" ? "Log Workout" : "Create Plan",
    secondaryAction: domain === "internal" ? "Assign Owner" : "Review Insights",
    createdAt: new Date().toISOString()
  };
}

function paletteForTone(tone: ToneType) {
  const palettes = {
    dark: {
      bg: "#11161d",
      surface: "#171d26",
      surfaceAlt: "#222b36",
      text: "#f4f7fa",
      muted: "#a9b4c2",
      border: "#303a48",
      accent: "#31b7a6",
      accentDark: "#228377",
      contrast: "#071210"
    },
    warm: {
      bg: "#f7f2ea",
      surface: "#fffdf9",
      surfaceAlt: "#efe6d9",
      text: "#25211d",
      muted: "#71685e",
      border: "#ded2c1",
      accent: "#23745f",
      accentDark: "#195647",
      contrast: "#ffffff"
    },
    enterprise: {
      bg: "#f4f6f8",
      surface: "#ffffff",
      surfaceAlt: "#edf1f5",
      text: "#17202a",
      muted: "#5c6672",
      border: "#d7dde5",
      accent: "#1f6feb",
      accentDark: "#174ea6",
      contrast: "#ffffff"
    },
    modern: {
      bg: "#f5f7fa",
      surface: "#ffffff",
      surfaceAlt: "#edf1f4",
      text: "#1d232b",
      muted: "#65717f",
      border: "#dbe2ea",
      accent: "#0b8f83",
      accentDark: "#07695f",
      contrast: "#ffffff"
    }
  };

  return palettes[tone];
}

function metricData(domain: DomainType): Array<[string, string, string]> {
  const data: Record<DomainType, Array<[string, string, string]>> = {
    commerce: [
      ["Conversion", "8.4%", "+1.2%"],
      ["Avg. order", "$76", "+$9"],
      ["Active SKUs", "128", "+14"]
    ],
    fitness: [
      ["Weekly streak", "5 days", "+2"],
      ["Goal progress", "72%", "+11%"],
      ["Recovery score", "88", "Stable"]
    ],
    internal: [
      ["Open tickets", "42", "-8"],
      ["SLA health", "94%", "+5%"],
      ["Escalations", "6", "-3"]
    ],
    saas: [
      ["MRR", "$48.2k", "+12%"],
      ["Churn risk", "7 accounts", "-4"],
      ["Activation", "63%", "+9%"]
    ],
    workspace: [
      ["Ideas", "18", "+6"],
      ["In build", "4", "+2"],
      ["Ready", "9", "+3"]
    ]
  };

  return data[domain];
}

function sampleRows(domain: DomainType): Array<[string, string, string, string]> {
  const rows: Record<DomainType, Array<[string, string, string, string]>> = {
    commerce: [
      ["Nordic Desk Lamp", "Home Office", "High", "Launch"],
      ["Travel Tech Pouch", "Accessories", "Medium", "Optimize"],
      ["Ceramic Brew Kit", "Kitchen", "High", "Bundle"]
    ],
    fitness: [
      ["Monday Strength", "45 min", "Done", "Upper body"],
      ["Wednesday Zone 2", "30 min", "Planned", "Cardio"],
      ["Friday Mobility", "20 min", "Open", "Recovery"]
    ],
    internal: [
      ["Refund backlog", "Lena", "At risk", "Escalate"],
      ["VIP onboarding", "Marco", "Healthy", "Review"],
      ["Bug triage", "Nina", "Blocked", "Assign"]
    ],
    saas: [
      ["Acme Cloud", "Expansion", "Healthy", "Upsell"],
      ["Northwind", "Renewal", "At risk", "Call"],
      ["BluePeak", "Trial", "Warm", "Activate"]
    ],
    workspace: [
      ["Landing page", "Design", "Ready", "Build"],
      ["Admin table", "Data", "In review", "Refine"],
      ["Billing flow", "Backend", "Planned", "Scope"]
    ]
  };

  return rows[domain];
}

export function buildReactFiles(spec: AppSpec): GeneratedFiles {
  const palette = paletteForTone(spec.tone);
  const metrics = metricData(spec.domain);
  const rows = sampleRows(spec.domain);
  const features = spec.features;
  const safeTitle = jsxText(spec.title);
  const safePrompt = jsxText(spec.prompt || "A focused app generated from a product idea.");
  const safeAudience = jsxText(spec.audience);
  const safePrimaryAction = jsxText(spec.primaryAction);
  const safeSecondaryAction = jsxText(spec.secondaryAction);
  const safeDomain = jsxText(titleCase(spec.domain));

  const appTsx = `import "./styles.css";

const metrics = ${JSON.stringify(metrics, null, 2)} as const;
const rows = ${JSON.stringify(rows, null, 2)} as const;
const features = ${JSON.stringify(features, null, 2)} as const;

export default function App() {
  return (
    <main className="app-shell">
      <aside className="rail" aria-label="Workspace navigation">
        <div className="brand-mark">${safeTitle.slice(0, 2).toUpperCase()}</div>
        <nav>
          <button className="nav-item active">Overview</button>
          <button className="nav-item">Workflows</button>
          <button className="nav-item">Reports</button>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">${safeDomain} Workspace</p>
            <h1>${safeTitle}</h1>
          </div>
          <div className="actions">
            <button className="ghost">${safeSecondaryAction}</button>
            <button className="primary">${safePrimaryAction}</button>
          </div>
        </header>

        <section className="hero-grid">
          <div>
            <p className="eyebrow">Built for ${safeAudience}</p>
            <h2>${features[0] || "Launch faster with AI"}</h2>
            <p>${safePrompt}</p>
          </div>
          <div className="score-panel">
            <span>Readiness</span>
            <strong>${spec.mode === "polished" ? "92%" : "86%"}</strong>
            <small>Prototype quality score</small>
          </div>
        </section>

        <section className="metrics-grid" aria-label="Key metrics">
          {metrics.map(([label, value, delta]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{delta}</small>
            </article>
          ))}
        </section>

        <section className="content-grid">
          <article className="panel">
            <div className="panel-head">
              <h3>Focus Queue</h3>
              <button className="icon-button" aria-label="Refresh queue">R</button>
            </div>
            <div className="row-list">
              {rows.map(([name, owner, status, action]) => (
                <div className="data-row" key={name}>
                  <div>
                    <strong>{name}</strong>
                    <span>{owner}</span>
                  </div>
                  <span className="status">{status}</span>
                  <button>{action}</button>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3>Generated Scope</h3>
              <button className="icon-button" aria-label="Add item">+</button>
            </div>
            <ul className="feature-list">
              {features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </article>
        </section>
      </section>
    </main>
  );
}
`;

  const stylesCss = `:root {
  --bg: ${palette.bg};
  --surface: ${palette.surface};
  --surface-alt: ${palette.surfaceAlt};
  --text: ${palette.text};
  --muted: ${palette.muted};
  --border: ${palette.border};
  --accent: ${palette.accent};
  --accent-dark: ${palette.accentDark};
  --contrast: ${palette.contrast};
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button {
  border: 0;
  border-radius: 8px;
  font: inherit;
  cursor: pointer;
}

.app-shell {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  min-height: 100vh;
}

.rail {
  border-right: 1px solid var(--border);
  padding: 18px 14px;
  background: var(--surface);
}

.brand-mark {
  display: grid;
  width: 42px;
  height: 42px;
  margin: 0 auto 28px;
  place-items: center;
  border-radius: 8px;
  background: var(--accent);
  color: var(--contrast);
  font-weight: 800;
}

nav {
  display: grid;
  gap: 10px;
}

.nav-item {
  min-height: 42px;
  background: transparent;
  color: var(--muted);
}

.nav-item.active,
.nav-item:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.workspace {
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 28px;
}

.topbar,
.actions,
.panel-head,
.data-row {
  display: flex;
  align-items: center;
}

.topbar {
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.eyebrow {
  margin: 0 0 7px;
  color: var(--accent-dark);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0;
  font-size: 30px;
}

h2 {
  max-width: 620px;
  margin-bottom: 12px;
  font-size: 34px;
  line-height: 1.08;
}

h3 {
  margin-bottom: 0;
  font-size: 16px;
}

p {
  color: var(--muted);
  line-height: 1.6;
}

.actions {
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.primary,
.ghost,
.data-row button {
  min-height: 38px;
  padding: 0 14px;
  font-weight: 750;
}

.primary {
  background: var(--accent);
  color: var(--contrast);
}

.ghost,
.data-row button {
  background: var(--surface-alt);
  color: var(--text);
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 18px;
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.score-panel {
  display: grid;
  align-content: center;
  gap: 8px;
  padding: 18px;
  border-radius: 8px;
  background: var(--surface-alt);
}

.score-panel span,
.score-panel small,
.metrics-grid span,
.metrics-grid small,
.data-row span {
  color: var(--muted);
}

.score-panel strong {
  font-size: 42px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 16px 0;
}

.metrics-grid article,
.panel {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.metrics-grid article {
  display: grid;
  gap: 8px;
  padding: 18px;
}

.metrics-grid strong {
  font-size: 28px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
  gap: 16px;
}

.panel {
  padding: 18px;
}

.panel-head {
  justify-content: space-between;
  margin-bottom: 14px;
}

.icon-button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  background: var(--surface-alt);
  color: var(--text);
}

.row-list {
  display: grid;
  gap: 10px;
}

.data-row {
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: var(--surface-alt);
}

.data-row div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.data-row strong,
.data-row span {
  overflow-wrap: anywhere;
}

.status {
  min-width: 74px;
  text-align: right;
}

.feature-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.feature-list li {
  padding: 12px;
  border-radius: 8px;
  background: var(--surface-alt);
}

@media (max-width: 820px) {
  .app-shell,
  .hero-grid,
  .metrics-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .rail {
    display: none;
  }

  .workspace {
    padding: 18px;
  }

  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .actions {
    justify-content: flex-start;
  }

  h1 {
    font-size: 25px;
  }

  h2 {
    font-size: 28px;
  }
}
`;

  return {
    "/App.tsx": appTsx,
    "/styles.css": stylesCss,
    "/package.json": `{
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "react": "latest",
    "react-dom": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {}
}
`,
    "/README.md": `# ${spec.title}

Generated from:

${spec.prompt}
`
  };
}

function parseGeneratedJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

function isGeneratedFiles(value: unknown): value is GeneratedFiles {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

async function generateWithOpenAICompatible(prompt: string, mode: GenerationMode): Promise<GeneratedProject | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) {
    return null;
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content:
            "Return strict JSON only. Generate a small React TypeScript Sandpack project. Required shape: {\"summary\": string, \"files\": {\"/App.tsx\": string, \"/styles.css\": string, \"/package.json\": string, \"/README.md\": string}}. Do not use remote assets."
        },
        {
          role: "user",
          content: `Mode: ${mode}\nPrompt: ${prompt}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`AI provider returned ${response.status}.`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI provider returned an empty response.");
  }

  const parsed = parseGeneratedJson(content) as { summary?: unknown; files?: unknown };
  if (!isGeneratedFiles(parsed.files)) {
    throw new Error("AI provider response did not include a files object.");
  }

  const spec = buildSpec(prompt, mode);
  const repaired = reviewAndRepairFiles(parsed.files);
  return {
    id: spec.id,
    summary: typeof parsed.summary === "string" ? parsed.summary : `${spec.title} generated by configured AI provider.`,
    spec,
    agents: buildAgentRuns(spec, repaired.review.repairs.length),
    files: repaired.files,
    review: repaired.review,
    provider: "openai-compatible"
  };
}

export async function generateProject(promptInput: unknown, modeInput: unknown = "balanced"): Promise<GeneratedProject> {
  const prompt = clampText(promptInput);
  const mode: GenerationMode = modeInput === "polished" ? "polished" : "balanced";
  if (!prompt) {
    throw new Error("prompt is required");
  }

  try {
    const aiResult = await generateWithOpenAICompatible(prompt, mode);
    if (aiResult) {
      return aiResult;
    }
  } catch {
    // Keep the demo available when a configured provider fails.
  }

  const spec = buildSpec(prompt, mode);
  const repaired = reviewAndRepairFiles(buildReactFiles(spec));
  return {
    id: spec.id,
    summary: `${spec.title} is a runnable ${spec.domain} React prototype generated from the prompt.`,
    spec,
    agents: buildAgentRuns(spec, repaired.review.repairs.length),
    files: repaired.files,
    review: repaired.review,
    provider: "local"
  };
}

export function composeRefinePrompt(previousPrompt: unknown, prompt: unknown): string {
  const base = clampText(previousPrompt || "Previous generated app", 1200);
  const change = clampText(prompt, 900);
  return `${base}. Refine request: ${change}`;
}
