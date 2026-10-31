# @harness-js/core

A camada de DX do [HarnessJS](https://github.com/HarnessJs/HarnessJS): os decorators
`@Agent`, `@Workflow` e `@Tool`, mais o runtime que os executa sobre o
[`@harness-js/agentflow`](https://www.npmjs.com/package/@harness-js/agentflow).

É o único pacote que a maioria dos projetos importa.

```bash
npm install @harness-js/core zod
```

> `zod` é **peerDependency**: o schema das suas tools tem que vir da mesma
> instância que o framework usa para gerar o JSON Schema.

## Um agente

Um agente é uma classe com o prompt num markdown ao lado:

```
src/agents/explorer/
  explorer.agent.ts   ← a lógica
  explorer.agent.md   ← o prompt
```

```ts
import { Agent, DefaultAgentContract } from "@harness-js/core";
import { LocalOllama } from "../../providers/ollama.provider.js";

@Agent({
  provider: LocalOllama,
  tools: [ReadFileTool],
  prompt: "./explorer.agent.md",
  contract: DefaultAgentContract,
})
export class ExplorerAgent {}
```

### Contrato do agente

Todo agente declara um contrato. Ele é a única camada que decide o que chega ao
modelo; sem contrato, `@Agent` falha na definição da classe.

```ts
import type { AgentContract, AgentContractContext } from "@harness-js/core";

class ExplorerContract implements AgentContract {
  async build(ctx: AgentContractContext) {
    const documents = await search(ctx.input);
    return {
      instructions: ctx.prompt,
      memory: ctx.memory,
      history: ctx.history,
      documents,
    };
  }
}

@Agent({
  provider: LocalOllama,
  prompt: "./explorer.agent.md",
  contract: ExplorerContract,
})
export class ExplorerAgent {}
```

O retorno pode ser `Message[]`, enviado diretamente ao provider, ou um objeto,
que o framework organiza assim:

- `instructions` vira a mensagem `system`;
- todo valor que é `Message[]` (`history`, `conversation`, o nome que você
  escolher) vira os turnos da conversa, com as tools funcionando normalmente;
- as demais chaves viram seções `<chave>…</chave>`: texto vai como está, lista
  de textos uma linha por item, o resto em JSON indentado.

A ordem das chaves é a ordem do contexto. Seções declaradas antes da conversa
entram no `system`; as declaradas depois vão numa mensagem `user` ao final. Sem
conversa, todas vão numa mensagem `user`.

A posição importa para o cache de prompt: o provider reaproveita o começo
idêntico ao da chamada anterior. Ponha antes da conversa o que é estável
(instruções, memória) e depois dela o que muda a cada turno (o resultado de uma
busca, por exemplo):

```ts
return {
  instructions: ctx.prompt,
  memory: ctx.memory,
  history: ctx.history,
  documents: await search(ctx.input),
};
```

Qualquer outro valor (uma `string`, por exemplo) vai como uma mensagem `user`.
O `build()` pode ser assíncrono para consultar banco vetorial, banco relacional
ou APIs. Somente o que ele retorna chega ao modelo.

Para adotar explicitamente a projeção convencional do framework durante uma
migração, use `contract: DefaultAgentContract`.

## Um workflow

```ts
import { Workflow, loop, untilAnswered } from "@harness-js/core";

@Workflow({
  steps: [
    PlannerAgent,
    loop({ steps: [ExplorerAgent], until: untilAnswered }),
  ],
})
export class ExplorerWorkflow {}
```

```ts
const app = Harness.create(ExplorerWorkflow, { log: true, report: true });
console.log(await app.run({ prompt: "Revise o diretório src/" }));
```

## O que este pacote garante

| | |
| --- | --- |
| **Execuções isoladas** | Cada `run()` tem o próprio contexto — id, config, recorder e orçamento. Chamadas concorrentes, inclusive num handler HTTP, não se contaminam. |
| **Teto por padrão** | `maxIterations: 10` e `maxFails: 5` vêm ligados; `budget` limita tempo, chamadas, tokens e custo da run inteira. |
| **Falha de tool é observação** | O erro volta para o modelo, que corrige no turno seguinte. Para o que ele não conserta, `FatalToolError`. |
| **Observabilidade embutida** | Report HTML+JSON por execução e um stream de eventos para plugins — sem serviço externo. |
| **Erro que diz o conserto** | As mensagens nomeiam a classe, o parâmetro e o que fazer. |

## API

**Decorators** — `@Agent`, `@Workflow`, `@Tool`, `AgentContract`

**Injeção por parâmetro** — `@input()`, `@context()`, `@state()`, `@memory(Store)`

**Passos** — `loop`, `parallel`, `untilAnswered`, `calledTool`, `turnOf`, `wasExhausted`

**Execução** — `Harness.create`, `runWorkflow`, `run`, `WorkflowRuntime`

**Erros** — `FatalToolError`, `BudgetExceededError`

**Extensão** — `HarnessPlugin` com `onEvent` (observar) e `tool` / `chat` (interceptar)

Os blocos do engine (`Providers`, `OllamaProvider`, `OpenAIProvider`,
`VectorStore`, `VectorMemory`, `Pipeline`, `StateManager`) são reexportados por
conveniência — não é preciso depender do `@harness-js/agentflow` diretamente.

## Documentação

A referência completa — hooks, providers próprios, memória vetorial,
orçamentos, report e as armadilhas conhecidas — está no
[README do monorepo](https://github.com/HarnessJs/HarnessJS#readme) e em
<https://harnessjs.github.io>.

## Requisitos

Node ≥ 20. TypeScript com `experimentalDecorators: true`.

## Licença

MIT
