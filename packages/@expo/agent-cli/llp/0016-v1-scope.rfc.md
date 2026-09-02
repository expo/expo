# 0016: The v1 surface

**Type:** RFC
**Status:** Active
**Systems:** `src/commandRegistry.ts`; `src/deferred/`; `src/lint/`; `--help`; `README.md`; `src/agents/content.ts`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-26
**Revised:** 2026-08-30
**Related:** [[0017-deferred-commands]], [[0006-agent-native-cli-surface]], [[0010-agent-conventions]], [[0024-cli-ui]]

## Summary

The first release is the commands a first user should try. Everything else lives in [[0017-deferred-commands]].

## Commands

| Command                                          | Why it is here                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------------- |
| `new`                                            | headless creation                                                           |
| `install` / `add`                                | `expo install` plus skill sync and impact                                   |
| `status` (`--explain` / `--assert` / `--build`)  | the cheap read-only brief                                                   |
| `typecheck`                                      | the gate no other command is                                                |
| `doctor` / `doctor:check`                        | expo-doctor, normalized                                                     |
| `dev` / `dev:stop` / `dev:logs`                  | the plan engine, plus `--detach`, `--port`, `--wait-ready`                  |
| `start`                                          | `expo start` and nothing else                                               |
| `navigate`                                       | open a route. On a development build with nothing loaded, also load the app |
| `runtime:eval` / `:errors` / `:reload` / `:stop` | the runtime loop, including `--cloud`                                       |
| `runtime:tree` / `:tap` / `:type`                | drive the app by testID                                                     |
| `smoke`                                          | the whole gate in one command                                               |
| `deploy`                                         | web and native                                                              |
| `login` / `logout` / `whoami` / `register`       | forwarded, with the EAS fallback of [[0006-agent-native-cli-surface]]       |
| `skills:*`, `agents:setup`                       | agent setup                                                                 |
| `inspect:build-log`                              | triage a native build log                                                   |
| `inspect:config-plugins`                         | what the config plugins produced. The only `[experimental]` command         |
| `help`                                           | the workflow on-ramp                                                        |
| forwarded `expo` set                             | the fixed list in [[0006-agent-native-cli-surface]]                         |

Names that used to exist and now wait: `dev:wait`, `checkpoint`, `build:wait`, `runtime:network`, `doctor:fix`. See [[0017-deferred-commands]].

`@expo/agent-cli build` is a name this CLI does not have. Starting a build is the EAS CLI's job. `Try: npx eas build`. Source for the inspect commands stays `src/builds/` and `src/config/`.

## Experimental is per command

A command may carry `unstable: true`. `--help` prints `[experimental]` on that command's line, and one footnote per section that has any. `true` or absent, never `false`. Never on a group.

A command graduates when its flags, `--json` keys, and exit codes have held; it has live evidence on every platform and runtime it claims; and every failure mode it has is honest.

`isUnstableCommand` is swept over every runnable name. The result is `['inspect:config-plugins']`.

`inspect:config-plugins` keeps the mark until a second live pass covers plugin shapes the first run did not have, both platforms' mods are asserted live, and `--file` has run against a native file the first pass did not produce.

## Doctor's exit code

`expo-doctor` exits 1 when a check fails. This command does not. [[0010-agent-conventions]] gives `1` one meaning: the tool did not work.

**0** when every check passed. **20** when any failed. **1** only when the run produced no verdict. expo-doctor's own code stays on the `--json` `exitCode` field.

A forwarded exit code is handed back verbatim only where this CLI adds no verdict of its own.

## Deferred is a place

Deferred code lives in `src/deferred/<area>/`. Nothing imports it. No registry entry loads it. No help line names it. No follow-up suggests it.

jest `testPathIgnorePatterns`, tsc `exclude`, and the suggested-command lint `SKIPPED_DIRECTORIES` hold that property. JSONL event declarations stay in `src/events.ts`. Library internals that live callers still use stay where they are (`waitReady`, `bundleCheck`, `src/utils/git.ts`).

A suggestion is a command the reader runs ([[0009-smart-followups]]). Follow-ups name commands that exist.

## Costs of this surface

- A wait that only needs the bundler is a whole `smoke` run. A CI job with no device has no cheaper gate than `typecheck`.
- `web` has no bundle gate. `smoke --platform web` is refused.
- The reference shelf is unverified. Nothing type-checks it and nothing runs its tests.

## Testing

The suggested-command lint fails on any string that names a command the registry no longer has. Graduation is pinned by `isUnstableCommand`. The `inspect` listing tags one action and not the other. The `runtime` listing prints neither tag.
