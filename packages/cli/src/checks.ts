import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Letras minúsculas, números e hífen, começando por letra: `meu-app`,
 * `code-reviewer`.
 *
 * O nome vira caminho de pasta, nome de arquivo, `name` do `package.json` e
 * nome de classe. Sem a regra, `../fora` escrevia fora da pasta atual e ia
 * inválido para o `package.json`; `Code Reviewer` gerava arquivos com espaço; e
 * uma maiúscula que o macOS ignora quebra o import no Linux. Recusar, e não
 * converter, porque um nome convertido em silêncio não é o que a pessoa vai
 * procurar depois.
 */
const NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** Por que o nome é inválido, ou `undefined` quando ele serve. */
export function invalidNameReason(name: string): string | undefined {
  if (NAME.test(name)) return undefined;
  const suggestion = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^[^a-z]+|-+$/g, "");
  return (
    `nome inválido: "${name}". Use letras minúsculas, números e hífen, ` +
    `começando por letra` +
    (suggestion && NAME.test(suggestion) ? ` (ex.: ${suggestion}).` : ".")
  );
}

/**
 * A pasta é a raiz de um projeto HarnessJS: tem `package.json` que depende de
 * `@harness-js/core`. Só a raiz, sem subir diretórios, porque o `g agent`
 * escreve em `src/` relativo a ela.
 */
export function isHarnessProject(dir: string): boolean {
  const file = join(dir, "package.json");
  if (!existsSync(file)) return false;
  try {
    const pkg = JSON.parse(readFileSync(file, "utf-8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return Boolean(
      pkg.dependencies?.["@harness-js/core"] ??
      pkg.devDependencies?.["@harness-js/core"],
    );
  } catch {
    // `package.json` ilegível não é um projeto que dê para estender.
    return false;
  }
}

/**
 * ` Você quis dizer "x"?` para um erro de digitação; vazio quando nada é
 * parecido. A tolerância cresce com o tamanho da opção: com um teto fixo de 2,
 * qualquer entrada de duas letras ficava "parecida" com `g`.
 */
export function didYouMean(input: string, options: string[]): string {
  const near = options.find(
    (option) => distance(input, option) <= Math.min(2, Math.floor(option.length / 3)),
  );
  return near ? ` Você quis dizer "${near}"?` : "";
}

/** Distância de edição (Levenshtein): quantas letras trocar, pôr ou tirar. */
function distance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j]! + 1,
        current[j - 1]! + 1,
        previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length]!;
}
