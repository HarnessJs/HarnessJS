#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { invalidNameReason, isHarnessProject } from "./checks.js";
import {
  agentContractTsTemplate,
  agentMdTemplate,
  agentTsTemplate,
  projectFiles,
} from "./templates.js";

function version(): string {
  try {
    const pkg = fileURLToPath(new URL("../package.json", import.meta.url));
    return JSON.parse(readFileSync(pkg, "utf-8")).version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function usage(): void {
  console.log(`HarnessJS CLI

Uso:
  harness create <nome>        Cria um projeto novo em ./<nome>
  harness g agent <nome>       Gera um agente em src/agents/<nome>/ (dentro do projeto)

Opções:
  -v, --version              Mostra a versão
  -h, --help                 Mostra esta ajuda

Exemplos:
  harness create my-agent
  harness g agent explorer
`);
}

/** Escreve um arquivo criando as pastas necessárias e loga o caminho. */
function write(root: string, path: string, content: string): void {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  console.log(`  CREATE ${relative(process.cwd(), full)}`);
}

/** Para com uma mensagem quando o nome não serve, antes de qualquer arquivo. */
function requireValidName(name: string): void {
  const reason = invalidNameReason(name);
  if (reason) {
    console.error(`Erro: ${reason}`);
    process.exit(1);
  }
}

function create(name: string): void {
  requireValidName(name);
  const dir = join(process.cwd(), name);
  if (existsSync(dir)) {
    console.error(`Erro: o diretório "${name}" já existe.`);
    process.exit(1);
  }
  console.log(`Criando o projeto HarnessJS "${name}"…\n`);
  for (const file of projectFiles(name)) {
    write(dir, file.path, file.content);
  }
  console.log(`\n✔ Pronto! Próximos passos:

  cd ${name}
  npm install
  npm start
`);
}

function generateAgent(name: string): void {
  requireValidName(name);
  if (!isHarnessProject(process.cwd())) {
    console.error(
      "Erro: rode este comando na raiz de um projeto HarnessJS " +
        "(a pasta com o package.json que depende de @harness-js/core).",
    );
    process.exit(1);
  }

  const base = join(process.cwd(), "src", "agents", name);
  const contracts = join(process.cwd(), "src", "contracts");
  // Confere tudo antes de escrever qualquer coisa: o contrato vive fora da
  // pasta do agente, e um `<nome>.contract.ts` que já existisse era
  // sobrescrito em silêncio.
  for (const path of [base, join(contracts, `${name}.contract.ts`)]) {
    if (existsSync(path)) {
      console.error(`Erro: já existe ${relative(process.cwd(), path)}`);
      process.exit(1);
    }
  }

  write(base, `${name}.agent.ts`, agentTsTemplate(name));
  write(base, `${name}.agent.md`, agentMdTemplate(name));
  write(contracts, `${name}.contract.ts`, agentContractTsTemplate(name));
}

function main(): void {
  const args = process.argv.slice(2);
  const [command, ...rest] = args;

  if (command === "-v" || command === "--version") {
    console.log(version());
    return;
  }
  if (!command || command === "-h" || command === "--help") {
    usage();
    process.exit(command ? 0 : 1);
  }

  if (command === "create" || command === "new") {
    const name = rest[0];
    if (!name) {
      console.error("Erro: informe o nome do projeto. Ex.: harness create my-agent");
      process.exit(1);
    }
    create(name);
    return;
  }

  if (command === "g" || command === "generate") {
    const [type, name] = rest;
    if (type === "agent" && name) {
      generateAgent(name);
      return;
    }
  }

  usage();
  process.exit(1);
}

main();
