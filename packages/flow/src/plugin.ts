import type { HarnessPlugin } from "@harness-js/core";
import { FlowServer } from "./server/server.js";
import type { FlowOptions } from "./types.js";

/**
 * Sobe o site do Flow e transmite a execução para ele ao vivo.
 *
 * ```ts
 * const app = Harness.create(MeuWorkflow, { log: true });
 * await app.use(harnessFlow({ port: 4100 }));
 * await app.run({ prompt: "olá" });
 * ```
 *
 * O servidor segura o processo aberto depois do `run`, para dar tempo de olhar
 * o resultado. Feche com `Ctrl+C` ou `await app.dispose()`.
 */
export function harnessFlow(options: FlowOptions = {}): HarnessPlugin {
  const server = new FlowServer(options);

  return {
    name: "harness-flow",

    async setup() {
      await server.start();
    },

    onEvent(evento) {
      server.publish(evento);
    },

    async dispose() {
      await server.stop();
    },
  };
}
