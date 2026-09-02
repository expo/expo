// @ref llp/0021-honest-reports.rfc.md §The rules
// The type declarations an Expo app has before anything has generated them.
//
// A brand-new `@expo/agent-cli new` project fails `@expo/agent-cli typecheck` [observed — friction run 7, F64]:
// `tsconfig.json` includes `expo-env.d.ts`, that file does not exist yet, and the two diagnostics
// that follow are about CSS-module imports whose types live in the `expo/types` reference the file
// carries. Nothing about either error is a mistake in either file, and the follow-up — "fix the
// diagnostics above" — is advice for a problem the caller cannot fix by editing them.
//
// **Nothing here generates it.** The Expo CLI writes `expo-env.d.ts` from its dev server
// [observed — `@expo/cli` `start/server/type-generation/expo-env.ts`, written by
// `startTypescriptTypeGenerationAsync` when Metro instantiates], and there is no `expo` subcommand
// that writes it on its own [observed — the command table of `@expo/cli/src/index.ts`, SDK 57: no
// typegen verb]. Writing the file here instead would be this CLI keeping a copy of another
// package's template, which is exactly what llp/0001 §Constraints keeps out. So this *recognises*
// the case and the report says what it is and which command creates it. The upstream ask — a
// standalone typegen command — belongs in llp/0010 §Upstream asks.

import fs from 'fs';
import path from 'path';

import { PROGRAM_PREFIX } from '../programName';

/** The file the Expo CLI generates, and the one every Expo `tsconfig.json` includes. */
export const EXPO_ENV_DTS = 'expo-env.d.ts';

/** A generated declaration file the project's config expects and does not have. */
export interface MissingGeneratedTypes {
  /** The file, relative to the project root. */
  file: string;
  /** What refers to it, so the reader can check the claim. */
  referencedBy: string;
  /** The command that creates it. */
  command: string;
}

/**
 * The generated declaration file this project is missing, or null.
 *
 * Two facts, both cheap: the config *refers* to the file, and the file is not there. The reference
 * is looked for in the text of `tsconfig.json` rather than in a parse of it, because a `tsconfig`
 * may hold comments and trailing commas — this is a "does this project expect the file" question,
 * and a substring answers it without a JSON5 parser and without ever being wrong in the direction
 * that matters: a config that does not name the file produces no note.
 */
export function findMissingGeneratedTypesSync(projectRoot: string): MissingGeneratedTypes | null {
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
  let tsconfig: string;
  try {
    tsconfig = fs.readFileSync(tsconfigPath, 'utf8');
  } catch {
    return null;
  }
  if (!tsconfig.includes(EXPO_ENV_DTS)) {
    return null;
  }
  if (fs.existsSync(path.join(projectRoot, EXPO_ENV_DTS))) {
    return null;
  }
  return {
    file: EXPO_ENV_DTS,
    referencedBy: 'tsconfig.json',
    command: `${PROGRAM_PREFIX} dev --detach --wait-ready`,
  };
}

/** The sentence a report prints about it. */
export function describeMissingGeneratedTypes({
  file,
  referencedBy,
  command,
}: MissingGeneratedTypes): string {
  return [
    `${file} does not exist yet, and ${referencedBy} includes it.`,
    `The Expo CLI generates that file when a dev server starts, and it carries the "expo/types" reference that declares CSS-module and asset imports — so some of the diagnostics above are about it rather than about the code.`,
    `Run "${command}" once to generate it, then run this check again.`,
  ].join(' ');
}
