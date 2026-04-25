import type { AgentDefinition, AgentRun, AppSpec } from "@/lib/types";

export const agentDefinitions: AgentDefinition[] = [
  {
    id: "pm",
    name: "Emma",
    role: "Product Manager",
    queued: "Waiting for scope",
    running: "Turning the prompt into product scope",
    done: "Product scope ready"
  },
  {
    id: "designer",
    name: "Bob",
    role: "Designer",
    queued: "Waiting for layout",
    running: "Planning IA, UI density, and visual tone",
    done: "Interface direction ready"
  },
  {
    id: "engineer",
    name: "Alex",
    role: "Engineer",
    queued: "Waiting for build",
    running: "Generating a React project",
    done: "React files generated"
  },
  {
    id: "reviewer",
    name: "Mia",
    role: "Reviewer",
    queued: "Waiting for review",
    running: "Checking Sandpack runtime readiness",
    done: "Review and repair complete"
  }
];

export function buildAgentRuns(spec: AppSpec, repairedCount: number): AgentRun[] {
  const article = spec.domain === "internal" ? "an" : "a";

  return [
    {
      id: "pm",
      name: "Emma",
      role: "Product Manager",
      status: "done",
      output: `Scoped ${article} ${spec.domain} app for ${spec.audience} with ${spec.features.length} focused capabilities.`
    },
    {
      id: "designer",
      name: "Bob",
      role: "Designer",
      status: "done",
      output: `Selected a ${spec.tone} direction with a dense dashboard workspace and clear action hierarchy.`
    },
    {
      id: "engineer",
      name: "Alex",
      role: "Engineer",
      status: "done",
      output: "Generated TypeScript React files, local CSS, and project metadata for Sandpack."
    },
    {
      id: "reviewer",
      name: "Mia",
      role: "Reviewer",
      status: "done",
      output:
        repairedCount > 0
          ? `Found and repaired ${repairedCount} runtime readiness issue${repairedCount > 1 ? "s" : ""}.`
          : "Validated entry file, CSS import, default export, package metadata, and responsive styling."
    }
  ];
}
