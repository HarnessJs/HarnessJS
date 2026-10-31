import { describe, expect, it } from "vitest";
import type { AgentContract, AgentContractContext, Message } from "@harness-js/core";
import { DefaultAgentContract, runWorkflow } from "@harness-js/core";
import { FakeProvider, makeAgent, makeWorkflow } from "./harness.js";

describe("AgentContract", () => {
  // Regressão da 0.13: o objeto inteiro ia em JSON numa mensagem `user`, e o
  // modelo perdia o `system` e os turnos da conversa.
  it("um objeto vira system com seções e turnos de verdade", async () => {
    const provider = new FakeProvider();

    class Contract implements AgentContract {
      build(ctx: AgentContractContext) {
        return {
          instructions: ctx.prompt,
          memory: ctx.memory,
          documents: [{ path: "a.ts" }],
          conversation: ctx.history,
        };
      }
    }

    const Agent = makeAgent({ provider, contract: Contract });
    await runWorkflow(makeWorkflow([Agent]), "pergunta", undefined, {
      seed: { memory: ["fato", "outro fato"] },
    });

    expect(provider.chamadas[0].messages).toEqual([
      {
        role: "system",
        content: [
          "You are a test agent.\n",
          "<memory>\nfato\noutro fato\n</memory>",
          `<documents>\n${JSON.stringify([{ path: "a.ts" }], null, 2)}\n</documents>`,
        ].join("\n\n"),
      },
      { role: "user", content: "pergunta" },
    ]);
  });

  // O que muda a cada turno, posto depois da conversa, não invalida o cache de
  // prompt do que vem antes.
  it("seções declaradas depois da conversa vão depois dela", async () => {
    const provider = new FakeProvider();

    class Contract implements AgentContract {
      build(ctx: AgentContractContext) {
        return {
          instructions: ctx.prompt,
          history: ctx.history,
          documents: "trecho encontrado",
        };
      }
    }

    await runWorkflow(
      makeWorkflow([makeAgent({ provider, contract: Contract })]),
      "pergunta",
    );

    expect(provider.chamadas[0].messages).toEqual([
      { role: "system", content: "You are a test agent.\n" },
      { role: "user", content: "pergunta" },
      { role: "user", content: "<documents>\ntrecho encontrado\n</documents>" },
    ]);
  });

  it("sem turnos, as seções vão numa mensagem user", async () => {
    const provider = new FakeProvider();

    class Contract implements AgentContract {
      build(ctx: AgentContractContext) {
        return { instructions: ctx.prompt, question: ctx.input, empty: [] };
      }
    }

    await runWorkflow(
      makeWorkflow([makeAgent({ provider, contract: Contract })]),
      "pergunta",
    );

    expect(provider.chamadas[0].messages).toEqual([
      { role: "system", content: "You are a test agent.\n" },
      { role: "user", content: "<question>\npergunta\n</question>" },
    ]);
  });

  it("um objeto sem nada a enviar falha nomeando o agente", async () => {
    const provider = new FakeProvider();

    class Contract implements AgentContract {
      build() {
        return { nothing: undefined };
      }
    }

    await expect(
      runWorkflow(
        makeWorkflow([makeAgent({ provider, contract: Contract })]),
        "pergunta",
      ),
    ).rejects.toThrow(/nothing to send to the model/);
  });

  it("aceita build assíncrono e Message[] sem reserializar", async () => {
    const provider = new FakeProvider();
    const messages: Message[] = [{ role: "system", content: "do banco vetorial" }];

    class Contract implements AgentContract<Message[]> {
      async build() {
        await Promise.resolve();
        return messages;
      }
    }

    await runWorkflow(
      makeWorkflow([makeAgent({ provider, contract: Contract })]),
      "pergunta",
    );

    expect(provider.chamadas[0].messages).toEqual(messages);
  });

  it("o contrato padrão explícito preserva prompt, memory, tasks e history", async () => {
    const provider = new FakeProvider();
    await runWorkflow(
      makeWorkflow([makeAgent({ provider, contract: DefaultAgentContract })]),
      "pergunta",
      undefined,
      { seed: { memory: ["fato"], tasks: ["agir"] } },
    );

    expect(provider.chamadas[0].messages).toEqual([
      { role: "system", content: "You are a test agent.\n" },
      { role: "system", content: "fato\n\nTasks:\n- agir" },
      { role: "user", content: "pergunta" },
    ]);
  });
});
