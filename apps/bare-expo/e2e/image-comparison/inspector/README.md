# Screen Inspector for iOS Simulator

A dynamic library (dylib) that enables fast UI element coordinate lookup (compared to `maestro hierarchy`) for iOS Simulator testing.

## What it does

This tool injects into a running iOS Simulator app (with `xcrun simctl launch`) and provides:
- **Fast coordinate lookup** - Get element bounds by accessibility ID
- **Screenshot capture** - Take screenshots of specific UI elements, including offscreen parts (tested with FlatList)

## Architecture

- **Swift dylib** (`src/`) - Injected into the simulator app, creates named pipes and responds to requests
- **TypeScript client** (`ScreenInspectorIOS.ts`) - Communicates with the dylib via named pipes
- **Build script** (`scripts/build.sh`) - Compiles the Swift code into a framework

## Building

```bash
cd /path/to/inspector
./scripts/build.sh
```

This creates: `bin/IOSScreenInspectorFramework.framework/IOSScreenInspectorFramework`

The built framework is checked into git for convenience in CI.

## Usage from TypeScript

See `ScreenInspectorIOS.ts`. You can execute `./ScreenInspectorIOS.ts` to test it out.

## Limitations

⚠️ **Single device only** - Currently uses hardcoded pipe paths, so **running tests on multiple devices in parallel will cause conflicts**. The pipes are shared across all simulator instances.

To support parallel device testing, the pipe paths would need to be device-specific (e.g., `/tmp/ios_screen_inspector_request_<deviceId>`).

## Logging

Logs are written to system log and visible in Console.app.

Look for `[ScreenInspector]` prefix in logs.

## Files

- `Package.swift` - Swift package manifest
- `src/ScreenshotServer.swift` - Main server implementation
- `src/UICapture.swift` - Screenshot capture logic
- `src/constructor.c` - C constructor for dylib initialization
- `scripts/build.sh` - Build script for creating the framework
- `ScreenInspectorIOS.ts` - TypeScript client for communicating with the dylib
- `bin/` - Compiled framework
