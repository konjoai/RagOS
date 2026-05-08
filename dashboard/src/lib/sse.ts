/**
 * SSE / NDJSON parser for kyro's streaming endpoints.
 *
 * /query/stream emits NDJSON-ish: each frame is a single JSON object.
 * /agent/query/stream emits SSE-ish: each frame `data: {json}\n\n`,
 * terminated by `[DONE]`.
 *
 * Auto-detect: if buffer contains `\n\n`, treat as SSE; otherwise NDJSON.
 */

export interface ParsedFrame {
  json: string;
  done: boolean;
}

export function parseStreamChunk(buffer: string): { frames: ParsedFrame[]; rest: string } {
  const frames: ParsedFrame[] = [];

  if (buffer.includes("\n\n")) {
    const parts = buffer.split("\n\n");
    const rest = parts.pop() ?? "";
    for (const block of parts) {
      for (const line of block.split("\n")) {
        if (!line || line.startsWith(":")) continue;
        const payload = line.startsWith("data:") ? line.slice(5).trim() : line.trim();
        if (!payload) continue;
        if (payload === "[DONE]") frames.push({ json: "", done: true });
        else frames.push({ json: payload, done: false });
      }
    }
    return { frames, rest };
  }

  const lines = buffer.split("\n");
  const rest = lines.pop() ?? "";
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith(":")) continue;
    const payload = line.startsWith("data:") ? line.slice(5).trim() : line;
    if (payload === "[DONE]") frames.push({ json: "", done: true });
    else if (payload) frames.push({ json: payload, done: false });
  }
  return { frames, rest };
}
