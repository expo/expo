# expo-sqlite agent evals

Colocated evals for the agent skills this package ships under [`skills/`](../). Each eval asks: _given an app and one concrete job, does a coding agent use expo-sqlite correctly?_ Running them with and without the skill loaded measures what the skill actually buys.

They also guard the reverse direction: an API change in this package that breaks agent-authored code shows up here before it ships.

This directory holds **eval data only** — prompts, seed workspaces, and scorers. The harness that executes them (workspace setup, agent subprocess, scoring context) lives outside this package; [`types.ts`](types.ts) defines the contract between the two. Because `.evals` has no `SKILL.md`, `npx expo skills` skips it, and it is excluded from the npm tarball (see `.npmignore`) — only the skills themselves ship.

## Layout

Cases are grouped per skill, so each eval unambiguously guards one skill:

```
skills/
  expo-sqlite/            # the skill under test (linked by `npx expo skills`)
    SKILL.md
    references/
  .evals/
    README.md
    types.ts              # scorer contract (CheckResult, EvalContext, Scorer)
    expo-sqlite/          # cases for the expo-sqlite skill
      001-persist-notes/
        PROMPT.md         # flat frontmatter + the task, written the way a real user asks
        EVAL.ts           # default-exported scorer: (ctx) => { passed, checks }
        local/            # complete seed workspace the agent starts from
      002-fix-search-injection/
      003-drop-async-storage/
      004-bulk-import-transaction/
```

`PROMPT.md` bodies are casual user asks, not specs — details an agent should discover live in the seeded `local/` files instead. Every case's `local/` is a complete, hermetic app; no shared fixture. Scorers check the end state the agent produced, never the process it took, and never what the case seeded.

## Harness expectations

A harness runs one case × condition by:

1. Copying the case's `local/` into a temp workspace and resolving the `expo-sqlite` dependency to the package under test.
2. For the `with-skill` condition, linking the skill the same way `npx expo skills` does (`.claude/skills/npm-expo-sqlite-expo-sqlite`); for `without-skill`, linking nothing.
3. Running the coding agent with the `PROMPT.md` body inside the workspace.
4. Importing the case's `EVAL.ts` and calling its default export with an `EvalContext` (see `types.ts`).

A failed agent run must be reported as an error, not scored — scoring an untouched workspace would report FAILs the agent never earned. Agent runs are nondeterministic: treat a single run as a smoke signal and compare `with-skill` vs `without-skill` over several runs before drawing conclusions.

## Scoring model

Checks are deterministic (regexes over source, package.json facts, `tsc --noEmit`). Four statuses, following Expo's skill-eval harness:

| Status              | Counts toward pass?                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| `passed` / `failed` | yes                                                                                                    |
| `not_applicable`    | no — the check's precondition doesn't hold (a clean pass would be absence of usage, not correct usage) |
| `unavailable`       | no — evidence couldn't be collected; infra gaps must never read as compliance                          |

## Adding an eval

1. Create `expo-sqlite/NNN-short-name/PROMPT.md`: flat `key: value` frontmatter (`title`, `skill`), then the task as a real user would type it.
2. Create `EVAL.ts` exporting a scorer. Build the check list declaratively in one place; prefer accepting every valid API the skill allows (string-source params, `db.sql` tagged templates, and prepared statements are all legitimate bindings). Scope checks so seeded code cannot pass them on the agent's behalf.
3. Add a complete `local/` seed app; put discoverable context there rather than in the prompt.
4. Sanity-run it once before submitting; a failure should be a legitimate agent mistake, not a harness limitation.
