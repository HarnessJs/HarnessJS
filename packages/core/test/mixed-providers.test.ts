import { describe, expect, it } from "vitest";
import { z } from "zod";
import { runWorkflow } from "@harness-js/core";
import { FakeProvider, makeAgent, makeTool, makeWorkflow } from "./harness.js";

const eco = makeTool(
  { name: "eco", description: "eco", schema: z.object({ x: z.string() }) },
  ({ x }: { x: string }) => x,
);

/**
 * Regressão: o Ollama não manda id nas tool calls (o `FakeProvider` também
 * não). O id era inventado só na serialização da OpenAI, diferente a cada
 * turno, e o resultado da tool ia sem `toolCallId` — um history vindo de um
 * agente local virava `400` no agente pago seguinte.
 */
describe("tool call sem id do provider", () => {
  it("chega ao próximo agente com pedido e resultado ligados pelo mesmo id", async () => {
    const local = new FakeProvider([{ tool: { name: "eco", arguments: { x: "oi" } } }]);
    const pago = new FakeProvider();

    await runWorkflow(
      makeWorkflow([
        makeAgent({ provider: local, tools: [eco] }),
        makeAgent({ provider: pago }),
      ]),
      "vai",
    );

    const recebido = pago.chamadas[0].messages;
    const pedido = recebido.find((m) => m.toolCalls?.length)?.toolCalls?.[0];
    const resultado = recebido.find((m) => m.role === "tool");

    expect(pedido?.id).toMatch(/^call_\w+$/);
    expect(resultado?.toolCallId).toBe(pedido?.id);
  });
});
