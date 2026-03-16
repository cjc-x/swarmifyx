# Create TradingAgents Company in Papertape

The goal is to create a new Papertape company named **TradingAgents** and configure a team of agents according to the TauricResearch TradingAgents framework.

## Proposed Changes

We will use the Papertape REST API (running at `http://127.0.0.1:3100`) to create the company and hire the agents.

### 1. Create Company
- **Company Name**: TradingAgents
- **Issue Prefix**: TA

### 2. Create Agents (using `codebuddy_local` adapter)

We will create the following agents and configure their reporting structure, capabilities, and relevant tools (MCP servers and skills):

| Agent Name (Role) | Title | Icon | Reports To | Capabilities / Focus | Skills / MCP Tools Configured |
|-------------------|-------|------|------------|----------------------|-------------------------------|
| **Portfolio Manager** (`portfolio_manager`) | 投资组合经理 (CEO) | crown | *(None)* | 最终决策，审批交易提案，管理整体投资组合 | `papertape` (公司协作)<br>`para-memory-files` (记忆) |
| **Risk Manager** (`risk_manager`) | 风险管理团队 | shield | Portfolio Manager | 评估市场波动性、流动性，持续监控风险 | `papertape`<br>`ssh-mcp` (连接风控系统) |
| **Trader** (`trader`) | 交易员代理 | zap | Portfolio Manager | 整合报告，决定交易时机和规模，执行交易 | `papertape`<br>`para-memory-files` (记录信息) |
| **Long Researcher** (`long_researcher`) | 多头研究员 | telescope | Portfolio Manager | 评估分析师见解，寻找做多机会 | `papertape`<br>`para-memory-files` |
| **Short Researcher** (`short_researcher`) | 空头研究员 | microscope | Portfolio Manager | 寻找做空机会，进行批判性辩论 | `papertape`<br>`para-memory-files` |
| **Fundamental Analyst** (`fundamental_analyst`) | 基本面分析师 | file-code | Long/Short Researcher | 评估公司财务、业绩指标、内在价值 | `sugarforever/01coder-agent-skills@china-stock-analysis`<br>`nicepkg/ai-workflow@a-share-analysis` |
| **Sentiment Analyst** (`sentiment_analyst`) | 情绪分析师 | heart | Long/Short Researcher | 社交媒体情绪分析 | `omer-metin/skills-for-antigravity@sentiment-analysis-trading` |
| **News Analyst** (`news_analyst`) | 新闻分析师 | globe | Long/Short Researcher | 监测全球新闻和宏观经济 | `nanmicoder/newscrawler@china-news-crawler`<br>`skills.volces.com@a-share-daily-report` |
| **Technical Analyst** (`technical_analyst`) | 技术分析师 | radar | Long/Short Researcher | MACD、RSI等技术指标分析 | `ssh-mcp` (连接量化服务器) |

*Note: All agents will use the `codebuddy_local` adapter type.*

## Verification Plan

### Automated Tests
- Script a validation check using `curl -sS http://127.0.0.1:3100/api/companies/{companyId}/agents` to ensure all 9 agents are created with the correct `codebuddy_local` adapter and reporting lines.

### Manual Verification
- Output the Papertape Dashboard UI link for the TradingAgents company.
- The user can log in to the Board UI and confirm the reporting hierarchy matches the plan.
