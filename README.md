<div align="center">

<h1>github连接浏览器报错修复</h1>

<b>Windows · Codex · Chrome</b><br>
<code>nodeRepl.fetch request failed</code><br>
定位故障 · 验证代理 · 最小修复 · 真实浏览器验收

**简体中文** | [English](./README.en.md)

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

<a href="./AGENT_PROMPTS.md">复制 Agent 提示词</a> · <a href="./scripts/network-probe.mjs">无令牌网络诊断</a>

</div>

---


**本教程记录一次 Windows 上 Codex 控制 Chrome 的实际成功修复：发现浏览器正常，但标签页列表约 21 秒后失败；经过网络对照，给当前浏览器控制子进程补齐代理环境，完全重启后真实读取标签页和页面正文成功。**

这是针对有证据支持的代理路径故障的本地修复，不是所有同名错误的通用解法。插件或运行时更新可能覆盖补丁。代理端口、版本目录和变量名都必须根据本机实际情况核对，不要复制别人的完整启动器。

## 先把提示词发给 agent

打开 [AGENT_PROMPTS.md](AGENT_PROMPTS.md)，复制中文或英文提示词到具有本机诊断、官方浏览器控制及文件编辑权限的 agent。填写自己的代理候选地址。提示词要求先诊断，再在证据支持后备份修改，最后真实验收。

如果想自己操作，按下面的顺序进行。

## 1. 明确是哪一步失败

使用当前工具实际提供的 API，不要把示例当成永久接口。此次使用：

```javascript
await cua.listBrowsers();
const tabs = await cua.listTabs({ browser: "3", emit: false });
nodeRepl.write({ tabCount: tabs.length });
```

浏览器 ID 必须来自当次发现结果，不能固定写成 3。只输出数量，避免公开个人标签页标题或 URL。

| 阶段 | 修复前实测 | 可以得出的结论 |
| --- | --- | --- |
| 浏览器发现 | 能识别 Chrome 扩展 | 扩展身份被发现，不等于请求链路可用 |
| 标签页列表 | 21.1 秒后 request failed | 失败在列表阶段 |
| 页面内容读取 | 未到达此阶段 | 不能声称读过页面 |

本次新会话、扩展重装和重启没有单独解决问题。如果实际故障是扩展未连接、权限拒绝、凭据保护或服务端错误，应按对应证据继续处理。

## 2. 验证代理，不猜端口

先查监听：

```powershell
netstat -ano -p tcp | Select-String -Pattern '^\s*TCP\s+\S+:(10120|7890)\s+\S+\s+LISTENING'
```

端口号是本次候选示例，请换成自己的候选。查到监听后，可以用 PID 核对进程名称；不要输出完整进程环境或账号令牌。

使用实际自带 Node 运行 [无令牌网络探针](scripts/network-probe.mjs)，对完全相同的公开地址比较直连与代理：

```powershell
# $nodeExe 来自第 3 节确认的当前 command。
& $nodeExe .\scripts\network-probe.mjs http://127.0.0.1:7890
& $nodeExe .\scripts\network-probe.mjs http://127.0.0.1:10120
```

探针只报告状态码、错误码和耗时，不发送认证令牌、不读取响应正文。它清除测试子进程的继承代理变量，再分别测试直连和显式 HTTP 代理，父进程环境不变。

2026-10-01 的本机实测（普通桌面权限，自带 Node v24.21.0）：

| 路径 | https://example.com/ | https://chatgpt.com/backend-api/aura/identity |
| --- | --- | --- |
| 直连 | 约 10.7 秒后连接超时 | 约 10.8 秒后连接超时 |
| HTTP 127.0.0.1:7890 | 200 | 403 |
| HTTP 127.0.0.1:10120 | ECONNREFUSED | ECONNREFUSED |

7890 由 FlClashCore 监听，另一次 HTTP CONNECT 测试得到 200。10120 没有监听，实测拒绝连接。因此此次采用 7890，而不是按口述端口直接配置。

**身份端点的 403 只证明传输可达，不证明认证成功或浏览器修好。** 沙箱内直连一度返回 EACCES；在授权的普通桌面权限下复测，两个直连地址均超时。不要把沙箱权限错误直接当成网络根因。

