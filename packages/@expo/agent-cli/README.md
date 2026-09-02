# @expo/agent-cli

Agent-native CLI on top of the Expo CLI family. Coding agents (and humans) use it to run Expo workflows and get machine-readable answers. It runs `expo`, `eas-cli`, `expo-doctor`, and friends as subprocesses. It does not import their internals.

Design documents: `llp/0001-agentic-cli-on-expo-cli.rfc.md` and its child LLPs in this package.

## Start here

| Step                         | Command                                   | Gets you                                       |
| ---------------------------- | ----------------------------------------- | ---------------------------------------------- |
| 1. Check the project         | `npx @expo/agent-cli status`              | what this project is, and what to run next     |
| 2. Start the app             | `npx @expo/agent-cli dev --detach`        | the dev server starts, the terminal comes back |
|                              | `npx @expo/agent-cli navigate /`          | the app opens a route, on a device             |
| 3. Edit and reload           | `npx @expo/agent-cli runtime:reload`      | after your edit, the app runs the code on disk |
|                              | `npx @expo/agent-cli runtime:errors`      | what it threw, over a time window              |
|                              | `npx @expo/agent-cli runtime:tree`        | what is on screen, and its testIDs             |
| 4. Verify before you're done | `npx @expo/agent-cli smoke`               | bundle, boot, and error window, one exit code  |
|                              | `npx @expo/agent-cli typecheck`           | the type errors neither of those can see       |
| 5. Release                   | `npx @expo/agent-cli deploy`              | the web app to EAS Hosting                     |
| One-time setup               | `npx @expo/agent-cli new my-app`          | create a project                               |
|                              | `npx @expo/agent-cli install expo-sqlite` | add a package at the version this SDK wants    |
|                              | `npx @expo/agent-cli agents:setup`        | write AGENTS.md, link the agent skills         |

`npx @expo/agent-cli help workflow` is this loop in one screen, plus exit codes, `--json`, and what to do when a command fails.

`npx @expo/agent-cli -h` lists every command. Each command's `--help` has the same shape: purpose, options, examples, what to run next, and the `--json` keys.

## Commands

| Command                                                        | What it does                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------- |
| `new`                                                          | Create a project without prompts                                    |
| `install` / `add`                                              | Run `expo install`, then sync that package's skills                 |
| `status`                                                       | What this project is, whether a rebuild is needed, what to run next |
| `dev`                                                          | Plan how to get the app on a device, then do it                     |
| `start`                                                        | `expo start` and nothing else, then sync skills                     |
| `dev:logs` / `dev:stop`                                        | Read or stop a detached dev server                                  |
| `navigate`                                                     | Open a route on a simulator, a device, or EAS Simulator (`--cloud`) |
| `runtime:reload`                                               | Put the running app back on the code on disk                        |
| `runtime:errors` / `runtime:eval`                              | Read runtime errors, or evaluate JS in the running app              |
| `runtime:tree` / `runtime:tap` / `runtime:type`                | Drive the app by `testID`                                           |
| `runtime:stop`                                                 | Stop the app on the device                                          |
| `smoke`                                                        | Bundle, boot, open a route, check for errors. One exit code         |
| `typecheck`                                                    | The project's own `tsc --noEmit`                                    |
| `doctor`                                                       | `expo-doctor`, normalized                                           |
| `deploy`                                                       | Ship the web app to EAS Hosting, or the native app with `--native`  |
| `inspect:build-log`                                            | Find the line in a native build log that says why it failed         |
| `inspect:config-plugins`                                       | What the config plugins produced. Experimental                      |
| `agents:setup`                                                 | Write `AGENTS.md` and link agent skills                             |
| `skills:sync` / `skills:list` / `skills:show` / `skills:clean` | Discover and link skills shipped by installed modules               |

Grouped commands use `group:action`, the way `eas-cli` does. The space form is the same command: `skills list` is `skills:list`. Bare `skills` syncs, bare `doctor` checks, bare `dev` runs the plan.

Commands this CLI does not wrap go to the project's `expo` CLI: `run`, `run:ios`, `run:android`, `prebuild`, `config`, `export`, `export:web`, `export:embed`, `serve`, `customize`, `lint`, `login`, `logout`, `register`, `whoami`.

## Config

Flags beat `package.json`. `package.json` beats detection. Unknown keys are errors.

```json
{
  "expo": {
    "agentCli": {
      "target": "dev-build",
      "buildBackend": "eas",
      "android": { "buildBackend": "local" }
    }
  }
}
```

`target` is `expo-go` or `dev-build`. `buildBackend` is `local` or `eas`. An `ios` or `android` key overrides the backend for that platform.

## Notes

- Expo Go on Android has no debugger. Use a development build to drive the app there.
- `runtime:tree`, `runtime:tap`, and `runtime:type` call the app's props. They do not touch the screen. They need a development bundle.
- `smoke` does not run on web. A browser is not in the debugger target list.
- A cloud simulator needs a tunnelled dev server. Localhost is refused.

The rest of the limits live in each command's `--help`.

## Status

Experimental. Commands and output formats may change.
