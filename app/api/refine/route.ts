import { agentDefinitions } from "@/lib/agents";
import { composeRefinePrompt, generateProject } from "@/lib/generator";
import { createSseStream, sseResponse } from "@/lib/sse";
import type { GenerateRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as GenerateRequest;

  const stream = createSseStream(async (send) => {
    if (!body.prompt?.trim()) {
      throw new Error("请输入优化要求。");
    }

    for (const agent of agentDefinitions) {
      send("agent-start", {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        text: agent.running
      });
      await delay(220);
      send("agent-delta", {
        id: agent.id,
        text: agent.done
      });
    }

    const result = await generateProject(composeRefinePrompt(body.previousPrompt, body.prompt), body.mode);
    send("review", result.review);
    if (result.review.repairs.length > 0) {
      send("repair", { repairs: result.review.repairs });
    }
    send("result", result);
  });

  return sseResponse(stream);
}
