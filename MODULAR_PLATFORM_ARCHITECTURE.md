# Modular and Platform Architecture Guide

## Overview
This document provides a comprehensive mapping of files and code related to modular architecture and platform-specific implementations in the Expo repository. This guide is designed to help developers working with lyxbot, AI platforms, and other modular systems understand the Expo architecture.

## Table of Contents
1. [Expo Modules Core Architecture](#expo-modules-core-architecture)
2. [Platform-Specific Code](#platform-specific-code)
3. [Module Autolinking](#module-autolinking)
4. [Platform Manager System](#platform-manager-system)
5. [Key Entry Points](#key-entry-points)

---

## Expo Modules Core Architecture

### Core Module Files
The Expo Modules Core provides the foundation for building native modules with a unified API.

**Location:** `packages/expo-modules-core/`

#### JavaScript/TypeScript Core Files
- `packages/expo-modules-core/src/index.ts` - Main entry point for the modules API
- `packages/expo-modules-core/src/NativeModule.ts` - Base class for native modules
- `packages/expo-modules-core/src/EventEmitter.ts` - Event emission system
- `packages/expo-modules-core/src/SharedObject.ts` - Shared object management
- `packages/expo-modules-core/src/requireNativeModule.ts` - Module loader
- `packages/expo-modules-core/src/NativeModulesProxy.native.ts` - Native module proxy

#### Platform-Specific Module Implementations

##### Android (Kotlin/Java)
**Base Location:** `packages/expo-modules-core/android/src/main/java/expo/modules/`

Key Android Module Files:
- Module Definition: `kotlin/modules/Module.kt`
- Module Registry: `kotlin/ModulesProvider.kt`
- View Management: `kotlin/views/ViewManagerDefinition.kt`
- Type Converters: `kotlin/types/`
- Shared Objects: `kotlin/sharedobjects/`
- Compose Support: `compose/expo/modules/kotlin/views/`

##### iOS (Swift/Objective-C)
**Base Location:** `packages/expo-modules-core/ios/`

Key iOS Module Files:
- Module Definition: `Modules/Module.swift`
- Module Registry: `ModulesProvider.swift`
- View Management: `Views/ViewManager.swift`
- Type Converters: `TypeConverters/`
- Shared Objects: `SharedObjects/`

##### Web (TypeScript)
**Base Location:** `packages/expo-modules-core/src/`

Key Web Module Files:
- `registerWebModule.ts` - Web module registration
- `requireNativeModule.web.ts` - Web module loader
- Platform detection: `environment/browser.web.ts`

---

## Platform-Specific Code

### CLI Platform Managers
**Location:** `packages/@expo/cli/src/start/platforms/`

#### Platform Manager Base
- `PlatformManager.ts` - Abstract base class for platform-specific operations
- `DeviceManager.ts` - Abstract device management interface
- `AppIdResolver.ts` - Application identifier resolution

#### Android Platform
**Location:** `packages/@expo/cli/src/start/platforms/android/`

Core Android Files:
- `AndroidPlatformManager.ts` - Android platform implementation
- `AndroidDeviceManager.ts` - Android device management
- `AndroidAppIdResolver.ts` - Android app ID resolution
- `adb.ts` - Android Debug Bridge integration
- `emulator.ts` - Android emulator control
- `gradle.ts` - Gradle build system integration
- `ADBServer.ts` - ADB server management
- `AndroidSdk.ts` - Android SDK utilities
- `getDevices.ts` - Device enumeration
- `promptAndroidDevice.ts` - Device selection UI

#### iOS Platform
**Location:** `packages/@expo/cli/src/start/platforms/ios/`

Core iOS Files:
- `ApplePlatformManager.ts` - iOS/Apple platform implementation
- `AppleDeviceManager.ts` - iOS device management
- `AppleAppIdResolver.ts` - iOS app ID resolution
- `simctl.ts` - iOS simulator control
- `devicectl.ts` - iOS device control
- `xcrun.ts` - Xcode command-line tools integration
- `getBestSimulator.ts` - Simulator selection logic
- `promptAppleDevice.ts` - Device selection UI
- `simctlLogging.ts` - Simulator logging utilities

---

## Module Autolinking

### Autolinking System
**Location:** `packages/expo-modules-autolinking/src/`

The autolinking system automatically discovers and links native modules.

#### Core Autolinking Files
- `index.ts` - Main autolinking entry point
- `ExpoModuleConfig.ts` - Module configuration parser
- `types.ts` - Type definitions for autolinking
- `utils.ts` - Utility functions
- `exports.ts` - Export utilities

#### Platform-Specific Autolinking

##### Android Autolinking
**Location:** `packages/expo-modules-autolinking/src/platforms/android/`

Files:
- Platform-specific module discovery for Android
- Gradle integration for native modules
- Kotlin/Java code generation

##### iOS Autolinking
**Location:** `packages/expo-modules-autolinking/src/platforms/apple/`

Files:
- Platform-specific module discovery for iOS
- CocoaPods integration
- Swift/Objective-C code generation

##### Web Autolinking
**Location:** `packages/expo-modules-autolinking/src/platforms/web.ts`

- Web module discovery and registration

##### DevTools Autolinking
**Location:** `packages/expo-modules-autolinking/src/platforms/devtools.ts`

- DevTools-specific module configuration

---

## Platform Manager System

### Key Concepts

The Platform Manager system provides a unified interface for:
- Opening projects on different platforms
- Managing devices (simulators, emulators, physical devices)
- Launching apps in different runtimes (Expo Go, custom dev clients, web)
- Resolving application identifiers

### Runtime Types
- **Expo Go Runtime:** Launch project in Expo Go app
- **Custom Runtime:** Launch project in custom development build
- **Web Runtime:** Launch project in web browser

### Device Management Flow
1. **Device Resolution:** `resolveDeviceAsync()` - Selects target device
2. **App Installation Check:** `isAppInstalledAndIfSoReturnContainerPathForIOSAsync()` - Verifies app presence
3. **URL Opening:** `openUrlAsync()` - Launches app with deep link
4. **Window Activation:** `activateWindowAsync()` - Brings app to foreground

---

## Key Entry Points

### For Module Development

#### Creating a New Module
1. Use `create-expo-module` package to scaffold new module
2. Define module in `expo-module.config.json`
3. Implement native code in platform-specific directories
4. Export JavaScript API from `src/index.ts`

#### Module Configuration
- `expo-module.config.json` - Module metadata and configuration
- Defines platforms, native module names, and dependencies

### For Platform Integration

#### Android Integration
1. **Gradle Setup:** Apply Expo modules Gradle plugin
2. **Module Provider:** Create `ExpoModulesPackage` provider
3. **Build Configuration:** Configure in `app/build.gradle`

#### iOS Integration
1. **Podfile Setup:** Add Expo modules autolinking
2. **Module Provider:** Create modules provider in AppDelegate
3. **Build Configuration:** Configure in Xcode project

#### Web Integration
1. **Module Registration:** Use `registerWebModule()`
2. **Polyfills:** Implement web-specific polyfills
3. **Build Configuration:** Configure webpack/metro bundler

---

## Directory Structure Summary

```
expo/
├── packages/
│   ├── expo-modules-core/          # Core modules architecture
│   │   ├── android/                # Android implementation
│   │   ├── ios/                    # iOS implementation
│   │   └── src/                    # JavaScript/TypeScript API
│   │
│   ├── expo-modules-autolinking/   # Automatic module linking
│   │   └── src/
│   │       └── platforms/          # Platform-specific autolinking
│   │           ├── android/
│   │           ├── apple/
│   │           ├── web.ts
│   │           └── devtools.ts
│   │
│   └── @expo/cli/                  # Expo CLI
│       └── src/
│           └── start/
│               └── platforms/      # Platform managers
│                   ├── android/    # Android platform support
│                   ├── ios/        # iOS platform support
│                   ├── PlatformManager.ts
│                   └── DeviceManager.ts
│
└── apps/                           # Example applications
```

---

## Best Practices for Modular Development

### 1. Follow Platform Conventions
- Use Kotlin for Android modules
- Use Swift for iOS modules
- Use TypeScript for web modules

### 2. Implement Platform-Specific APIs
- Provide native implementations for each platform
- Use conditional compilation for platform-specific features
- Maintain API consistency across platforms

### 3. Use Autolinking
- Configure `expo-module.config.json` properly
- Let autolinking handle module discovery
- Avoid manual linking when possible

### 4. Handle Platform Differences
- Use platform-specific files (`.android.ts`, `.ios.ts`, `.web.ts`)
- Implement fallbacks for unsupported platforms
- Document platform-specific behavior

### 5. Test Across Platforms
- Test on physical devices and simulators/emulators
- Verify web compatibility
- Ensure consistent behavior across platforms

---

## For AI Platform and Bot Development

### Recommended Approach for Lyxbot/AI Platform

1. **Module Structure:**
   - Create separate modules for AI functionality
   - Use platform-specific implementations for performance-critical code
   - Leverage native ML frameworks (Core ML on iOS, ML Kit on Android)

2. **Platform Selection:**
   - Identify which platforms need native AI support
   - Implement platform-specific optimizations
   - Provide web fallback with WebAssembly if needed

3. **Integration Points:**
   - Use `expo-modules-core` for creating AI modules
   - Leverage platform managers for device-specific optimizations
   - Implement autolinking for seamless integration

4. **Key Files to Start With:**
   - Create new module: Use `create-expo-module` package
   - Platform managers: `packages/@expo/cli/src/start/platforms/`
   - Module core: `packages/expo-modules-core/`

---

## Additional Resources

- [Expo Modules API Documentation](https://docs.expo.dev/modules/)
- [Creating Native Modules](https://docs.expo.dev/modules/module-api/)
- [Platform-Specific Code](https://docs.expo.dev/workflow/customizing/)
- [Autolinking Guide](https://docs.expo.dev/modules/autolinking/)

---

## Related Documentation

- See `packages/expo-modules-core/README.md` for core module documentation
- See `CONTRIBUTING.md` for contribution guidelines
- See individual package READMEs for specific module documentation
