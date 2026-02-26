# openclaw-exa-search

Exa AI search plugin for [OpenClaw](https://openclaw.ai). No API key required — uses [Exa's public MCP endpoint](https://mcp.exa.ai).

## Tools

| Tool | Parameters | Description |
|------|-----------|-------------|
| `exa_web_search` | `query`, `numResults?`, `type?` (`auto`/`fast`/`deep`), `livecrawl?` (`fallback`/`preferred`) | Neural web search — news, facts, current info. |
| `exa_code_search` | `query`, `tokensNum?` (1000–50000) | Find code examples, docs, and solutions from GitHub, Stack Overflow, and official documentation. |
| `exa_company_research` | `companyName`, `numResults?` | Research any company — products, services, recent news, industry position. |
| `exa_twitter_search` | `query`, `numResults?`, `startPublishedDate?`, `endPublishedDate?` | Search Twitter/X posts and discussions. Filter by date range (ISO 8601). |
| `exa_people_search` | `query`, `numResults?` | Find people by name, role, company, or expertise. Returns public LinkedIn and professional profiles. |
| `exa_financial_report_search` | `query`, `numResults?`, `startPublishedDate?`, `endPublishedDate?` | Search SEC filings (10-K, 10-Q), earnings reports, and annual/quarterly financial documents. |

All tools are enabled by default. Requests time out after 30 seconds.

## Install

```bash
openclaw plugins install openclaw-exa-search
openclaw plugins enable openclaw-exa-search
openclaw gateway restart
```

If you have a `plugins.allow` allowlist configured, add the plugin id:

```json
{
  "plugins": {
    "allow": ["openclaw-exa-search"]
  }
}
```

Verify:

```bash
openclaw plugins list | grep openclaw-exa-search
```

## Examples

- "Search Twitter for what people are saying about GPT-5"
- "Find the latest Apple 10-Q filing"
- "Research Anthropic as a company"
- "Find CTO profiles at YC startups"
- "Search for React Server Components examples"

## Development

```bash
npm install
npm run typecheck
npm test              # unit tests
npm run test:integration  # integration tests (hits real Exa endpoint)
```

## Notes

- This plugin depends on Exa's public MCP endpoint (`mcp.exa.ai`). If Exa adds authentication or rate limiting in the future, the plugin will need updates.
- Date parameters use ISO 8601 format (e.g., `2024-01-01T00:00:00.000Z`).

## License

MIT

## Acknowledgements

- [exa-mcp-server](https://github.com/exa-labs/exa-mcp-server) — Official Exa MCP server
- [exa-search](https://github.com/wysh3/exa-search) — Exa search MCP integration
