# @expo/skill-eval-kit

Vitest harness for agent skill evals colocated with Expo packages. A package that ships an agent skill (`skills/<name>/SKILL.md`, the convention `npx expo skills` discovers) keeps a hidden `.evals/` directory inside that skill; this kit runs those evals.

Each eval asks: _given an app and one concrete job, does a coding agent use the package correctly?_ Running with and without the skill linked measures what the skill buys. The evals also guard the reverse direction: a package API change that breaks agent-authored code surfaces in the package's own PR.

See [`packages/expo-sqlite/skills/expo-sqlite/.evals/`](../../expo-sqlite/skills/expo-sqlite/.evals/README.md) for the reference consumer, including the case format (`agentEval(import.meta.url, { title, prompt, projectSetup }, (check) => …)`), the fixtures layout, and the check-tier guidance (lexical → structural → syntax tree).

## Contract

- Case files import `agentEval`/`expect` from this package.
- The package's `setup.ts` imports **nothing** from this package: its `setupProject()` returns a plain descriptor structurally matching `ProjectSetup` (package name and root, skill dir, fixtures dir, per-case fixture/dependency/file state, and an optional `prepareAsync` hook for install steps).
- `vitest` is a peer dependency — the consumer runs it; `@babel/parser` is a real dependency, so the syntax-tree tier (`loadAstSupport`) works wherever the kit is installed, with a fallback to the workspace's own transitive copy.

## Semantics

- `skip(note)` inside a check = not applicable — a precondition that doesn't hold must not read as a pass.
- A failed agent run (or preparation command) throws in `beforeAll`, erroring the suite — infrastructure failures are never scored as check results.
- Case ids derive from eval filenames; they cannot drift.

## Environment

| Variable                    | Effect                                                            |
| --------------------------- | ----------------------------------------------------------------- |
| `EXPO_SKILL_EVAL_CONDITION` | `with-skill` (default) or `without-skill` (baseline measurement)  |
| `EXPO_SKILL_EVAL_DRY`       | `1` scores untouched seeds without running the agent              |
| `EXPO_SKILL_EVAL_MODEL`     | model passed to the agent CLI                                     |
| `EXPO_SKILL_EVAL_INSTALL`   | consumed by setup `prepareAsync` hooks for per-workspace installs |
| `EXPO_SKILL_EVAL_TIMEOUT`   | agent timeout in seconds (default 900)                            |
| `EXPO_SKILL_EVAL_KEEP`      | `1` keeps workspaces for inspection                               |

Requires the `claude` CLI and `bun` on PATH (the base scaffold runs `bunx create-expo-app`, cached per template).
