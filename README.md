<div align="center">

<img src="https://harnessjs.github.io/assets/logo.png" alt="HarnessJS" width="120">

# HarnessJS

**A TypeScript framework for building agents that you can put a price cap on.**

[![npm](https://img.shields.io/npm/v/@harness-js/core?color=%23c1121f&label=%40harness-js%2Fcore)](https://www.npmjs.com/package/@harness-js/core)
[![CI](https://github.com/HarnessJs/HarnessJS/actions/workflows/ci.yml/badge.svg)](https://github.com/HarnessJs/HarnessJS/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@harness-js/core?color=%23555)](./LICENSE)
[![node](https://img.shields.io/node/v/@harness-js/core?color=%23555)](https://nodejs.org)

[Documentation](https://harnessjs.github.io/en/) ·
[Get started](https://harnessjs.github.io/en/get-started/installation) ·
[Português](https://harnessjs.github.io/pt/)

</div>

---

<div align="center">

<img src="https://harnessjs.github.io/assets/quickstart.gif" alt="Scaffold a project, point it at a model, and run it" width="100%">

<sub>Scaffold, point it at a model, run. No wrapper, no cloud account.</sub>

</div>

## The ceiling is part of the code

An agent that loops is an agent that spends. Every run takes a `budget`, and it
is checked between units of work — not reported after the invoice arrives.

```ts
const app = Harness.create(ReviewWorkflow, { report: true });

const answer = await app.run({
  prompt: "Review src/",
  budget: {
    maxCostUsd: 0.5, // hard ceiling, in money
    maxChatCalls: 20, // model round-trips
    maxDurationMs: 60_000, // wall clock
    onExceeded: (info) => log.warn(`stopped by ${info.reason}`),
  },
});
```

By default it stops gracefully: the remaining steps are skipped and the run
returns what it already had, with `stoppedBy` in the report so "it converged"
and "it gave up" never look alike. Set `onExceeded: "throw"` if you would rather
fail loudly.

`maxCostUsd` needs a price on the provider — the framework will not guess what
your tokens cost.

## Why this exists

Most agent frameworks are a bag of plugins: everything is replaceable, so
nothing is guaranteed. You compose six libraries and discover at runtime that
cancellation does not reach the HTTP call, that two concurrent runs share a
module-level singleton, and that nobody was counting the money.

HarnessJS goes the other way. The run owns a context, a budget, a recorder and a
cancellation signal, and every layer is built to respect them — a `parallel`
block appends in declaration order, a cancelled run aborts the model call in
flight, and a tool failure is an observation the agent can recover from rather
than an exception that ends the world.

Fewer knobs, and the ones that exist mean something.

## Install

```bash
npm i @harness-js/core zod
```

**zod 4 is required.** Tool schemas are zod schemas (`@Tool({ schema })`), and
the framework converts them with `z.toJSONSchema`, which only exists in v4. If
your project already pins zod 3, the install fails — that is deliberate: two
copies of zod in one tree crash at the first model call, deep inside zod, with
an error nobody can trace back to here.

Or scaffold a whole project:

```bash
npx @harness-js/cli create my-agent
```

## An agent in fifteen lines

```ts
import {
  Agent,
  DefaultAgentContract,
  Harness,
  Workflow,
  OpenAIProvider,
} from "@harness-js/core";

class GPT extends OpenAIProvider {
  constructor() {
    super({ apiKey: process.env.OPENAI_API_KEY!, model: "gpt-4o-mini" });
  }
}

@Agent({
  provider: GPT,
  prompt: "./reviewer.agent.md",
  contract: DefaultAgentContract,
})
class ReviewerAgent {}

@Workflow({ steps: [ReviewerAgent] })
class ReviewWorkflow {}

const app = Harness.create(ReviewWorkflow, {});
console.log(await app.run({ prompt: "Review src/" }));
```

The prompt lives in a markdown file next to the class, so it can be reviewed
like prose instead of hidden in a template literal.

## Packages

| Package | What |
| --- | --- |
| [`@harness-js/core`](https://www.npmjs.com/package/@harness-js/core) | Decorators, DI, run context, middleware, observability |
| [`@harness-js/agentflow`](https://www.npmjs.com/package/@harness-js/agentflow) | The engine: pipeline, providers, state, tools |
| [`@harness-js/tools`](https://www.npmjs.com/package/@harness-js/tools) | Ready-made tools |
| [`@harness-js/flow`](https://www.npmjs.com/package/@harness-js/flow) | Live execution viewer in the browser |
| [`@harness-js/qdrant-client`](https://www.npmjs.com/package/@harness-js/qdrant-client) | Qdrant `VectorStore`, no SDK |
| [`@harness-js/cli`](https://www.npmjs.com/package/@harness-js/cli) | `harness create`, `harness g agent` |

## Documentation

The manual is a site, not this file — 71 pages per language, in English and
Portuguese.

- **[Get started](https://harnessjs.github.io/en/get-started/installation)** —
  install, first agent, first tool, first workflow
- **[Fundamentals](https://harnessjs.github.io/en/fundamentals/agents)** — agents,
  tools, providers, state, hooks, middleware
- **[Techniques](https://harnessjs.github.io/en/techniques/budgets)** — budgets,
  loops, parallel execution, RAG, cancellation
- **[Reference](https://harnessjs.github.io/en/reference/agent)** — every
  decorator, option and type
- **[Deployment](https://harnessjs.github.io/en/deployment/production)** —
  production, scaling, multi-tenancy

## Status

`0.x`, and the API still moves. Breaking changes bump the **minor** — that is
what stops `^0.x.y` from installing one on its own — and every one of them ships
with a migration table in [CHANGELOG.md](./CHANGELOG.md).

Node >= 20.19. One runtime dependency: `zod`.

## Contributing

[CONTRIBUTING.md](./CONTRIBUTING.md) has the setup, the conventions and how a
release is cut. Security reports go through
[SECURITY.md](./SECURITY.md) — please do not open a public issue.

## License

[MIT](./LICENSE) — © 2026 castroneto.
