# expo-sqlite agent evals

Colocated evals for the agent skill this package ships in [`skills/expo-sqlite/`](../skills/expo-sqlite/SKILL.md). Each eval asks: _given an app and one concrete job, does a coding agent use expo-sqlite correctly?_ Running them with and without the skill loaded measures what the skill actually buys.

They also guard the reverse direction: an API change in this package that breaks agent-authored code shows up here before it ships.

This directory is excluded from the npm tarball (see `.npmignore`); only `skills/` ships.

## Layout

Each eval is one directory, prompt and scorer together:

```
evals/
  001-persist-notes/
    PROMPT.md   # flat frontmatter + the task, written the way a real user asks
    EVAL.ts     # default-exported scorer: (ctx) => { passed, checks }
    local/      # optional files seeded over the shared fixture
  harness/
    run.ts      # runner CLI
    fixture/    # minimal Expo app every workspace starts from
```

`PROMPT.md` bodies are casual user asks, not specs — details an agent should discover live in the seeded `local/` files instead. Scorers check the end state the agent produced, never the process it took, and never what the harness seeded.

## Running

Requires the `claude` CLI on PATH. From this directory:

```bash
npx tsx harness/run.ts                          # all evals, with-skill and without-skill
npx tsx harness/run.ts --case 001-persist-notes --condition with-skill
npx tsx harness/run.ts --install                # enables the typecheck tier (runs npm install per workspace)
npx tsx harness/run.ts --keep                   # keep workspaces for inspection
```

Per eval × condition, the runner:

1. Creates a temp workspace from `harness/fixture/`, overlays the eval's `local/` files, and points the `expo-sqlite` dependency at this package.
2. For `with-skill`, copies the skill to `.claude/skills/npm-expo-sqlite-expo-sqlite/` — the same layout `npx expo skills` links.
3. Runs `claude -p` with the prompt inside the workspace (`--dangerously-skip-permissions`, 900 s timeout) and records the stream-json transcript, including whether the skill was read.
4. Imports `EVAL.ts` and scores the workspace. Results are printed and written to the workspace and a summary JSON.

## Scoring model

Checks are deterministic (regexes over source, package.json facts, `tsc --noEmit`). Four statuses, following Expo's skill-eval harness:

| Status              | Counts toward pass?                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| `passed` / `failed` | yes                                                                                                    |
| `not_applicable`    | no — the check's precondition doesn't hold (a clean pass would be absence of usage, not correct usage) |
| `unavailable`       | no — evidence couldn't be collected; infra gaps must never read as compliance                          |

Agent runs are nondeterministic: treat a single run as a smoke signal and compare `with-skill` vs `without-skill` over several runs before drawing conclusions.

## Adding an eval

1. Create `NNN-short-name/PROMPT.md`: flat `key: value` frontmatter (`title`, `skill`), then the task as a real user would type it.
2. Create `EVAL.ts` exporting a scorer. Build the check list declaratively in one place; prefer accepting every valid API the skill allows (string-source params, `db.sql` tagged templates, and prepared statements are all legitimate bindings).
3. Seed context through `local/` files rather than spelling everything out in the prompt.
4. Sanity-run it once with `--case <id>` before submitting; the failure should be a legitimate agent mistake, not a harness limitation.
