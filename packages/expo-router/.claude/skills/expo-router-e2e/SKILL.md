---
name: expo-router-e2e
description: Build, launch, and test apps from apps/router-e2e. 
user_invocable: true
---

# Running Router E2E Examples

Build and test apps in the `apps/router-e2e/__e2e__/` directory.

## App Structure

```
apps/router-e2e/
├── __e2e__/
│   ├── native-navigation/
│   ├── native-tabs/
│   ├── static-rendering/
│   ├── stack/
│   ├── split-view/
│   ├── link-preview/
│   └── [other-app-name]/
└── package.json
```

## Available Commands

All commands run from `apps/router-e2e` using **relative paths** (never absolute):

```bash
cd ../../apps/router-e2e && yarn [command]
```

**Find all available scripts:**

```bash
cat ../../apps/router-e2e/package.json | grep -E "\"(start|ios|android): | head -30"
```

**Patterns:**
- `yarn start:[app-name]` — Start Metro bundler only
- `yarn ios:[app-name]` — Build + run on iOS simulator
- `yarn android:[app-name]` — Build + run on Android emulator

**Package name:** `dev.expo.routere2e`

## Build Detection (CRITICAL)

Build commands (`yarn android:*`, `yarn ios:*`) **never terminate** because Metro keeps running after the build finishes. Never use `TaskOutput block=true` — it will hang forever.

### Step-by-step procedure

1. **Launch the build in the background:**

```
Bash(run_in_background=true):
  cd ../../apps/router-e2e && yarn android:native-navigation
```

2. **Poll with `TaskOutput block=false` every ~15-20 seconds.** Check the output for sentinel strings.

3. **Detect completion using sentinels** (appear in this order):

**Android:**

| Sentinel | Meaning |
|---|---|
| `BUILD SUCCESSFUL` | Gradle finished |
| `Installing` | APK deploying to device |
| `Opening` | App launching |
| `Bundled` | JS bundle served — **app is ready, start testing** |

**iOS:**

| Sentinel | Meaning |
|---|---|
| `Build Succeeded` | Xcode build finished |
| `Installing` | App deploying to simulator |
| `Launching` | App launching |
| `Bundled` | JS bundle served — **app is ready, start testing** |

**Failure:**

| Sentinel | Meaning |
|---|---|
| `BUILD FAILED` / `FAILURE` | Android build failed |
| `Build Failed` / `error:` | iOS build failed |

4. **Once `Bundled` appears**, proceed to testing. Do not wait for the command to exit.

## Testing on Android

After the app is ready, use the `/android-e2e-testing` skill for interaction (UI dumps, tapping, screenshots, logcat).

Quick reference:

```bash
# Dump UI hierarchy (use for element coordinates, NOT screenshots)
adb shell uiautomator dump /sdcard/ui.xml && adb shell cat /sdcard/ui.xml

# Tap element (calculate center from bounds)
adb shell input tap <x> <y>

# Screenshot
adb shell screencap -p /sdcard/screenshot.png && adb pull /sdcard/screenshot.png /tmp/screenshot.png

# Check for JS errors
adb logcat -d -s ReactNativeJS:E | tail -20
```

## Testing on iOS

After the app is ready, use the `/device-testing` skill for interaction (xcobra).

Quick reference:

```bash
# Get UI tree
bunx xcobra sim xml

# Tap by label
bunx xcobra sim tap --label "Button Text"

# Screenshot
bunx xcobra sim screenshot --output /tmp/screenshot.png
```