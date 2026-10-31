import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { invalidNameReason, isHarnessProject } from "../src/checks.js";

/**
 * O nome digitado vira caminho, `package.json` e nome de classe. Cada caso
 * recusado aqui já gerou arquivo errado: `../fora` escrevia fora da pasta,
 * `Code Reviewer` criava arquivos com espaço.
 */
describe("invalidNameReason", () => {
  it.each(["meu-app", "explorer", "code-reviewer", "agent2"])("aceita %s", (name) => {
    expect(invalidNameReason(name)).toBeUndefined();
  });

  it.each([
    ["../fora", "fora"],
    ["Code Reviewer", "code-reviewer"],
    ["Meu_App", "meu-app"],
    ["2agent", "agent"],
  ])("recusa %s sugerindo %s", (name, suggestion) => {
    expect(invalidNameReason(name)).toContain(`(ex.: ${suggestion})`);
  });

  it.each(["a/b", "-app", "app-", "a--b", ".."])("recusa %s", (name) => {
    expect(invalidNameReason(name)).toMatch(/^nome inválido/);
  });
});

describe("isHarnessProject", () => {
  const dirs: string[] = [];
  const dir = (pkg?: string) => {
    const d = mkdtempSync(join(tmpdir(), "harness-cli-"));
    dirs.push(d);
    if (pkg !== undefined) writeFileSync(join(d, "package.json"), pkg);
    return d;
  };
  afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true })));

  it("reconhece o projeto pela dependência de @harness-js/core", () => {
    expect(
      isHarnessProject(dir('{"dependencies":{"@harness-js/core":"0.14.0"}}')),
    ).toBe(true);
    expect(isHarnessProject(dir('{"devDependencies":{"@harness-js/core":"*"}}'))).toBe(
      true,
    );
  });

  it("recusa pasta sem package.json, sem a dependência ou com JSON quebrado", () => {
    expect(isHarnessProject(dir())).toBe(false);
    expect(isHarnessProject(dir('{"dependencies":{"react":"19"}}'))).toBe(false);
    expect(isHarnessProject(dir("{ não é json"))).toBe(false);
  });
});
