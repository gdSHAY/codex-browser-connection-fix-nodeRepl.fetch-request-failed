<div align="center">

<h1>Codex Browser Connection Fix</h1>

<b>Windows · Codex · Chrome</b><br>
<code>nodeRepl.fetch request failed</code><br>
Diagnose the route · Verify your proxy · Repair the launcher · Prove real browser control

[简体中文](./README.md) | **English**

<a href="https://github.com/gdSHAY/github-browser-connection-fix-nodeRepl.fetch-request-failed/stargazers"><img src="https://img.shields.io/github/stars/gdSHAY/github-browser-connection-fix-nodeRepl.fetch-request-failed?style=flat-square&label=Stars&color=06d6a0" alt="Stars"></a>
<a href="https://github.com/gdSHAY/github-browser-connection-fix-nodeRepl.fetch-request-failed/forks"><img src="https://img.shields.io/github/forks/gdSHAY/github-browser-connection-fix-nodeRepl.fetch-request-failed?style=flat-square&label=Forks&color=4cc9f0" alt="Forks"></a>
<a href="https://github.com/gdSHAY/github-browser-connection-fix-nodeRepl.fetch-request-failed/issues"><img src="https://img.shields.io/github/issues/gdSHAY/github-browser-connection-fix-nodeRepl.fetch-request-failed?style=flat-square&label=Issues&color=ffd166" alt="Issues"></a>
<img src="https://img.shields.io/github/last-commit/gdSHAY/github-browser-connection-fix-nodeRepl.fetch-request-failed?style=flat-square&label=Updated&color=ff4d6d" alt="Last update">

<br>

<img src="https://img.shields.io/badge/Platform-Windows-0078d4?style=flat-square" alt="Windows">
<img src="https://img.shields.io/badge/Browser-Chrome-4285f4?style=flat-square&logo=googlechrome&logoColor=white" alt="Chrome">
<img src="https://img.shields.io/badge/Bundled_Node-24.21.0-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Tested bundled Node 24.21.0">
<img src="https://img.shields.io/badge/Docs-中文_%2F_English-8b5cf6?style=flat-square" alt="Chinese and English">

<br><br>

<a href="./AGENT_PROMPTS.md">Copy the agent prompt</a> · <a href="./scripts/network-probe.mjs">Token-free network probe</a>

</div>

---


**A verified local repair:** Chrome discovery worked, but listing tabs failed after approximately 21 seconds. Direct and proxy comparisons justified adding proxy environment settings to the actual browser-control child launcher. After a full restart, real Chrome tab listing, navigation, and page-content reading succeeded.

This is a local workaround for an evidenced proxy-routing problem, not a universal fix for this error. Runtime updates can replace it. Locate the active version and test your own proxy instead of copying another installation's files.

## Start with the agent prompt

Copy the English prompt in [AGENT_PROMPTS.md](AGENT_PROMPTS.md) into an agent with authorized local diagnostics, editing, and official browser tools. Supply your own proxy candidates. The prompt requires diagnosis, backups, minimal edits, rollback instructions, and actual browser acceptance testing.

## 1. Separate discovery, tab listing, and content reading

Use the API documented by the current official tool. In the recorded session:

```javascript
await cua.listBrowsers();
const tabs = await cua.listTabs({ browser: "3", emit: false });
nodeRepl.write({ tabCount: tabs.length });
```

Use the ID returned by discovery; 3 is an example, not a constant. Keep personal titles and URLs out of output.

Discovery succeeded. Listing failed after 21.1 seconds. Content reading had not been reached. New conversations, extension reinstallation, and restarts alone had not solved the problem. Different evidence, such as disconnected extensions or explicit permission denials, requires a different diagnosis.

## 2. Verify the local HTTP proxy

Inspect candidate listeners:

```powershell
netstat -ano -p tcp | Select-String -Pattern '^\s*TCP\s+\S+:(10120|7890)\s+\S+\s+LISTENING'
```

Replace the ports with your candidates. Use the PID to identify the listener without printing full environments or credentials.

Run the [token-free probe](scripts/network-probe.mjs) with the Node executable identified in step 3:

```powershell
& $nodeExe .\scripts\network-probe.mjs http://127.0.0.1:7890
& $nodeExe .\scripts\network-probe.mjs http://127.0.0.1:10120
```

