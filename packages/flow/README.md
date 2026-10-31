# @harness-js/flow

Visualizador ao vivo da execução dos seus agentes. Sobe um site local que
desenha, em tempo real, a árvore do que está rodando — workflow, loops, agentes,
chamadas ao modelo e tools — com o prompt e a resposta de cada passo.

```bash
npm install @harness-js/flow
```

```ts
import { Harness } from "@harness-js/core";
import { harnessFlow } from "@harness-js/flow";
import { MeuWorkflow } from "./workflows/meu.workflow.js";

const app = Harness.create(MeuWorkflow, { log: true });
await app.use(harnessFlow());

await app.run({ prompt: "Olá" });
```

Abra <http://127.0.0.1:4100>. Os nós aparecem conforme acontecem; clique em um
para ver o prompt enviado, a resposta, a entrada e a saída da tool, os tokens e
o erro, se houve.

## O que ele mostra

| Ícone | Passo      | O que é                                        |
| ----- | ---------- | ---------------------------------------------- |
| `▣`   | `workflow` | a execução inteira                             |
| `↻`   | `loop`     | um bloco `loop({ ... })`                       |
| `⇉`   | `parallel` | um bloco `parallel([ ... ])`                   |
| `◆`   | `agent`    | um passo de agente                             |
| `✦`   | `chat`     | uma chamada ao modelo                          |
| `⚙`   | `tool`     | uma tool executada                             |

A borda esquerda dá o estado: azul pulsando enquanto roda, verde no fim, vermelho
quando falha. A lista lateral guarda as execuções anteriores da sessão — o Flow
acompanha a mais recente sozinho, a menos que você clique numa antiga.

## Opções

```ts
await app.use(
  harnessFlow({
    port: 4100,        // porta do site
    host: "127.0.0.1", // interface de escuta — local, de propósito
    maxRuns: 20,       // execuções mantidas em memória
    log: true,         // imprime a URL ao subir
  }),
);
```

## O que saber antes

**Nada é persistido.** O histórico vive na memória do processo. Fechou, acabou.
Para um arquivo que sobrevive à execução, use o
[report](https://harnessjs.github.io/guias/report) — os dois funcionam juntos.

**O processo fica aberto depois do `run`.** É o que dá tempo de olhar o
resultado. Encerre com `Ctrl+C`, ou chame `await app.dispose()` quando quiser que
o script termine sozinho.

**Ele não toma o lugar do seu `log`.** O `log` do `HarnessConfig` continua
funcionando junto; vários plugins também coexistem.

**Escuta só em `127.0.0.1`.** O prompt e a resposta de cada passo passam por ali,
e isso costuma incluir dado sensível. Mudar o `host` expõe tudo isso na rede —
faça só se souber por quê.

## Escrever o seu próprio plugin

`harnessFlow()` é só um `HarnessPlugin`. O mesmo stream está aberto para qualquer
destino — um Datadog, um arquivo, um webhook:

```ts
import type { HarnessPlugin } from "@harness-js/core";

export function meuPlugin(): HarnessPlugin {
  return {
    name: "meu-plugin",
    setup: () => conectar(),
    onEvent: (evento) => enviar(evento),
    dispose: () => fechar(),
  };
}
```

## Licença

MIT
