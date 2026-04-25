import { templates } from "@/lib/templates";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ templates });
}
