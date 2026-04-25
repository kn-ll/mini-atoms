export type AgentId = "pm" | "designer" | "engineer" | "reviewer";

export type AgentStatus = "queued" | "running" | "done" | "error";

export type GenerationMode = "balanced" | "polished";

export type DomainType = "commerce" | "fitness" | "internal" | "saas" | "workspace";

export type ToneType = "modern" | "dark" | "warm" | "enterprise";

export type GeneratedFiles = Record<string, string>;

export interface AgentDefinition {
  id: AgentId;
  name: string;
  role: string;
  queued: string;
  running: string;
  done: string;
}

export interface AgentRun {
  id: AgentId;
  name: string;
  role: string;
  status: AgentStatus;
  output: string;
}

export interface AppSpec {
  id: string;
  prompt: string;
  mode: GenerationMode;
  domain: DomainType;
  tone: ToneType;
  title: string;
  audience: string;
  features: string[];
  primaryAction: string;
  secondaryAction: string;
  createdAt: string;
}

export interface ReviewCheck {
  name: string;
  passed: boolean;
  detail: string;
  repaired?: boolean;
}

export interface ReviewResult {
  score: number;
  checks: ReviewCheck[];
  repairs: string[];
}

export interface GeneratedProject {
  id: string;
  summary: string;
  spec: AppSpec;
  agents: AgentRun[];
  files: GeneratedFiles;
  review: ReviewResult;
  provider: "local" | "compass";
}

export interface GenerateRequest {
  prompt: string;
  mode?: GenerationMode;
  previousPrompt?: string;
  previousFiles?: GeneratedFiles;
}

export interface TemplatePrompt {
  id: string;
  label: string;
  prompt: string;
}

export type StreamEventName =
  | "agent-start"
  | "agent-delta"
  | "agent-done"
  | "review"
  | "repair"
  | "result"
  | "done"
  | "error";

export interface StreamEvent<T = unknown> {
  event: StreamEventName;
  data: T;
}
