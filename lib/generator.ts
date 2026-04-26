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

function domainLabel(domain: DomainType): string {
  return {
    commerce: "电商",
    fitness: "健身",
    internal: "内部运营",
    saas: "订阅 SaaS",
    workspace: "工作台"
  }[domain];
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
    commerce: ["分类筛选", "购物车概览", "转化指标", "上新清单"],
    fitness: ["每周计划", "连续打卡", "目标进度", "训练备注"],
    internal: ["SLA 总览", "负责人看板", "升级队列", "处理清单"],
    saas: ["MRR 快照", "流失风险", "账户健康度", "增长动作"],
    workspace: ["任务入口", "构建状态", "洞察卡片", "行动队列"]
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
    commerce: "灵析商城中台",
    fitness: "跃动习惯台",
    internal: "运营值班台",
    saas: "订阅增长台",
    workspace: "构建工作台"
  };
  const audienceByDomain: Record<DomainType, string> = {
    commerce: "负责线上零售增长的团队",
    fitness: "希望建立可量化习惯的人群",
    internal: "处理日常业务流转的运营团队",
    saas: "跟踪订阅增长势能的创业团队",
    workspace: "把想法快速变成工具的构建者"
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
    primaryAction: domain === "commerce" ? "发布专题" : domain === "fitness" ? "记录训练" : "创建方案",
    secondaryAction: domain === "internal" ? "分配负责人" : "查看洞察",
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
      ["转化率", "8.4%", "+1.2%"],
      ["客单价", "$76", "+$9"],
      ["活跃 SKU", "128", "+14"]
    ],
    fitness: [
      ["本周连续打卡", "5 天", "+2"],
      ["目标进度", "72%", "+11%"],
      ["恢复评分", "88", "稳定"]
    ],
    internal: [
      ["待处理工单", "42", "-8"],
      ["SLA 健康度", "94%", "+5%"],
      ["升级单量", "6", "-3"]
    ],
    saas: [
      ["MRR", "$48.2k", "+12%"],
      ["流失风险", "7 个账户", "-4"],
      ["激活率", "63%", "+9%"]
    ],
    workspace: [
      ["想法池", "18", "+6"],
      ["构建中", "4", "+2"],
      ["已就绪", "9", "+3"]
    ]
  };

  return data[domain];
}