The probe compares the same URLs directly and through an explicit proxy. It prints only status/error codes and timing, sends no authentication tokens, cancels response bodies, and changes only test-child environments.

Recorded on 2026-10-01 with bundled Node v24.21.0 under normal desktop permissions:

| Route | https://example.com/ | https://chatgpt.com/backend-api/aura/identity |
| --- | --- | --- |
| Direct | Connection timeout, about 10.7 s | Connection timeout, about 10.8 s |
| HTTP 127.0.0.1:7890 | 200 | 403 |
| HTTP 127.0.0.1:10120 | ECONNREFUSED | ECONNREFUSED |

FlClashCore listened on 7890. A separate HTTP CONNECT test returned 200. Port 10120 had no listener and refused connections.

**403 establishes transport reachability only. It does not establish authentication or working browser control.** A sandbox run initially returned EACCES for the identity endpoint; an authorized normal-desktop rerun confirmed direct timeouts. Separate sandbox restrictions from real network failures.

## 3. Find the active launcher

Locate the enabled unified-computer-use plugin's actual .mcp.json. A directory listing is a starting point, not evidence that the newest-looking folder is active:

```powershell
$pluginRoot = Join-Path $env:USERPROFILE '.codex\plugins\cache\openai-bundled\unified-computer-use'
Get-ChildItem -LiteralPath $pluginRoot -Filter .mcp.json -Recurse |
    Select-Object FullName
$manifestPath = Read-Host 'Enter the confirmed active .mcp.json full path'
$config = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$server = $config.mcpServers.cua_repl
$nodeExe = $server.command
$entryPath = $server.args[0]
[pscustomobject]@{ command = $nodeExe; args = $server.args } | ConvertTo-Json
& $nodeExe --version
```

Cross-check enabled configuration, executable paths, and actual process entry arguments. Print only the necessary fields. Follow imports and launch calls until you find the actual child spawn and environment construction.

Recorded chain:

```text
unified-computer-use/26.928.31416/.mcp.json
  -> bundled node.exe v24.21.0
  -> @oai/cua-repl/bin/cua-repl.mjs
  -> @oai/cua-repl/dist/lib/js/oai_js_cua_repl/src/launch.js
  -> node_repl.exe selected by CUA_REPL_NODE_REPL_PATH
```

This is historical evidence, not an installation path to hardcode. The older scripts/launch.mjs discussed in the reference issue did not exist in this version.

## 4. Add settings to the actual child environment

