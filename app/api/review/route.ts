import { reviewAndRepairFiles } from "@/lib/reviewer";
import type { GeneratedFiles } from "@/lib/types";

export const dynamic = "force-dynamic";

function isGeneratedFiles(value: unknown): value is GeneratedFiles {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { files?: unknown };
  if (!isGeneratedFiles(body.files)) {
    return Response.json({ error: "请求体中必须包含 files 对象。" }, { status: 400 });
  }

  return Response.json(reviewAndRepairFiles(body.files));
}
