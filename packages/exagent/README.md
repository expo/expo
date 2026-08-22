# exagent

Agent-native CLI on top of the Expo CLI family. `exagent` gives coding agents (and humans) deterministic, machine-readable entry points into Expo workflows. It invokes `expo`, `eas-cli`, `expo-doctor`, and friends as subprocesses — it does not import their internals.

Design documents: see `llp/0001-agentic-cli-on-expo-cli.rfc.md` and its child LLPs in this package.

## Commands

- `exagent new <directory>` — create a project with no TTY: run `create-expo` with every prompt answered, set the display name (`--name`), initialize a repository when there is none, and print what to run next (`--json`, `--no-install`, `--no-git`).
- `exagent deploy` — ship the project: the web app to EAS Hosting (`expo export --platform web` then `eas deploy`), the native app through launch.expo.dev (`--native`, `--upload-root <dir>` for an app inside a monorepo). Prints the deployment URL and the launch URL, `--json` for the machine-readable report. With no target flag, a project that has web support deploys its web app.
- `exagent setup` — set a project up for coding agents: link the agent skills of the installed packages, and maintain a managed block in the project's `AGENTS.md` describing the project and the commands that answer in a machine-readable shape.
- `exagent skills [sync|list|show|clean]` — discover agent skills shipped inside installed Expo modules (`skills/*/SKILL.md`) and link them into agent skill directories (`.claude/skills`, `.agents/skills`, ...).
- `exagent install <pkg>` — run `expo install`, then sync the installed package's skills.
- `exagent start` — run `expo start`, with agent-friendly output and skills sync.
- `exagent runtime [eval|errors|network]` — read and drive the running app over the dev server's debugger connection: evaluate JavaScript in it, collect the runtime errors it reports over a window, or collect the HTTP requests it makes over a window. App-originated output is fenced in untrusted-content markers.
- `exagent checkpoint` — snapshot the files git tracks in this project, so a later change can be undone (`--label`, `--json`). `install`, `setup` and a `start --smart` that prebuilds take one first; `--no-checkpoint` or `EXAGENT_NO_CHECKPOINT` skips it.
- `exagent undo` — restore a checkpoint (`--list` for the recorded ones, `--id` to pick one, `--json`).

`deploy --native` uploads your project **source** — a gzipped tarball, minus `node_modules`, `.git`, `.expo` and native build output — to launch.expo.dev as the signed-in Expo user (`npx expo login`, or `EXPO_TOKEN` on a machine that cannot sign in), and prints a launch URL. Opening that URL is a required step, not a suggestion: the store account, the signing and the submission for iOS and Android happen in the browser, and the link expires in 8 hours. There is no platform flag and no build profile — one launch covers both platforms. Nothing is uploaded until the credential and the 500 MB size limit are checked.

A checkpoint is a git object no ref points at: it commits nothing onto your branch, and `HEAD`, your branches, and your index are untouched. `exagent undo` only writes files, so a file created after the checkpoint is kept, not deleted, and anything git ignores (`node_modules`, `ios/Pods`, `.env`) is in no checkpoint — which is why a restored `package.json` ends with an install suggestion.

`runtime network` reads the debugger's Network domain, which React Native still ships behind an unstable flag. When the connected app cannot report requests, the command fails with `NETWORK_DOMAIN_UNAVAILABLE` and points at `exagent runtime errors` — it never prints an empty list, because "no requests" and "cannot report requests" need different next steps.

The `runtime` commands need a runtime that speaks the Chrome DevTools Protocol. Expo Go on iOS does. Expo Go for Android ships a JavaScript engine built without the CDP debugger, so `runtime eval` there fails with `RUNTIME_EVALUATE_UNSUPPORTED` and the two reading commands connect but report an empty window; use a development build to drive an app on Android.

## Status

Experimental. Commands and output formats may change.
