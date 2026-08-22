# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Initial `exagent` package: `skills` command (sync/list/show/clean) ported from the `@expo/cli` proof-of-concept. ([#49229](https://github.com/expo/expo/pull/49229) by [@expo-tuft[bot]](https://github.com/apps/expo-tuft))
- Add `exagent start --plan` and `exagent start --smart`: decide between `expo start`, `expo prebuild`, and `expo run:*` from the project state, emit the plan with time-class estimates, then optionally run it. ([#49229](https://github.com/expo/expo/pull/49229) by [@expo-tuft[bot]](https://github.com/apps/expo-tuft))
- Add the project-state probe with the Expo Go compatibility check, the `exagent context` command (`--json` for the machine-readable project brief), and the post-install impact report of `exagent install` (`--no-impact` to skip it). ([#49229](https://github.com/expo/expo/pull/49229) by [@expo-tuft[bot]](https://github.com/apps/expo-tuft))
- Add `exagent runtime eval` and `exagent runtime errors`: evaluate JavaScript in the running app and collect its runtime errors over the dev server's debugger connection, with app output fenced in untrusted-content markers and `--json` for the machine-readable shape. ([#49229](https://github.com/expo/expo/pull/49229) by [@expo-tuft[bot]](https://github.com/apps/expo-tuft))
- Add `exagent status`: a read-only, `git status`-like overview of the project, the Expo Go verdict, the freshness of the last recorded development build per platform, the dev server and the apps connected to it, the linked agent skills, and the command that would get the app onto a device (`--json` for the machine-readable report, `--dev-server-url` to probe another dev server). ([#49229](https://github.com/expo/expo/pull/49229) by [@expo-tuft[bot]](https://github.com/apps/expo-tuft))
- Add `exagent navigate <route>`: open a route as a deep link on the booted simulator or attached device, resolving the URL shape from the app connected to the dev server (`exp://` for Expo Go) and the `scheme` field of the app config (`--scheme` to override). ([#49229](https://github.com/expo/expo/pull/49229) by [@expo-tuft[bot]](https://github.com/apps/expo-tuft))

- Add `exagent setup`: link the agent skills of the installed packages, then create or update one managed block in the project's `AGENTS.md` with the project facts from the probe and the command cheat sheet (`--agent` to pick the agents, `--no-agents-md` and `--no-agent-skills` to skip either half, `--json` for the machine-readable report). Content outside the block markers is preserved byte for byte, and `CLAUDE.md` is never written. ([#49229](https://github.com/expo/expo/pull/49229) by [@expo-tuft[bot]](https://github.com/apps/expo-tuft))

- Add `--json` to `exagent navigate`: print the opened URL, how it was resolved, the target app, the device, the device command and its exit code as one JSON object on stdout. ([#49229](https://github.com/expo/expo/pull/49229) by [@expo-tuft[bot]](https://github.com/apps/expo-tuft))

- Add smart follow-ups: `start`, `install`, `status`, `context`, `navigate`, `runtime errors` and `skills sync` end with up to three state-derived next actions — a `Next:` section for a terminal, a `followups` key in every `--json` payload, and one `cli:followups` JSONL event. Suppressible with `--no-followups` or `EXAGENT_NO_FOLLOWUPS`, and never able to change an exit code. ([#49229](https://github.com/expo/expo/pull/49229) by [@expo-tuft[bot]](https://github.com/apps/expo-tuft))

### 🐛 Bug fixes

- Fix the `jsonl-event` eval grader, which read the event name from `event`/`name`/`type` and so never matched a line written by `2g`, whose field is `_e`. ([#49229](https://github.com/expo/expo/pull/49229) by [@expo-tuft[bot]](https://github.com/apps/expo-tuft))

### 💡 Others

- Cover the top-level keys of every `--json` output with shape tests, so a renamed or dropped field fails a test instead of a caller. ([#49229](https://github.com/expo/expo/pull/49229) by [@expo-tuft[bot]](https://github.com/apps/expo-tuft))
- Add `followups` to the top-level key set of `start --plan --json`, `context --json`, `status --json`, `navigate --json` and `runtime errors --json`, and update the shape tests that pin those sets. ([#49229](https://github.com/expo/expo/pull/49229) by [@expo-tuft[bot]](https://github.com/apps/expo-tuft))