[Node documentation](https://nodejs.org/learn/http/enterprise-network-configuration) explains proxy support through NODE_USE_ENV_PROXY or --use-env-proxy on supported versions. Check the bundled executable, not a system Node installation.

In this case HTTP_PROXY and HTTPS_PROXY existed, but NODE_USE_ENV_PROXY did not. The following expresses the intended addition; adapt it to the actual code and preserve all original spawn options:

```javascript
const proxy = "http://127.0.0.1:7890"; // Use your verified local address.
const inheritedEnv = process.env; // Compiled code may use an alias such as i.env.
const bypass = [...new Set([
  ...(inheritedEnv.NO_PROXY ?? "").split(","),
  ...(inheritedEnv.no_proxy ?? "").split(","),
  "localhost", "127.0.0.1", "::1",
].map(value => value.trim()).filter(Boolean))].join(",");
const proxyEnv = {
  NODE_USE_ENV_PROXY: "1",
  HTTP_PROXY: proxy,
  HTTPS_PROXY: proxy,
  http_proxy: proxy,
  https_proxy: proxy,
  NO_PROXY: bypass,
  no_proxy: bypass,
};
// Merge ...proxyEnv into the existing plain spawn options.env object.
// Keep the original executable, args, stdio, trusted services, and approval logic.
```

On Windows, process.env is case-insensitive. Setting both cases there and later spreading it into a plain object did not retain both sets of keys in the recorded probe. Explicitly adding all seven keys to the child environment object did. A real Node test child then confirmed inheritance. Do not broaden untrusted environment allowlists.

## 5. Back up and verify before restart

After identifying the exact launcher, create a unique, exclusive backup before writing:

```powershell
$launcherPath = Read-Host 'Enter the confirmed actual launcher full path'
$backupPath = $launcherPath + '.backup-' + [Guid]::NewGuid().ToString('N') + '.bak'
$bytes = [IO.File]::ReadAllBytes($launcherPath)
$stream = [IO.File]::Open($backupPath, [IO.FileMode]::CreateNew,
    [IO.FileAccess]::Write, [IO.FileShare]::None)
try { $stream.Write($bytes, 0, $bytes.Length) } finally { $stream.Dispose() }
$originalHash = (Get-FileHash -LiteralPath $launcherPath -Algorithm SHA256).Hash
if ((Get-FileHash -LiteralPath $backupPath -Algorithm SHA256).Hash -ne $originalHash) {
    throw 'Backup mismatch; stop'
}
```

After adding only the proxy environment settings:

```powershell
& $nodeExe --check $launcherPath
if ($LASTEXITCODE -ne 0) { throw 'Invalid syntax; restore before starting' }
git -c core.autocrlf=false diff --no-index -- $backupPath $launcherPath
# git diff returns 1 when differences exist.
$patchedHash = (Get-FileHash -LiteralPath $launcherPath -Algorithm SHA256).Hash
```

Record absolute paths and hashes locally. Inspect the real launcher's constructed environment and test inheritance with a real child in an isolated diagnostic process. Do not start a second browser-control backend just to probe environment construction.

The initial entry-file experiment was restored byte-for-byte. Only the actual launch.js remained changed. Trusted-service configuration, child arguments, and security approval logic remained unchanged; all backups were retained.

## 6. Restart and prove browser operation

Save unfinished page work, then fully exit and reopen Codex yourself with the proxy running. The agent should not unexpectedly quit your application.

Use official browser tools to discover Chrome, read the real tab list, open a public page, read its content, and close only the test tab. If an accessibility observation is an empty incremental diff, request a full snapshot.

Recorded acceptance results:

- 22 real Chrome tabs listed in about 0.4 s; personal titles and URLs were suppressed.
- A new real Chrome tab opened https://example.com/ in about 8.2 s.
- A full snapshot contained the documentation-example explanation and Learn more link.
- The test tab was closed, existing tabs were preserved, and the patch and backup checksums remained valid.

This was a brief public-page check, not ongoing monitoring of example.com. Only these successful browser operations justified declaring this incident fixed. A 200/403 transport probe or syntax check alone is insufficient.

## 7. Roll back safely and handle updates

After exiting Codex, verify that the file still matches your recorded patched hash and the backup matches its original hash. Preserve an additional copy of the patched file before restoring; delete nothing.

```powershell
if ((Get-FileHash -LiteralPath $launcherPath).Hash -ne $patchedHash) {
    throw 'File changed; stop rather than overwrite a newer version'
}
if ((Get-FileHash -LiteralPath $backupPath).Hash -ne $originalHash) {
    throw 'Original backup mismatch'
}
[IO.File]::WriteAllBytes($launcherPath, [IO.File]::ReadAllBytes($backupPath))
& $nodeExe --check $launcherPath
```

These variables come from step 5 and must be saved in your local repair record. After runtime updates, rediscover active configuration and entry points. Never restore an older whole file over a newer launcher.

## Evidence, finding, action

| Evidence | Finding | Action |
| --- | --- | --- |
| Discovery works, listing fails | Failure occurs after discovery | Investigate request transport |
| Direct timeout, proxy reachable | Routes behave differently | Enable proxy for the active child |
| Candidate port refuses connections | Candidate is unusable | Do not configure it |
| Restarted Chrome list and page content work | This incident is verified fixed | Keep backup and rollback records |

References: [community issue #44364](https://github.com/openai/codex/issues/44364), [Node proxy documentation](https://nodejs.org/learn/http/enterprise-network-configuration), [OpenAI browser extension documentation](https://learn.chatgpt.com/docs/chrome-extension).

Prepared on 2026-10-02. Usernames, personal paths, runtime-directory identifiers, tokens, and personal tab contents are omitted. This procedure does not change system proxy, TUN, firewall, certificate validation, or approval controls. If the route comparison does not support this diagnosis, do not apply this workaround.

<div align="center">
<sub>[简体中文](./README.md) | <b>English</b></sub>
</div>
