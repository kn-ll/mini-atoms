import type { StreamEventName } from "@/lib/types";

type SendEvent = (event: StreamEventName, data: unknown) => void;

export function createSseStream(handler: (send: SendEvent) => Promise<void>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send: SendEvent = (event, data) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        await handler(send);
        send("done", { ok: true });
      } catch (error) {
        send("error", {
          message: error instanceof Error ? error.message : "Unknown generation error"
        });
      } finally {
        controller.close();
      }
    }
  });
}

export function sseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no"
    }
  });
}
