import type { VectorStore } from "@harness-js/agentflow";

/**
 * Ajustes de runtime de uma execução, definidos pelo `Harness.create` e
 * transportados no `RunContext`.
 */
export interface RuntimeSettings {
  /** Stores vetoriais da aplicação, na ordem em que são injetados. */
  stores: VectorStore[];
}

export const DEFAULTS: RuntimeSettings = { stores: [] };
