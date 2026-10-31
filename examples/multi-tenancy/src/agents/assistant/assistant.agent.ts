import { Agent, DefaultAgentContract } from "@harness-js/core";
import { providerDoTenant } from "../../providers/ollama.provider";
import { QuemSouTool } from "../../tools/quem-sou.tool";

@Agent({
  // Factory em vez de classe: resolvida por execução, enxerga o `data`.
  provider: providerDoTenant,
  tools: [QuemSouTool],
  prompt: "./assistant.agent.md",
  contract: DefaultAgentContract,
})
export class AssistantAgent {}
