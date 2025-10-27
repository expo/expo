# Screen Inspector for iOS Simulator

A dynamic library (dylib) that enables fast UI element coordinate lookup (compared to `maestro hierarchy`) for iOS Simulator testing.

## What it does

This tool injects itself into an iOS Simulator app (with `xcrun simctl launch`) and provides **UI element coordinate lookup** by accessibility ID. Usage of this tool is recommended but optional — the output should be equivalent to processing the output of `maestro hierarchy` but a lot faster (see `findElementByTestID` in `image-comparison/src/viewCropper.ts`). It is also used in CI.

Injection only works at app launch time. If the app is already running, then you can't make use of this tool. You can run `./ScreenInspectorIOS.ts` to launch the app with the Screen Inspector injected and it'll stay there until terminated. In CI, the Inspector is injected each time the app starts.

## Architecture

- **Swift dylib** (`src/`) - Injected into the simulator app, creates named pipes and responds to requests
- **TypeScript client** (`ScreenInspectorIOS.ts`) - Communicates with the dylib via named pipes
- **Build script** (`scripts/build.sh`) - Compiles the Swift code into a framework

## Building

This is necessary to use the inspector locally:

```bash
cd /path/to/inspector
./scripts/build.sh
```

This creates: `bin/IOSScreenInspectorFramework.framework/IOSScreenInspectorFramework`

## Usage from TypeScript

See `ScreenInspectorIOS.ts`. You can execute `./ScreenInspectorIOS.ts` to test it out.

## Limitations

⚠️ **Single device only** — Currently uses hardcoded pipe paths, so **running tests on multiple devices in parallel will cause conflicts**. The pipes are shared across all simulator instances.

To support parallel device testing, the pipe paths would need to be device-specific (e.g., `/tmp/ios_screen_inspector_request_<deviceId>`).

## Logging

Logs are written to system log and visible in Console.app.

Look for `[ScreenInspector]` prefix in logs.

## Files

- `Package.swift` - Swift package manifest
- `src/ScreenInspector.swift` - Main server implementation
- `src/UICapture.swift` - UI element finding logic
- `src/constructor.c` - C constructor for dylib initialization
- `scripts/build.sh` - Build script for creating the framework
- `ScreenInspectorIOS.ts` - TypeScript client for communicating with the dylib
- `bin/` - Compiled framework
