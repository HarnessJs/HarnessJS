import { Workflow } from "@harness-js/core";
import { AssistantAgent } from "../agents/assistant/assistant.agent";

@Workflow({
  steps: [AssistantAgent],
})
export class AssistantWorkflow {}
