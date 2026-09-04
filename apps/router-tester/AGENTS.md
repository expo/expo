# Router tester agent instructions

## App testing

Before testing the app, load the latest [`eas-simulator` skill](https://github.com/expo/skills/tree/main/plugins/expo/skills/eas-simulator). If it is not available locally, ask the user to install it before continuing. Do not copy the skill into this repository.

Use an EAS iOS Simulator session with `--type agent-device`. This app uses:

- Bundle identifier: `dev.expo.routertester`
- Development-client scheme: `router-tester`
- Development-client build profile: `development`
- Static simulator build profile: `ios-simulator`

Check for an existing session before creating one:

```sh
bunx eas-cli simulator:list --platform ios --status in-progress --type agent-device --non-interactive --json
```

Reuse an existing session only when it is healthy and already belongs to the current router-tester task. Never stop a session created by someone else.

Before building, inspect recent builds from both simulator-capable profiles:

```sh
bunx eas-cli build:list --platform ios --profile development --status finished --limit 5 --non-interactive --json
bunx eas-cli build:list --platform ios --profile ios-simulator --status finished --limit 5 --non-interactive --json
```

For live testing, select the newest `development` build where `isForIosSimulator` is `true` and whose native dependencies and native configuration match the current app. Create a new `development` build only after those native inputs change. The `ios-simulator` profile embeds its JavaScript and is only for static testing.

Start the current JavaScript bundle with Fast Refresh enabled:

```sh
bunx expo start --tunnel
```

Do not set `CI=1`. Retry a transient tunnel startup failure. If Metro does not print the tunnel URL, restart it with:

```sh
DEBUG=expo:start:server:ngrok bunx expo start --tunnel
```

URL-encode the tunnel URL, then start the simulator and install the selected development build. Capture the command output without logging it because it contains a secret:

```sh
bunx eas-cli simulator --platform ios --type agent-device --build-id <build-id> --open-url "router-tester://expo-development-client/?url=<encoded-tunnel-url>" --out-config-type env --non-interactive
```

Do not combine `--out-config-type env` with `--json`. Export the returned `AGENT_DEVICE_DAEMON_BASE_URL` and `AGENT_DEVICE_DAEMON_AUTH_TOKEN`, never print or commit them, and pass both variables to every `agent-device` command that runs in a separate shell. Attach to the app with:

```sh
agent-device open dev.expo.routertester --foreground
```

The development-menu gear can overlap controls in the top-right corner. Obtain a fresh `agent-device snapshot -i` after navigation, mutation, or Fast Refresh before using element refs. Restarting Metro changes its tunnel URL, so reopen the development-client deep link with the newly encoded URL.

When testing is complete, run `agent-device close`, then stop only a simulator session created for the current task:

```sh
bunx eas-cli simulator:stop --id <session-id> --non-interactive --json
```
