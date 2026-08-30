// @ref llp/0010-agent-conventions.rfc.md §Suggestions are pasted, so they have to be runnable
// Which runner the caller reached this CLI through, so a suggested command can be pasted as-is.
//
// Every suggestion this CLI prints is written `npx @expo/agent-cli …`, and in a Bun project that is a line
// a person or an agent has to translate before running it — the project's own instructions say to
// use `bunx` [observed — the `AGENTS.md` of the dogfood project, 2026-08-24]. `npx` still *works*
// there, which is why this is a courtesy rather than a fix, and why it is a **render-time
// substitution** rather than a second set of literals: one function decides, the printed line is
// rewritten as it goes out, and no builder has to know which runner is in use.
//
// **The machine channels keep `npx`.** The `--json` payloads and the `cli:followups` event carry
// the command a driving agent runs, and that contract does not change with the shell a human
// happens to be in — `npx @expo/agent-cli` runs in a Bun project exactly as it does anywhere else. The
// substitution is for the terminal, which is the one place the mismatch is read as an instruction.

import { PROGRAM_NAME, PROGRAM_PREFIX } from '../programName';

/** How the caller reached this CLI, in the spelling their project uses. */
export type Invoker = 'npx' | 'bunx';

/**
 * Which runner started this process.
 *
 * Three signals, in the order they are decisive [observed — live against bun 1.3.14 and npm 11.17,
 * 2026-08-25]:
 *
 * - `process.versions.bun` — the CLI is *running on* Bun, which happens for `bun run <script>` and
 *   for `bunx --bun`. Conclusive when set, and often unset even under Bun: `bunx` honours a
 *   `#!/usr/bin/env node` shebang, so this package's own bin runs on Node under `bunx`.
 * - `npm_config_user_agent` — `bun/1.3.14 npm/? node/v24.3.0 darwin arm64` under `bunx` and under
 *   `bun run`, `npm/11.17.0 node/…` under `npx`. This is the one that actually fires.
 * - `npm_execpath` — the Bun binary under both, which covers a Bun that ever stops setting the
 *   user agent.
 *
 * `BUN_INSTALL` is deliberately **not** a signal: it says Bun is installed on the machine, not that
 * it started this process, and a Mac with Bun in `~/.bun` running `npx @expo/agent-cli` would be told to
 * paste `bunx`.
 */
export function detectInvoker(env: NodeJS.ProcessEnv = process.env): Invoker {
  if (process.versions.bun) {
    return 'bunx';
  }
  if ((env.npm_config_user_agent ?? '').startsWith('bun/')) {
    return 'bunx';
  }
  const execPath = env.npm_execpath ?? '';
  if (/(^|[\\/])bun(\.exe)?$/.test(execPath)) {
    return 'bunx';
  }
  return 'npx';
}

/**
 * One answer per process.
 *
 * The environment does not change under a running command, and this is called once per printed
 * line. The promise is not the cost — the reasoning is — but a stable answer also keeps one command
 * from printing two spellings.
 */
let cached: Invoker | null = null;

/** Forget what this process detected. For tests, and for nothing else. */
export function resetInvokerCache(): void {
  cached = null;
}

/** The runner this process was started through. */
export function currentInvoker(): Invoker {
  cached ??= detectInvoker();
  return cached;
}

/**
 * What every suggestion in this CLI is written as.
 *
 * Built from {@link PROGRAM_PREFIX} rather than written out, because the name is read from
 * `package.json` at runtime (`src/programName.ts`) and a pattern that spelled it would stop
 * matching the moment the two disagreed — silently, since a substitution that matches nothing looks
 * exactly like a caller who is not on Bun. The name goes into a character class-free pattern, so it
 * is escaped: a scoped name has a `/` in it and any future one may have a `.`.
 */
const WRITTEN_AS = new RegExp(
  `\\b${PROGRAM_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
  'g'
);

/**
 * Rewrite the suggested commands in a line for the runner that is actually in use.
 *
 * Scoped to `npx @expo/agent-cli` and nothing else, on purpose. `npx eas-cli` is a **different package
 * name** under Bun — projects run it as `bunx eas-cli` — and `npx expo` may or may not be, so a
 * blanket `npx` → `bunx` swap would produce lines that do not run. This CLI's own name is the one
 * case where the two spellings name the same thing.
 */
export function renderForInvoker(text: string, invoker: Invoker = currentInvoker()): string {
  return invoker === 'npx' ? text : text.replace(WRITTEN_AS, `bunx ${PROGRAM_NAME}`);
}
