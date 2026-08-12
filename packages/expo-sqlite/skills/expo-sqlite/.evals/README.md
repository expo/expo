# expo-sqlite agent evals

Colocated evals for the [expo-sqlite skill](../SKILL.md) this directory sits inside. Each eval asks: _given an app and one concrete job, does a coding agent use expo-sqlite correctly?_ Running them with and without the skill loaded measures what the skill actually buys.

They also guard the reverse direction: an API change in this package that breaks agent-authored code shows up here before it ships.

Evals live inside the skill they guard, so a rename or split takes them along. Because `.evals` is a hidden directory with no `SKILL.md`, `npx expo skills` never links it for consumers (the npm tarball excludes it via `.npmignore`), and agents don't load it unprompted.

## Format: one flat `*.eval.ts` per case — vitest is the runner

A case is a single file holding the prompt, a named fixture reference, and the checks ([evalite](https://www.evalite.dev/)-style: `.eval.ts` is the new `.test.ts`). The case id is the filename — nothing to keep in sync:

```
.evals/
  README.md
  eval-kit.ts                        # package-agnostic vitest adapter (moves to a shared package, unchanged)
  setup.ts                           # the one file that knows this is expo-sqlite; cases import from here
  vitest.config.ts
  package.json                       # anchors vitest's project root here; declares the opt-in AST parser
  fixtures/                          # named seed workspaces — real files, shareable between cases
    notes-in-memory/                 # per-scenario fixtures layered over the create-expo-app scaffold
    notes-search/
    …
  001-persist-notes.eval.ts
  002-fix-search-injection.eval.ts
  003-drop-async-storage.eval.ts
  004-bulk-import-transaction.eval.ts
  005-migrations-folder.eval.ts      # demonstrates directory-structure checks (ws.glob)
  006-single-connection.eval.ts      # demonstrates the lexical → AST check cascade
```

```ts
import { agentEval, expect } from './setup';

agentEval(
  import.meta.url, // the case id derives from this filename
  {
    title: 'replace async-storage with what expo-sqlite already provides',
    prompt: `We're trimming dependencies. …`,
    seed: {
      fixture: 'notes-settings', // fixtures/notes-settings/ layered over fixtures/blank/
      dependencies: { '@react-native-async-storage/async-storage': '^2.1.0' },
    },
  },
  (check) => {
    check('uses expo-sqlite/kv-store', (ws) => {
      expect(ws.read('src/settings.ts')).toMatch(/from ['"]expo-sqlite\/kv-store['"]/);
    });
  }
);
```

`agentEval()` wraps `describe()`: a `beforeAll` hook builds a temp workspace by layering the base scaffold, then the case's named `seed.fixture`(s), then any one-off `seed.files`; `seed.dependencies` merge into package.json and the `expo-sqlite` dependency is pointed at this package. It links the skill the way `npx expo skills` does (`.claude/skills/npm-expo-sqlite-expo-sqlite`) and runs `claude -p` with the prompt. Each `check()` is a `test()` receiving workspace helpers.

The base scaffold is a real `bunx create-expo-app --template blank-typescript` app — nothing hand-maintained (no checked-in tsconfig/app.json). It is created once per template on first run (network + bun required) and cached under the OS temp directory; a cross-process lock serializes the scaffold because concurrent `bunx create-expo-app` invocations collide in bun's link step.

`eval-kit.ts` is package-agnostic by design: `setup.ts` is the only file that knows this is expo-sqlite (`createAgentEval({ packageName, packageRoot, skillDir, fixturesDir })`), and case files import from `setup.ts`. When the kit extracts to a shared package, only setup.ts's import changes — case files stay untouched.

Fixtures are real files: they get syntax highlighting and lint, can hold binary assets (a bundled `.db` for `assetSource`), and can be shared between cases. Keep dependency changes in the eval file's `seed.dependencies` — not in a fixture package.json — so they stay visible where the checks are.

## Check tiers

The helpers cover the same check axes as Expo's eval-experiments harness, cheapest first:

| Tier        | Helper                                                         | Notes                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lexical     | `ws.source()` (comment-stripped concat), `ws.read(path)` (raw) | `source()` strips comments so commented-out code can neither satisfy a positive pattern nor trip a negative one.                                                                                                                                                                                                                                                                                                      |
| Structural  | `ws.glob(pattern)`, `ws.exists(path)`, `ws.packageJson()`      | Globs support `*`, `**`, and `{a,b}` (Node ≥ 22 `fs.globSync`). See `005-migrations-folder`.                                                                                                                                                                                                                                                                                                                          |
| Syntax tree | `loadAstSupport()` → `parse()` + `walk()`                      | Opt-in: run `npm install` in this directory first (`@babel/parser` is a devDependency here). When the parser isn't installed the check must `skip()` — evidence unavailable never reads as compliance. Reach for this only where a well-anchored regex genuinely can't verify the rule, and pair it with a lexical approximation so the case still measures its goal without the parser. See `006-single-connection`. |

Reusing vitest buys the runner, assertions, `-t` filtering, reporters, and per-file parallelism for free. Two semantics are deliberately mapped onto it:

- **`skip(note)` = not applicable.** A check whose precondition doesn't hold (for example, prepared-statement finalization when no prepared statement was used) skips rather than passes — a clean pass would be absence of usage, not evidence of correct usage.
- **A failed agent run errors the suite in `beforeAll`.** An infrastructure failure must not be scored: an untouched workspace would report FAILs the agent never earned.

## Running

Requires the `claude` CLI and `bun` on PATH (the base scaffold runs `bunx create-expo-app` on first use). From this directory:

```bash
npx -y vitest run                                          # all cases, with-skill
EXPO_SKILL_EVAL_CONDITION=without-skill npx -y vitest run  # baseline (expected to fail more checks)
EXPO_SKILL_EVAL_DRY=1 npx -y vitest run                    # score untouched seeds, no agent (checks should fail)
npx -y vitest run 003                                      # one case (file filter)
```

`EXPO_SKILL_EVAL_KEEP=1` keeps workspaces for inspection; `EXPO_SKILL_EVAL_TIMEOUT` overrides the 900 s agent timeout. The without-skill condition is a baseline for comparison, not a gate — the interesting number is the delta against with-skill over several runs, since agent runs are nondeterministic.

## Adding an eval

1. Create `NNN-short-name.eval.ts`: an `agentEval(import.meta.url, …)` block whose prompt is written the way a real user asks. Put discoverable context in the seed, not the prompt.
2. Declare the starting state through `seed.fixture` — reuse a directory under `fixtures/` or add a new one holding only the scenario's app files.
3. Scope checks so seeded code cannot pass them on the agent's behalf, and accept every valid API the skill allows (string-source params, `db.sql` tagged templates, and prepared statements are all legitimate bindings).
4. Verify the seed can't pass by itself: `EXPO_SKILL_EVAL_DRY=1 npx -y vitest run NNN` should fail its checks.