## 3. 定位当前生效启动链

先从启用的 unified-computer-use 插件配置定位实际 .mcp.json。版本目录列表仅供定位，不能认为排序最新的一项就一定生效：

```powershell
$pluginRoot = Join-Path $env:USERPROFILE '.codex\plugins\cache\openai-bundled\unified-computer-use'
Get-ChildItem -LiteralPath $pluginRoot -Filter .mcp.json -Recurse |
    Select-Object FullName
$manifestPath = Read-Host '输入已核实为当前生效的 .mcp.json 完整路径'
$config = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$server = $config.mcpServers.cua_repl
$nodeExe = $server.command
$entryPath = $server.args[0]
[pscustomobject]@{ command = $nodeExe; args = $server.args } | ConvertTo-Json
& $nodeExe --version
```

结合启用插件配置、实际进程可执行文件和入口参数核对生效版本。只输出必要字段，不要打印整个配置中的 env 或认证内容。跟踪入口的 import/launch 调用，找到实际 spawn 与子进程 env 构造。

本次版本链：

```text
unified-computer-use/26.928.31416/.mcp.json
  -> 当前自带 node.exe（v24.21.0）
  -> @oai/cua-repl/bin/cua-repl.mjs
  -> @oai/cua-repl/dist/lib/js/oai_js_cua_repl/src/launch.js
  -> CUA_REPL_NODE_REPL_PATH 指定的 node_repl.exe
```

这些是历史验收版本，不是让你照抄的安装路径。参考 issue 使用旧版 scripts/launch.mjs，本次版本已经没有该入口。不要改旧版 node_repl 配置并假定新插件会使用它。

## 4. 在实际子进程环境中补齐代理设置

