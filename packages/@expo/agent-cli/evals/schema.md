# Eval scenario and grader format

<!-- @ref llp/0002-testing-and-evals.plan.md -->

A scenario is one JSON file in `evals/scenarios/`. It pairs a fixture project with a task, and
lists the programmatic checks that decide pass or fail. `evals/run.mjs` loads every scenario,
validates it against the shape below, and runs the ones that belong to the requested tier.

## Scenario

```jsonc
{
  "id": "skills-sync", // required, unique, kebab-case; matches the file name
  "fixture": "e2e/fixtures/...", // required, path relative to packages/@expo/agent-cli
  "taskPrompt": "sync agent ...", // required, the natural-language task given to a model
  "drivingAgent": "deterministic", // required, see below
  "tiers": [0, 1], // required, non-empty, values from 0 | 1 | 2
  "command": {
    // required for tier 0, ignored by tiers 1 and 2
    "argv": ["skills:sync"], //   argv passed to bin/cli.js
    "env": { "CI": "1" }, //   optional extra environment variables
    "timeoutMs": 60000, //   optional, defaults to 120000
  },
  "graders": [
    /* see below */
  ], // required, non-empty
}
```

### `drivingAgent`

Who performs the task at the scenario's lowest tier. Higher tiers substitute their own driver,
hand it `taskPrompt`, and reuse the same graders — the outcome checks do not change with the
driver, which is the point of listing a scenario in more than one tier.

| Value            | Tier | Meaning                                                                       |
| ---------------- | ---- | ----------------------------------------------------------------------------- |
| `deterministic`  | 0    | No model. The runner spawns `command.argv` directly.                          |
| `local-model`    | 1    | A pinned small open model drives the CLI. Not implemented yet.                |
| `frontier-agent` | 2    | A real agent (e.g. Claude Code headless) drives the CLI. Not implemented yet. |

### Execution model

The runner copies the fixture into a temporary directory before every attempt, so a scenario
never mutates the checked-in fixture and repeated runs start from the same state. Grader paths
are resolved against that temporary copy, called the workspace below.

## Graders

Graders are **programmatic**. They read process results and files, never transcripts, and never
ask a model to judge. A scenario passes when every grader passes.

### `exit-code`

```jsonc
{ "type": "exit-code", "expect": 0 }
```

Compares the driving process exit code. `expect` is required.

### `path-exists`

```jsonc
{ "type": "path-exists", "path": ".claude/skills", "kind": "directory" }
```

`path` is relative to the workspace. `kind` is optional and one of `file`, `directory`, or
`symlink`; when omitted, any kind of entry passes. `symlink` is checked without following the
link, so a symlink to a missing target still counts as a symlink.

### `jsonl-event`

```jsonc
{ "type": "jsonl-event", "file": "events.jsonl", "event": "skills:synced", "atLeast": 1 }
```

Parses a JSONL file line by line and counts the entries whose event name matches `event`. The
event name is read from the `_e`, `event`, `name`, or `type` field of each line; `_e` is the field
`2g` writes, so it is the one the Expo CLI family uses. `atLeast` is optional and defaults to `1`.
This is the check that makes the event stream the API under test, per LLP 0002 layer 2 — the
scenario is responsible for pointing the CLI at `file` through `command.env`, e.g.
`"env": { "LOG_EVENTS": "events.jsonl" }`. A relative path resolves against the workspace, which
is both the CLI's working directory and the root grader paths are resolved from.

### `http-probe`

```jsonc
{
  "type": "http-probe",
  "url": "http://localhost:8081/status",
  "expectStatus": 200,
  "timeoutMs": 15000,
}
```

Sends one GET request. `expectStatus` is optional and defaults to `200`. `timeoutMs` is optional
and defaults to `10000`. Used by dev-server scenarios; it needs a scenario that leaves a server
running, which the current runner does not do yet.

## Adding a scenario

1. Add or reuse a fixture under `e2e/fixtures/`.
2. Write `evals/scenarios/<id>.json` with the shape above.
3. Run `node evals/run.mjs --dry-run` to validate the shape without executing anything.
4. Run `node evals/run.mjs --tier 0 --scenario <id>` to execute it.
