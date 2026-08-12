# expo-sqlite agent evals

Colocated evals for the [expo-sqlite skill](../SKILL.md) this directory sits inside. Each eval asks: _given an app and one concrete job, does a coding agent use expo-sqlite correctly?_ Running them with and without the skill loaded measures what the skill actually buys.

They also guard the reverse direction: an API change in this package that breaks agent-authored code shows up here before it ships.

Evals live inside the skill they guard, so a rename or split takes them along. Because `.evals` is a hidden directory with no `SKILL.md`, `npx expo skills` never links it for consumers (the npm tarball excludes it via `.npmignore`), and agents don't load it unprompted.

## Format: `case.eval.ts` — vitest is the runner

Each case is one directory holding a single eval file (prompt and checks together, [evalite](https://www.evalite.dev/)-style: `.eval.ts` is the new `.test.ts`) plus a complete seed workspace:

```
.evals/
  README.md
  eval-kit.ts             # agentEval() vitest adapter (moves to a shared package later)
  vitest.config.ts
  001-persist-notes/
    case.eval.ts          # prompt + checks in one file
    local/                # hermetic seed app the agent starts from
  002-fix-search-injection/
  003-drop-async-storage/
  004-bulk-import-transaction/
```

A case file reads like a test suite:

```ts
import { agentEval, expect } from '../eval-kit';

agentEval(
  '003 replace async-storage with what expo-sqlite already provides',
  {
    prompt: `We're trimming dependencies. …`,
    localDir: new URL('./local/', import.meta.url),
  },
  (check) => {
    check('uses expo-sqlite/kv-store', (ws) => {
      expect(ws.read('src/settings.ts')).toMatch(/from ['"]expo-sqlite\/kv-store['"]/);
    });
  }
);
```

`agentEval()` wraps `describe()`: a `beforeAll` hook copies `local/` into a temp workspace, points the `expo-sqlite` dependency at this package, links the skill the way `npx expo skills` does (`.claude/skills/npm-expo-sqlite-expo-sqlite`), and runs `claude -p` with the prompt. Each `check()` is a `test()` receiving workspace helpers (`source()`, `read()`, `sourceFiles()`, `packageJson()`).

Reusing vitest buys the runner, assertions, `-t` filtering, reporters, and per-file parallelism for free. Two semantics are deliberately mapped onto it:

- **`skip(note)` = not applicable.** A check whose precondition doesn't hold (for example, prepared-statement finalization when no prepared statement was used) skips rather than passes — a clean pass would be absence of usage, not evidence of correct usage.
- **A failed agent run errors the suite in `beforeAll`.** An infrastructure failure must not be scored: an untouched workspace would report FAILs the agent never earned.

## Running

Requires the `claude` CLI on PATH. From this directory:

```bash
npx -y vitest run                                          # all cases, with-skill
EXPO_SKILL_EVAL_CONDITION=without-skill npx -y vitest run  # baseline (expected to fail more checks)
EXPO_SKILL_EVAL_DRY=1 npx -y vitest run                    # score untouched seeds, no agent (checks should fail)
npx -y vitest run -t "kv-store"                            # filter checks
```

`EXPO_SKILL_EVAL_KEEP=1` keeps workspaces for inspection; `EXPO_SKILL_EVAL_TIMEOUT` overrides the 900 s agent timeout. The without-skill condition is a baseline for comparison, not a gate — the interesting number is the delta against with-skill over several runs, since agent runs are nondeterministic.

## Adding an eval

1. Create `NNN-short-name/case.eval.ts`: an `agentEval()` block whose prompt is written the way a real user asks. Put discoverable context in the seed app, not the prompt.
2. Add a complete, hermetic `local/` app (no shared fixture).
3. Scope checks so seeded code cannot pass them on the agent's behalf, and accept every valid API the skill allows (string-source params, `db.sql` tagged templates, and prepared statements are all legitimate bindings).
4. Verify the seed can't pass by itself: `EXPO_SKILL_EVAL_DRY=1 npx -y vitest run -t <case>` should fail its checks.