[Node 官方文档](https://nodejs.org/learn/http/enterprise-network-configuration)说明，支持的 Node 版本可通过 NODE_USE_ENV_PROXY 或 --use-env-proxy 启用代理。必须核对实际自带 Node，而非系统 node 命令。

本次已有 HTTP_PROXY/HTTPS_PROXY，但没有 NODE_USE_ENV_PROXY。网络对照支持使用代理后，仅在实际 spawn 的 env 中加入下面七个键。示例为可读逻辑；应适配当前源文件，不要用此片段覆盖整个启动器：

```javascript
const proxy = "http://127.0.0.1:7890"; // 必须是本机验证通过的地址
const inheritedEnv = process.env; // 压缩代码中可能使用 i.env 等别名
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
// 将 ...proxyEnv 合并到现有 spawn options.env 的普通对象中。
// 保留原来的可执行文件、参数、stdio、可信服务和所有安全审批逻辑。
```

**Windows 细节：** process.env 不区分大小写。在本次测试中，先对 process.env 赋大小写变量再展开到普通对象，会只保留一套键。最终改为在实际子进程 env 普通对象中显式写入七个键；接着验证真实 Node 子进程能继承代理设置。不要修改 NODE_REPL_UNTRUSTED_ENV_ALLOWLIST 来暴露敏感环境。

## 5. 修改前备份，修改后检查

以下代码在 $launcherPath 已定位为当前实际文件后运行；备份必须先于写入：

```powershell
$launcherPath = Read-Host '输入已定位的实际 launcher 完整路径'
$backupPath = $launcherPath + '.backup-' + [Guid]::NewGuid().ToString('N') + '.bak'
$bytes = [IO.File]::ReadAllBytes($launcherPath)
$stream = [IO.File]::Open($backupPath, [IO.FileMode]::CreateNew,
    [IO.FileAccess]::Write, [IO.FileShare]::None)
try { $stream.Write($bytes, 0, $bytes.Length) } finally { $stream.Dispose() }
$originalHash = (Get-FileHash -LiteralPath $launcherPath -Algorithm SHA256).Hash
if ((Get-FileHash -LiteralPath $backupPath -Algorithm SHA256).Hash -ne $originalHash) {
    throw '备份校验失败，停止修改'
}
```

添加七个环境字段后检查：

```powershell
& $nodeExe --check $launcherPath
if ($LASTEXITCODE -ne 0) { throw '语法检查失败，停止启动并恢复备份' }
git -c core.autocrlf=false diff --no-index -- $backupPath $launcherPath
# git diff 在有差异时返回 1，这是正常的差异状态。
$patchedHash = (Get-FileHash -LiteralPath $launcherPath -Algorithm SHA256).Hash
```

确认差异只有代理环境设置，并记录原始/修改后校验和、绝对路径和备份位置。测试实际 launcher 构造的 env，并用真实子进程验证继承；测试应在隔离的诊断进程中完成，不要额外启动第二套浏览器后端。

本次首次改动入口文件后发现大小写问题，已恢复入口原始字节。最终只有实际 launch.js 被修改，旧备份保留，未删除任何文件。

## 6. 完全重启后真实验收

先保存网页中未提交的内容，自己完全退出并重新打开 Codex，保持代理运行。agent 不应突然关闭正在工作的应用。

重新使用官方浏览器工具完成：发现 Chrome → 读取真实标签页列表 → 新建公开页面 → 读取正文 → 清理测试页。API 以当次工具文档为准。若可访问性接口返回“没有变化”，使用完整快照，而不是把空增量误判为没有正文。

本次重启后的结果：

- 标签页列表成功返回 22 项，约 0.4 秒；没有输出个人标题和 URL。
- 在真实 Chrome 打开 [https://example.com/](https://example.com/)，约 8.2 秒返回 Example Domain。
- 完整快照读到文档示例说明及 Learn more 链接。
- 测试标签页关闭，原有标签页保留；补丁和备份校验通过。

这是一次短暂的公开页面验收，不是对 example.com 的持续监控。以上操作均成功后，才宣布此次故障修复。命令行拿到 200/403 或语法检查通过都不能替代浏览器验收。

## 7. 回滚与更新

退出 Codex 后，检查当前文件仍是自己记录的修改后版本、原备份哈希一致，再恢复匹配版本的原备份。先保留修改后文件的新备份，不删除文件。

```powershell
if ((Get-FileHash -LiteralPath $launcherPath).Hash -ne $patchedHash) {
    throw '文件已变化，停止回滚，避免覆盖新版'
}
if ((Get-FileHash -LiteralPath $backupPath).Hash -ne $originalHash) {
    throw '原备份校验失败'
}
[IO.File]::WriteAllBytes($launcherPath, [IO.File]::ReadAllBytes($backupPath))
& $nodeExe --check $launcherPath
```

上述变量来自第 5 节，应将它们保存在本机修复记录中。更新后重新定位配置和入口；不要把旧版文件整体覆盖到新版目录。

## 证据 → 结论 → 操作

| 证据 | 结论 | 操作 |
| --- | --- | --- |
| 发现成功，列表失败 | 故障不在浏览器发现阶段 | 查列表请求路径 |
| 同地址直连超时，7890 代理可达 | 本机存在代理路径差异 | 为当前子进程启用代理 |
| 10120 拒绝连接 | 此候选不可用 | 不写入 10120 |
| 缺少代理启用变量 | 仅有代理地址不足 | 添加 NODE_USE_ENV_PROXY=1 |
| 重启后真实列表和正文成功 | 此次修复已验证 | 留存备份及回滚记录 |

## 参考与适用边界

- [openai/codex issue #44364](https://github.com/openai/codex/issues/44364)：社区案例，提供代理启动环境修复方向；本教程在不同版本上重新定位并验证。
- [Node 官方代理说明](https://nodejs.org/learn/http/enterprise-network-configuration)。
- [OpenAI 浏览器扩展说明](https://learn.chatgpt.com/docs/chrome-extension)。

教程整理于 2026-10-02。个人用户名、完整本机路径、运行时目录标识和标签页内容均未公开。不会改变系统代理、TUN、防火墙、证书校验或审批逻辑。若代理比较不支持此诊断，就不要套用本修复。

<div align="center">
<sub><b>简体中文</b> | [English](./README.en.md)</sub>
</div>
