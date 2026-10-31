import { Agent, DefaultAgentContract } from "@harness-js/core";
import { LocalOllamaProvider } from "../../providers/ollama.provider.js";

@Agent({
  provider: LocalOllamaProvider,
  tools: [],
  prompt: "./planner.agent.md",
  contract: DefaultAgentContract,
})
export class PlannerAgent {}
