import { execSync } from 'node:child_process';

async function main() {
  const ApiBase = "http://127.0.0.1:3100/api";

  // 1. Create company
  const res = await fetch(`${ApiBase}/companies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'TradingAgents', issuePrefix: 'TA' })
  });

  if (!res.ok) {
    console.error("Failed to create company:", await res.text());
    return;
  }

  const comp = await res.json();
  const companyId = comp.id;
  console.log("✅ Company created:", comp.name, "(Prefix:", comp.issuePrefix, ", ID:", companyId, ")");

  // 2. Define agents based on the plan
  const agents = [
    { ref: "pm", name: "投资组合经理", role: "ceo", title: "投资组合经理 (CEO)", icon: "crown", reportsToRef: null, capabilities: "最终决策，审批交易提案，管理整体投资组合", adapterConfig: { skills: ["papertape", "para-memory-files"] } },
    { ref: "rm", name: "风险管理员", role: "general", title: "风险管理团队", icon: "shield", reportsToRef: "pm", capabilities: "评估市场波动性、流动性，持续监控风险", adapterConfig: { skills: ["papertape", "ssh-mcp"] } },
    { ref: "tr", name: "交易员", role: "general", title: "交易员代理", icon: "zap", reportsToRef: "pm", capabilities: "整合报告，决定交易时机和规模，执行交易", adapterConfig: { skills: ["papertape", "para-memory-files"] } },
    { ref: "lr", name: "多头研究员", role: "researcher", title: "多头研究员", icon: "telescope", reportsToRef: "pm", capabilities: "评估分析师见解，寻找做多机会", adapterConfig: { skills: ["papertape", "para-memory-files"] } },
    { ref: "sr", name: "空头研究员", role: "researcher", title: "空头研究员", icon: "microscope", reportsToRef: "pm", capabilities: "寻找做空机会，进行批判性辩论", adapterConfig: { skills: ["papertape", "para-memory-files"] } },
    { ref: "fa", name: "基本面分析师", role: "researcher", title: "基本面分析师", icon: "file-code", reportsToRef: "lr", capabilities: "评估公司财务、业绩指标、内在价值", adapterConfig: { skills: ["sugarforever/01coder-agent-skills@china-stock-analysis", "nicepkg/ai-workflow@a-share-analysis"] } },
    { ref: "sa", name: "情绪分析师", role: "researcher", title: "情绪分析师", icon: "heart", reportsToRef: "lr", capabilities: "社交媒体情绪分析", adapterConfig: { skills: ["omer-metin/skills-for-antigravity@sentiment-analysis-trading"] } },
    { ref: "na", name: "新闻分析师", role: "researcher", title: "新闻分析师", icon: "globe", reportsToRef: "lr", capabilities: "监测全球新闻和宏观经济", adapterConfig: { skills: ["nanmicoder/newscrawler@china-news-crawler", "skills.volces.com@a-share-daily-report"] } },
    { ref: "ta", name: "技术分析师", role: "researcher", title: "技术分析师", icon: "radar", reportsToRef: "lr", capabilities: "MACD、RSI等技术指标分析", adapterConfig: { skills: ["ssh-mcp"] } }
  ];

  const agentIds = {};

  // 3. Create agents sequentially
  for (const agent of agents) {
    const parentId = agent.reportsToRef ? agentIds[agent.reportsToRef] : null;
    const body = {
      name: agent.name,
      role: agent.role,
      title: agent.title,
      icon: agent.icon,
      reportsTo: parentId,
      capabilities: agent.capabilities,
      adapterType: "codebuddy_local",
      adapterConfig: agent.adapterConfig
    };

    const agRes = await fetch(`${ApiBase}/companies/${companyId}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!agRes.ok) {
      console.error("❌ Failed to create agent", agent.name, await agRes.text());
    } else {
      const ag = await agRes.json();
      agentIds[agent.ref] = ag.id;
      console.log("✅ Created agent", agent.name, "( ID:", ag.id, ") reporting to", parentId);
    }
  }

  // 4. Update status to running by approving via API
  console.log("Approving agents via REST API...");
  try {
    const appsRes = await fetch(`${ApiBase}/companies/${companyId}/approvals?status=pending`);
    if (appsRes.ok) {
      const apps = await appsRes.json();
      for (const app of apps) {
        if (app.type === 'hire_agent') {
          await fetch(`${ApiBase}/approvals/${app.id}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decidedByUserId: 'local-board' })
          });
        }
      }
      console.log("✅ All pending agents approved to running state.");
    } else {
      console.log("⚠️ Could not fetch pending approvals.", await appsRes.text());
    }
  } catch (err) {
    console.log("⚠️ Could not approve agents via API.", err.message);
  }

  // 5. Create an issue and assign to PM
  const pmId = agentIds["pm"];
  const issuePayload = {
    title: "分析力源信息(300184)股票并提供研究报告",
    description: "请分析力源信息(300184)近期的基本面、技术面、新闻面和情绪面情况。请协调 Long Researcher, Short Researcher, Fundamental Analyst, Sentiment Analyst, News Analyst, Technical Analyst 团队成员共同完成。分析完成后，请生成一份完整的综合分析报告。\n\n<plan>\n1. 交派任务给各下属分析师/研究员\n2. 收集多维度分析数据\n3. 汇总成综合研究报告\n</plan>",
    status: "todo",
    assigneeAgentId: pmId
  };

  const issueRes = await fetch(`${ApiBase}/companies/${companyId}/issues`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(issuePayload)
  });

  if (!issueRes.ok) {
    console.error("❌ Failed to create issue", await issueRes.text());
  } else {
    const issue = await issueRes.json();
    console.log("✅ Created issue:", issue.title, "( ID:", issue.id, ")");
  }

  // 6. Trigger a heartbeat for PM
  console.log("Triggering heartbeat to start processing...");
  try {
    // using tsx directly from node_modules since pnpm run might need correct context
    execSync(`npx tsx cli/src/index.ts heartbeat run --agent-id ${pmId}`, { stdio: 'inherit' });
    console.log("✅ Heartbeat triggered for PM.");
  } catch (e) {
    console.error("❌ Heartbeat failed.", e.message);
  }

  console.log("\nDashboard Location: http://localhost:3100/" + comp.issuePrefix + "/dashboard");
}

main().catch(console.error);
