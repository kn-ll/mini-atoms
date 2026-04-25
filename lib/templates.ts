import type { TemplatePrompt } from "@/lib/types";

export const templates: TemplatePrompt[] = [
  {
    id: "saas",
    label: "SaaS",
    prompt: "Build a subscription analytics SaaS with account health, revenue trend, churn risk, and next best actions."
  },
  {
    id: "commerce",
    label: "Commerce",
    prompt: "Build a product discovery storefront with collection filters, conversion metrics, cart summary, and launch actions."
  },
  {
    id: "internal",
    label: "Ops Tool",
    prompt: "Build an operations dashboard for support tickets, SLA status, assignees, and escalation actions."
  },
  {
    id: "fitness",
    label: "Fitness",
    prompt: "Build a fitness habit tracker with weekly progress, streaks, goals, and workout notes."
  }
];
