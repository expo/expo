# Deferred from v1

Code for the commands the v1 scope narrowing took out of the surface (2026-08-26, `llp/0016-v1-scope.rfc.md`).

Every file here is kept **as reference** and is **imported by nothing**: no registry entry loads it,
no help line names it, and no follow-up suggests it. It is here so the design work that produced it
survives the narrowing — a command that comes back is restored from this directory rather than
rewritten from its LLP. The design of every area here is in one document, `llp/0017-deferred-commands.reference.md`, one section each.

Each area is one directory, named after the command it used to be:

| Directory          | Was                                     | Why it left v1                    | Design                             |
| ------------------ | --------------------------------------- | --------------------------------- | ---------------------------------- |
| `dev-wait/`        | `@expo/agent-cli dev:wait`                       | `smoke` is the gate agents reach for | `llp/0017` §`dev:wait` |
| `checkpoint/`      | `@expo/agent-cli checkpoint[:list\|:undo]`       | agents manage git themselves      | `llp/0017` §The checkpoint system |
| `build-wait/`      | `@expo/agent-cli build:wait`                     | returns as `@expo/agent-cli build --wait` | `llp/0017` §`build:wait` |
| `runtime-network/` | `@expo/agent-cli runtime:network`                | RN's Network domain is unstable   | `llp/0017` §`runtime:network` |
| `doctor-fix/`      | `@expo/agent-cli doctor:fix`                     | the check half is the v1 answer   | `llp/0017` §`doctor:fix` |

## How it stays out of the way

Three exclusions, one per tool, all naming this directory:

- **jest** — `testPathIgnorePatterns` in `jest.config.js`. The suites moved here with their code and
  are not run: they assert against a surface this CLI no longer has.
- **tsc** — `exclude` in `tsconfig.json`. Reference code is not held to compiling against a tree
  that has moved on around it.
- **the suggested-command lint** — `SKIPPED_DIRECTORIES` in `src/lint/sweep.ts`. Every file here
  names a command the registry no longer resolves, which is exactly what the lint exists to catch;
  the point of the exclusion is that the lint keeps catching it *everywhere else*.

Restoring an area is the reverse: move the code back under `src/`, put its registry entry back, move its section out of `llp/0017`, and run the lint — which will then hold the restored suggestions
to the same rules as the rest.
