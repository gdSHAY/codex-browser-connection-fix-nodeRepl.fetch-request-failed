# 发给 Agent 的提示词 / Copyable agent prompts

先填写自己的代理候选地址，不要默认本教程示例端口可用。
Fill in your actual proxy candidates; do not assume this tutorial's example ports work.

## 中文提示词

```text
请实际排查并修复我这台 Windows 上 Codex 控制 Chrome 的问题，不要只给通用建议。

症状：能识别 Chrome，但读取标签页时约 21 秒后报 nodeRepl.fetch request failed。
新建会话和重装扩展没有解决。

我的本机 HTTP 代理候选地址：请先问我实际候选地址，或使用我随本提示词提供的地址。
必须验证监听、HTTP CONNECT/HTTP 代理能力和实际 HTTPS 可达性，不要假定 7890 或其他端口可用。

我授权本机只读诊断；仅在证据支持代理路径异常后，授权备份并最小修改当前生效的 Codex 浏览器控制启动器，使它使用我现有的本机代理。

执行要求：
1. 用当前官方浏览器工具复现，分别记录浏览器发现、标签页列表和网页内容读取在哪一步失败。不要公开个人标签页标题或 URL。
2. 对完全相同的公开地址比较直连和代理网络路径，使用实际自带 Node。不得发送认证令牌或打印响应正文。403 只证明网络可达，不等于修复成功。区分沙箱权限错误和真实网络失败。
3. 从当前生效 unified-computer-use 配置定位 cua_repl 的 command、args、实际入口和最终 spawn。结合实际进程核对，不要照抄旧版本目录或仅选择看起来最新的文件夹。
4. 核对自带 Node 的版本及代理支持，并检查真实子进程环境继承。不要假定系统代理或仅 HTTP_PROXY 就能让 fetch 自动走代理。
5. 证据支持修改时，先用唯一名称和不覆盖模式创建备份，核对校验和，再只补必要的代理环境字段。
6. 在实际启动位置设置 NODE_USE_ENV_PROXY=1、HTTP_PROXY/HTTPS_PROXY、http_proxy/https_proxy；使用已验证的本机地址。NO_PROXY/no_proxy 必须保留已有必要条目，并包含 localhost,127.0.0.1,::1。处理 Windows process.env 的大小写合并行为，确认子进程实际能继承。
7. 保留原可执行文件、参数、stdio、可信服务和安全审批逻辑。不要扩大不可信环境白名单；不要修改无关系统设置、TUN、防火墙或证书校验。不要用旧文件覆盖新版，不要删除文件。
8. 使用实际自带 Node 检查语法，核对差异及环境继承；报告最终唯一改动、备份位置、校验和、绝对路径和回滚方法。
9. 如需要完全重启，先完成修改及检查，再告诉我；不要突然退出当前应用。
10. 重启后必须真实读取 Chrome 标签页、打开公开测试页、读到页面正文，并清理仅由你创建的测试页，才能宣布成功。空增量快照应换完整快照检查。
11. 若仍失败，依据新的错误及证据继续排查，不要认定所有 nodeRepl.fetch request failed 都是代理问题。若文件被升级，重新定位，不要覆盖新版。
12. 不输出账号令牌、密码、个人页面内容或其他敏感配置。

参考：
https://github.com/openai/codex/issues/44364
https://nodejs.org/learn/http/enterprise-network-configuration

先给实测结论，再报告依据和下一步。
```

## English prompt

```text
Actually diagnose and repair Codex's Chrome control on this Windows computer. Do not only give generic advice.

Symptom: Chrome can be discovered, but listing tabs fails after about 21 seconds with nodeRepl.fetch request failed.
New conversations and extension reinstallation have not solved it.

My local HTTP proxy candidates: ask me for the actual addresses, or use addresses I provide with this prompt.
Verify listening ports, HTTP CONNECT / HTTP proxy capability, and actual HTTPS reachability. Never assume port 7890 or any other candidate works.

I authorize local read-only diagnostics. Only after evidence supports a proxy-routing problem, I authorize a unique backup and minimal changes to the currently active Codex browser-control launcher so it uses my existing local proxy.

Requirements:
1. Reproduce using the current official browser tool. Distinguish browser discovery, tab listing, and page-content reading. Do not disclose personal tab titles or URLs.
2. Compare direct and proxy paths to exactly the same public URLs using the actual bundled Node. Send no authentication tokens and print no response bodies. A 403 establishes reachability, not repair success. Separate sandbox restrictions from real network failures.
3. Locate cua_repl command, args, real entry point, and final child spawn from the active unified-computer-use configuration. Cross-check actual processes. Do not copy old version paths or simply select the newest-looking folder.
4. Verify bundled Node version, proxy support, and actual child environment inheritance. Do not assume system proxy settings or HTTP_PROXY alone make fetch use a proxy.
5. If evidence supports editing, first create a uniquely named backup without overwriting existing files, verify its checksum, then add only the required proxy environment settings.
6. Set NODE_USE_ENV_PROXY=1, HTTP_PROXY/HTTPS_PROXY, and http_proxy/https_proxy at the actual startup location using the verified local address. Preserve required existing NO_PROXY/no_proxy entries and include localhost,127.0.0.1,::1. Account for Windows process.env case folding and verify real child inheritance.
7. Preserve the executable, arguments, stdio, trusted services, and security approval logic. Do not broaden untrusted environment allowlists or change unrelated settings, TUN, firewall, or certificate validation. Never overwrite a newer launcher with an older whole file. Delete nothing.
8. Use the actual bundled Node for syntax checks, inspect the diff and inherited environment, and report the final changed file, unique backup, checksums, absolute paths, and rollback procedure.
9. If a full restart is needed, finish edits and checks before telling me. Do not unexpectedly quit my application.
10. After restart, actually list Chrome tabs, open a public test page, read its body content, and close only your test tab before declaring success. Use a full snapshot if an incremental snapshot is empty.
11. If it still fails, continue from the new evidence. Do not assume every identical error has a proxy cause. Rediscover active paths after updates; do not overwrite a newer version.
12. Do not output tokens, passwords, personal page contents, or other sensitive configuration.

References:
https://github.com/openai/codex/issues/44364
https://nodejs.org/learn/http/enterprise-network-configuration

Lead with measured conclusions, then evidence and next steps.
```

## 重启后的验收提示词 / Post-restart verification prompt

中文：

```text
我已完全退出并重新打开 Codex，代理保持运行。
请用官方浏览器工具实际读取 Chrome 标签页列表（只输出数量），新建公开测试页并读取正文，关闭测试页，核对当前启动器补丁及原备份。
全部通过才宣布成功；失败则依据证据继续排查，不要再次只给通用建议。
```

English:

```text
I fully exited and reopened Codex, and my proxy is still running.
Use the official browser tool to read the real Chrome tab list (report only its count), open a new public test page, read its body, and close the test tab. Check the active patch and original backup.
Declare success only if every check passes. Otherwise continue diagnosis from evidence rather than repeating generic advice.
```