function sampleRows(domain: DomainType): Array<[string, string, string, string]> {
  const rows: Record<DomainType, Array<[string, string, string, string]>> = {
    commerce: [
      ["北欧台灯套装", "家居办公", "高优先级", "发布"],
      ["旅行数码收纳包", "配件", "中优先级", "优化"],
      ["手冲陶瓷礼盒", "厨房", "高优先级", "组合"]
    ],
    fitness: [
      ["周一力量训练", "45 分钟", "已完成", "上肢"],
      ["周三区间有氧", "30 分钟", "已计划", "心肺"],
      ["周五灵活恢复", "20 分钟", "待开始", "恢复"]
    ],
    internal: [
      ["退款积压处理", "李娜", "风险中", "升级"],
      ["VIP 客户接入", "马柯", "健康", "复核"],
      ["缺陷分诊", "倪娜", "阻塞", "分派"]
    ],
    saas: [
      ["Acme Cloud", "扩容机会", "健康", "升级销售"],
      ["Northwind", "续约阶段", "风险中", "联系"],
      ["BluePeak", "试用期", "升温", "激活"]
    ],
    workspace: [
      ["落地页", "设计", "已就绪", "构建"],
      ["管理表格", "数据", "审查中", "优化"],
      ["计费流程", "后端", "已规划", "梳理"]
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
  const safePrompt = jsxText(spec.prompt || "这是一个根据产品想法生成的聚焦型应用。");
  const safeAudience = jsxText(spec.audience);
  const safePrimaryAction = jsxText(spec.primaryAction);
  const safeSecondaryAction = jsxText(spec.secondaryAction);
  const safeDomain = jsxText(domainLabel(spec.domain));

  const appTsx = `import "./styles.css";

const metrics = ${JSON.stringify(metrics, null, 2)} as const;
const rows = ${JSON.stringify(rows, null, 2)} as const;
const features = ${JSON.stringify(features, null, 2)} as const;

export default function App() {
  return (
    <main className="app-shell">
      <aside className="rail" aria-label="工作台导航">
        <div className="brand-mark">${safeTitle.slice(0, 2).toUpperCase()}</div>
        <nav>
          <button className="nav-item active">概览</button>
          <button className="nav-item">流程</button>
          <button className="nav-item">报表</button>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">${safeDomain}工作台</p>
            <h1>${safeTitle}</h1>
          </div>
          <div className="actions">
            <button className="ghost">${safeSecondaryAction}</button>
            <button className="primary">${safePrimaryAction}</button>
          </div>
        </header>

        <section className="hero-grid">
          <div>
            <p className="eyebrow">服务对象：${safeAudience}</p>
            <h2>${features[0] || "用 AI 更快完成落地"}</h2>
            <p>${safePrompt}</p>
          </div>
          <div className="score-panel">
            <span>就绪度</span>
            <strong>${spec.mode === "polished" ? "92%" : "86%"}</strong>
            <small>原型质量评分</small>
          </div>
        </section>

        <section className="metrics-grid" aria-label="关键指标">
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
              <h3>重点队列</h3>
              <button className="icon-button" aria-label="刷新队列">R</button>
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
              <h3>生成范围</h3>
              <button className="icon-button" aria-label="新增条目">+</button>
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

生成依据：

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

const PROVIDERS = {
  compass: {
    baseUrl: "http://compass.llm.shopee.io/compass-api/v1/",
    baseUrlEnv: "COMPASS_BASE_URL",
    apiKeyEnv: "COMPASS_API_KEY",
    model: "glm-5",
    modelEnv: "COMPASS_MODEL",
    timeoutEnv: "COMPASS_TIMEOUT_MS",
    timeoutMs: 180_000,
    label: "Compass glm-5"
  },
  siliconflow: {
    baseUrl: "https://api.siliconflow.cn/v1/",
    baseUrlEnv: "SILICONFLOW_BASE_URL",
    apiKeyEnv: "SILICONFLOW_API_KEY",
    model: "Pro/MiniMaxAI/MiniMax-M2.5",
    modelEnv: "SILICONFLOW_MODEL",
    timeoutEnv: "SILICONFLOW_TIMEOUT_MS",
    timeoutMs: 295_000,
    label: "SiliconFlow MiniMax M2.5"
  }
} as const;

type RemoteProviderName = keyof typeof PROVIDERS;

type ProviderAttempt =
  | {
      project: GeneratedProject;
      fallbackReason?: undefined;
    }
  | {
      project: null;
      fallbackReason?: string;
    };

function getConfiguredProviderName(): string {
  return (process.env.LLM_PROVIDER || "siliconflow").trim().toLowerCase();
}

function getProviderLabel(provider: string): string {
  if (provider === "local") {
    return "本地生成器";
  }

  if (provider in PROVIDERS) {
    return PROVIDERS[provider as RemoteProviderName].label;
  }

  return provider;
}

function getProviderApiKey(apiKeyEnv: string): string {
  return process.env[apiKeyEnv] || "";
}

function getProviderBaseUrl(provider: RemoteProviderName): string {
  const config = PROVIDERS[provider];
  const override = process.env[config.baseUrlEnv]?.trim();
  return override || config.baseUrl;
}

function getProviderModel(provider: RemoteProviderName): string {
  const config = PROVIDERS[provider];
  const override = process.env[config.modelEnv]?.trim();
  return override || config.model;
}

function getProviderTimeoutMs(provider: RemoteProviderName): number {
  const config = PROVIDERS[provider];
  const raw = process.env[config.timeoutEnv]?.trim();
  if (!raw) {
    return config.timeoutMs;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1_000) {
    return config.timeoutMs;
  }

  return Math.floor(parsed);
}

function formatProviderError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return clampText(error.message, 240);
  }

  return "未知错误";
}

function getResponseTraceId(response: Response): string {
  return (
    response.headers.get("x-request-id") ||
    response.headers.get("x-trace-id") ||
    response.headers.get("trace-id") ||
    response.headers.get("x-siliconcloud-trace-id") ||
    ""
  );
}

function buildProviderBaseUrls(provider: RemoteProviderName): string[] {
  const primary = getProviderBaseUrl(provider).replace(/\/$/, "");
  if (provider !== "compass") {
    return [primary];
  }

  if (primary.startsWith("http://")) {
    return [primary, primary.replace(/^http:\/\//, "https://")];
  }

  return [primary];
}

function isHtmlForbiddenResponse(response: Response, body: string): boolean {
  const contentType = response.headers.get("content-type") || "";
  return response.status === 403 && (/text\/html/i.test(contentType) || /<html[\s>]/i.test(body));
}

function summarizeProviderErrorBody(response: Response, body: string): string {
  const contentType = response.headers.get("content-type") || "";
  const trimmed = clampText(body, 240);

  if (!trimmed) {
    return "";
  }

  if (/text\/html/i.test(contentType) || /<html[\s>]/i.test(trimmed)) {
    if (response.status === 403) {
      return "网关返回 403 Forbidden HTML 页面";
    }
    return `网关返回 HTML 页面（status=${response.status}）`;
  }

  return trimmed;
}

function buildCompassForbiddenMessage(traceId: string): string {
  return `Compass 返回 403，常见原因：API Key 无效或无权限、当前运行环境不在公司内网/VPN、或命中了受限网关。${traceId ? ` trace_id=${traceId}` : ""}`;
}

function buildLocalProject(prompt: string, mode: GenerationMode, providerNote?: string): GeneratedProject {
  const spec = buildSpec(prompt, mode);
  const repaired = reviewAndRepairFiles(buildReactFiles(spec));

  return {
    id: spec.id,
    summary: `${spec.title} 是一个根据需求生成的可运行 ${domainLabel(spec.domain)} React 原型。`,
    spec,
    agents: buildAgentRuns(spec, repaired.review.repairs.length),
    files: repaired.files,
    review: repaired.review,
    provider: "local",
    ...(providerNote ? { providerNote } : {})
  };
}

async function generateWithConfiguredProvider(prompt: string, mode: GenerationMode): Promise<ProviderAttempt> {
  const provider = getConfiguredProviderName();
  if (provider === "local") {
    return { project: null };
  }

  if (!(provider in PROVIDERS)) {
    return {
      project: null,
      fallbackReason: `不支持的 LLM_PROVIDER=${provider}，已回退到本地生成器。`
    };
  }

  const config = PROVIDERS[provider as RemoteProviderName];
  const apiKey = getProviderApiKey(config.apiKeyEnv);
  if (!apiKey) {
    return {
      project: null,
      fallbackReason: `缺少环境变量 ${config.apiKeyEnv}，已回退到本地生成器。`
    };
  }

  const remoteProvider = provider as RemoteProviderName;
  const baseUrls = buildProviderBaseUrls(remoteProvider);
  const model = getProviderModel(remoteProvider);
  const timeoutMs = getProviderTimeoutMs(remoteProvider);

  try {
    let lastError: Error | null = null;

    for (const baseUrl of baseUrls) {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        signal: AbortSignal.timeout(timeoutMs),
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
                "只返回严格 JSON。生成一个小型 React TypeScript Sandpack 项目。要求结构：{\"summary\": string, \"files\": {\"/App.tsx\": string, \"/styles.css\": string, \"/package.json\": string, \"/README.md\": string}}。所有用户可见文案必须为简体中文。不要使用远程资源。"
            },
            {
              role: "user",
              content: `模式：${mode}\n需求：${prompt}`
            }
          ]
        })
      });

      if (!response.ok) {
        const rawBody = await response.text().catch(() => "");
        const traceId = getResponseTraceId(response);

        if (remoteProvider === "compass" && isHtmlForbiddenResponse(response, rawBody)) {
          lastError = new Error(buildCompassForbiddenMessage(traceId));
          if (baseUrl !== baseUrls[baseUrls.length - 1]) {
            continue;
          }
          throw lastError;
        }

        const detail = summarizeProviderErrorBody(response, rawBody);
        throw new Error(`AI 服务返回状态码 ${response.status}${detail ? `：${detail}` : "。"}${traceId ? ` trace_id=${traceId}` : ""}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("AI 服务返回了空响应。");
      }

      const parsed = parseGeneratedJson(content) as { summary?: unknown; files?: unknown };
      if (!isGeneratedFiles(parsed.files)) {
        throw new Error("AI 服务响应中缺少 files 对象。");
      }

      const spec = buildSpec(prompt, mode);
      const repaired = reviewAndRepairFiles(parsed.files);
      return {
        project: {
          id: spec.id,
          summary: typeof parsed.summary === "string" ? parsed.summary : `${spec.title} 已由已配置的 AI 服务生成。`,
          spec,
          agents: buildAgentRuns(spec, repaired.review.repairs.length),
          files: repaired.files,
          review: repaired.review,
          provider: remoteProvider
        }
      };
    }

    throw lastError || new Error("AI 服务调用失败。");
  } catch (error) {
    const message = formatProviderError(error);
    console.error(`[generator] ${getProviderLabel(provider)} 调用失败: ${message}`);
    return {
      project: null,
      fallbackReason: `${getProviderLabel(provider)} 调用失败，已回退到本地生成器：${message}`
    };
  }
}

export async function generateProject(promptInput: unknown, modeInput: unknown = "balanced"): Promise<GeneratedProject> {
  const prompt = clampText(promptInput);
  const mode: GenerationMode = modeInput === "polished" ? "polished" : "balanced";
  if (!prompt) {
    throw new Error("请输入需求描述。");
  }

  const aiResult = await generateWithConfiguredProvider(prompt, mode);
  if (aiResult.project) {
    return aiResult.project;
  }

  return buildLocalProject(prompt, mode, aiResult.fallbackReason);
}

export function composeRefinePrompt(previousPrompt: unknown, prompt: unknown): string {
  const base = clampText(previousPrompt || "上一次生成的应用", 1200);
  const change = clampText(prompt, 900);
  return `${base}。优化要求：${change}`;
}
