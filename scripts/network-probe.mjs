import { spawnSync } from "node:child_process";
const targets = ["https://example.com/", "https://chatgpt.com/backend-api/aura/identity"];
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("TLS verification is disabled; stop rather than run an insecure probe.");
}
if (process.argv[2] === "--child") {
  const started = Date.now();
  try {
    const response = await fetch(process.argv[3], {
      signal: AbortSignal.timeout(12000), redirect: "manual",
    });
    console.log(JSON.stringify({ status: response.status, ms: Date.now() - started }));
    await response.body?.cancel();
  } catch (error) {
    console.log(JSON.stringify({ error: error.name, cause: error.cause?.code ?? null, ms: Date.now() - started }));
  }
} else {
  const candidate = process.argv[2];
  if (!candidate) throw new Error("Usage: bundled-node network-probe.mjs http://127.0.0.1:PORT");
  const proxy = new URL(candidate);
  if (proxy.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(proxy.hostname)
      || proxy.username || proxy.password || !proxy.port || proxy.search || proxy.hash || proxy.pathname !== "/") {
    throw new Error("Provide a local HTTP proxy URL with a port and without credentials.");
  }
  for (const mode of ["direct", "proxy"]) {
    for (const url of targets) {
      const env = { ...process.env };
      for (const key of Object.keys(env)) {
        if (/^(http_proxy|https_proxy|all_proxy|no_proxy|node_use_env_proxy)$/i.test(key)) delete env[key];
      }
      if (mode === "proxy") {
        Object.assign(env, {
          NODE_USE_ENV_PROXY: "1",
          HTTP_PROXY: proxy.origin, HTTPS_PROXY: proxy.origin,
          http_proxy: proxy.origin, https_proxy: proxy.origin,
          NO_PROXY: "localhost,127.0.0.1,::1", no_proxy: "localhost,127.0.0.1,::1",
        });
      }
      const result = spawnSync(process.execPath, [import.meta.filename, "--child", url], {
        env, encoding: "utf8", timeout: 16000,
      });
      console.log(JSON.stringify({
        mode, url, result: result.stdout?.trim() ?? "",
        launchError: result.error?.code ?? null, exitCode: result.status,
      }));
    }
  }
}
