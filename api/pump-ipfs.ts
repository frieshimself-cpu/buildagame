/**
 * Vercel serverless function (Node runtime).
 *
 * Browsers can't POST directly to https://pump.fun/api/ipfs (no CORS), so the
 * token launcher uploads metadata here and we forward it. The multipart body —
 * including its boundary — is passed through untouched.
 *
 * This file lives outside `src/`, so it is not part of the Vite/tsc app build;
 * Vercel compiles it on its own when the project is deployed there.
 */

// Minimal request/response typing to avoid a dependency on @vercel/node.
interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  [Symbol.asyncIterator](): AsyncIterator<Buffer>;
}
interface Res {
  status(code: number): Res;
  setHeader(name: string, value: string): void;
  send(body: string): void;
  json(body: unknown): void;
}

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST." });
    return;
  }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);

    const contentType = req.headers["content-type"];
    const upstream = await fetch("https://pump.fun/api/ipfs", {
      method: "POST",
      headers: { "content-type": Array.isArray(contentType) ? contentType[0] : contentType ?? "" },
      body,
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("content-type", upstream.headers.get("content-type") ?? "application/json");
    res.setHeader("cache-control", "no-store");
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: `IPFS proxy failed: ${(err as Error)?.message ?? String(err)}` });
  }
}
