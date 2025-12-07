# File Index: Modular and Platform Code Reference

This document provides a detailed index of all key files for modular architecture and platform-specific implementations in the Expo repository.

## Quick Navigation
- [Expo Modules Core](#expo-modules-core)
- [Platform Managers](#platform-managers)
- [Autolinking System](#autolinking-system)
- [Android Platform](#android-platform)
- [iOS Platform](#ios-platform)
- [Web Platform](#web-platform)
- [Module Templates](#module-templates)

---

## Expo Modules Core

### JavaScript/TypeScript Core API

#### Main Entry Points
| File | Description |
|------|-------------|
| `packages/expo-modules-core/src/index.ts` | Main export file for the modules API |
| `packages/expo-modules-core/index.js` | Entry point for the package |
| `packages/expo-modules-core/types.d.ts` | TypeScript type definitions |

#### Module System
| File | Description |
|------|-------------|
| `packages/expo-modules-core/src/NativeModule.ts` | Base native module class |
| `packages/expo-modules-core/src/requireNativeModule.ts` | Native module loading (native platforms) |
| `packages/expo-modules-core/src/requireNativeModule.web.ts` | Native module loading (web platform) |
| `packages/expo-modules-core/src/NativeModulesProxy.native.ts` | Proxy for accessing native modules |
| `packages/expo-modules-core/src/ensureNativeModulesAreInstalled.ts` | Module installation verification |
| `packages/expo-modules-core/src/ensureNativeModulesAreInstalled.native.ts` | Module installation (native) |

#### Event System
| File | Description |
|------|-------------|
| `packages/expo-modules-core/src/EventEmitter.ts` | Modern event emitter implementation |
| `packages/expo-modules-core/src/LegacyEventEmitter.ts` | Legacy event emitter for compatibility |

#### Shared Objects
| File | Description |
|------|-------------|
| `packages/expo-modules-core/src/SharedObject.ts` | Shared object management |
| `packages/expo-modules-core/src/hooks/useReleasingSharedObject.ts` | React hook for shared objects |

#### Web Support
| File | Description |
|------|-------------|
| `packages/expo-modules-core/src/registerWebModule.ts` | Web module registration |
| `packages/expo-modules-core/src/environment/browser.ts` | Browser environment detection |
| `packages/expo-modules-core/src/environment/browser.web.ts` | Browser-specific environment |

#### Utilities
| File | Description |
|------|-------------|
| `packages/expo-modules-core/src/reload.ts` | App reload functionality |
| `packages/expo-modules-core/src/PermissionsInterface.ts` | Permissions interface |
| `packages/expo-modules-core/src/PermissionsHook.ts` | Permissions hook |
| `packages/expo-modules-core/src/uuid/` | UUID generation utilities |

---

## Platform Managers

### Base Platform Manager
| File | Description |
|------|-------------|
| `packages/@expo/cli/src/start/platforms/PlatformManager.ts` | Abstract platform manager base class |
| `packages/@expo/cli/src/start/platforms/DeviceManager.ts` | Abstract device manager interface |
| `packages/@expo/cli/src/start/platforms/AppIdResolver.ts` | Application ID resolver interface |
| `packages/@expo/cli/src/start/platforms/ExpoGoInstaller.ts` | Expo Go installation manager |

---

## Autolinking System

### Core Autolinking
| File | Description |
|------|-------------|
| `packages/expo-modules-autolinking/src/index.ts` | Main autolinking entry point |
| `packages/expo-modules-autolinking/src/ExpoModuleConfig.ts` | Module configuration parser |
| `packages/expo-modules-autolinking/src/types.ts` | Autolinking type definitions |
| `packages/expo-modules-autolinking/src/utils.ts` | Autolinking utilities |
| `packages/expo-modules-autolinking/src/exports.ts` | Export generation utilities |

### Platform-Specific Autolinking
| File | Description |
|------|-------------|
| `packages/expo-modules-autolinking/src/platforms/index.ts` | Platform autolinking orchestrator |
| `packages/expo-modules-autolinking/src/platforms/android/` | Android autolinking implementation |
| `packages/expo-modules-autolinking/src/platforms/apple/` | iOS/macOS autolinking implementation |
| `packages/expo-modules-autolinking/src/platforms/web.ts` | Web platform autolinking |
| `packages/expo-modules-autolinking/src/platforms/devtools.ts` | DevTools platform autolinking |

---

## Android Platform

### CLI Android Platform Manager
| File | Description |
|------|-------------|
| `packages/@expo/cli/src/start/platforms/android/AndroidPlatformManager.ts` | Android platform manager implementation |
| `packages/@expo/cli/src/start/platforms/android/AndroidDeviceManager.ts` | Android device management |
| `packages/@expo/cli/src/start/platforms/android/AndroidAppIdResolver.ts` | Android package name resolver |

### Android Device Management
| File | Description |
|------|-------------|
| `packages/@expo/cli/src/start/platforms/android/adb.ts` | Android Debug Bridge (ADB) interface |
| `packages/@expo/cli/src/start/platforms/android/ADBServer.ts` | ADB server management |
| `packages/@expo/cli/src/start/platforms/android/getDevices.ts` | Android device enumeration |
| `packages/@expo/cli/src/start/platforms/android/emulator.ts` | Android emulator control |
| `packages/@expo/cli/src/start/platforms/android/promptAndroidDevice.ts` | Device selection prompt |
| `packages/@expo/cli/src/start/platforms/android/adbReverse.ts` | ADB reverse port forwarding |
| `packages/@expo/cli/src/start/platforms/android/activateWindow.ts` | Window activation utilities |

### Android Build System
| File | Description |
|------|-------------|
| `packages/@expo/cli/src/start/platforms/android/gradle.ts` | Gradle build system integration |
| `packages/@expo/cli/src/start/platforms/android/AndroidSdk.ts` | Android SDK utilities |

### Expo Modules Core - Android Implementation
| Directory/File | Description |
|------|-------------|
| `packages/expo-modules-core/android/src/main/java/expo/modules/` | Android modules implementation root |
| `packages/expo-modules-core/android/src/main/java/expo/modules/kotlin/modules/Module.kt` | Kotlin module base class |
| `packages/expo-modules-core/android/src/main/java/expo/modules/kotlin/ModulesProvider.kt` | Module provider |
| `packages/expo-modules-core/android/src/main/java/expo/modules/kotlin/views/` | View management |
| `packages/expo-modules-core/android/src/main/java/expo/modules/kotlin/types/` | Type conversion system |
| `packages/expo-modules-core/android/src/main/java/expo/modules/kotlin/sharedobjects/` | Shared objects |
| `packages/expo-modules-core/android/src/main/java/expo/modules/kotlin/functions/` | Function definitions |
| `packages/expo-modules-core/android/src/main/java/expo/modules/kotlin/exception/` | Exception handling |
| `packages/expo-modules-core/android/src/compose/expo/modules/kotlin/views/` | Jetpack Compose support |

### Android Gradle Plugin
| File | Description |
|------|-------------|
| `packages/expo-modules-core/expo-module-gradle-plugin/` | Gradle plugin for Expo modules |
| `packages/expo-modules-core/gradle.groovy` | Gradle configuration script |

---

## iOS Platform

### CLI iOS Platform Manager
| File | Description |
|------|-------------|
| `packages/@expo/cli/src/start/platforms/ios/ApplePlatformManager.ts` | iOS platform manager implementation |
| `packages/@expo/cli/src/start/platforms/ios/AppleDeviceManager.ts` | iOS device management |
| `packages/@expo/cli/src/start/platforms/ios/AppleAppIdResolver.ts` | iOS bundle identifier resolver |

### iOS Device Management
| File | Description |
|------|-------------|
| `packages/@expo/cli/src/start/platforms/ios/simctl.ts` | iOS Simulator control (simctl) |
| `packages/@expo/cli/src/start/platforms/ios/devicectl.ts` | iOS device control (devicectl) |
| `packages/@expo/cli/src/start/platforms/ios/getBestSimulator.ts` | Simulator selection logic |
| `packages/@expo/cli/src/start/platforms/ios/promptAppleDevice.ts` | Device selection prompt |
| `packages/@expo/cli/src/start/platforms/ios/simctlLogging.ts` | Simulator logging utilities |
| `packages/@expo/cli/src/start/platforms/ios/ensureSimulatorAppRunning.ts` | Simulator app launch |

### iOS Build System
| File | Description |
|------|-------------|
| `packages/@expo/cli/src/start/platforms/ios/xcrun.ts` | Xcode command-line tools interface |
| `packages/@expo/cli/src/start/platforms/ios/assertSystemRequirements.ts` | System requirements validation |

### Expo Modules Core - iOS Implementation
| Directory/File | Description |
|------|-------------|
| `packages/expo-modules-core/ios/` | iOS modules implementation root |
| `packages/expo-modules-core/ios/Modules/Module.swift` | Swift module base class |
| `packages/expo-modules-core/ios/ModulesProvider.swift` | Module provider |
| `packages/expo-modules-core/ios/Views/` | View management |
| `packages/expo-modules-core/ios/TypeConverters/` | Type conversion system |
| `packages/expo-modules-core/ios/SharedObjects/` | Shared objects |
| `packages/expo-modules-core/ios/JSI/` | JavaScript Interface (JSI) |
| `packages/expo-modules-core/ios/Core/` | Core utilities |
| `packages/expo-modules-core/ios/Swift/` | Swift-specific code |

### iOS CocoaPods Integration
| File | Description |
|------|-------------|
| `packages/expo-modules-core/ExpoModulesCore.podspec` | Main CocoaPods specification |
| `packages/expo-modules-core/ExpoModulesJSI.podspec` | JSI-specific podspec |
| `packages/expo-modules-core/cocoapods.rb` | CocoaPods helper script |

---

## Web Platform

### Web Platform Support
| File | Description |
|------|-------------|
| `packages/expo-modules-core/src/registerWebModule.ts` | Web module registration |
| `packages/expo-modules-core/src/requireNativeModule.web.ts` | Web module loader |
| `packages/expo-modules-core/src/environment/browser.web.ts` | Browser environment utilities |
| `packages/expo-modules-core/src/polyfill/index.web.ts` | Web polyfills |
| `packages/expo-modules-core/src/uuid/index.web.ts` | Web UUID implementation |
| `packages/expo-modules-autolinking/src/platforms/web.ts` | Web autolinking |

---

## Module Templates

### Creating New Modules
| Package | Description |
|---------|-------------|
| `packages/create-expo-module/` | CLI tool for creating new Expo modules |
| `packages/expo-module-template/` | Template for new modules (published) |
| `packages/expo-module-template-local/` | Template for local development |
| `packages/expo-module-scripts/` | Build and development scripts for modules |

### Module Configuration
| File | Description |
|------|-------------|
| `expo-module.config.json` | Standard module configuration file (in each module) |
| Example: `packages/expo-modules-core/expo-module.config.json` | Configuration example |

---

## Testing Infrastructure

### Module Testing
| File | Description |
|------|-------------|
| `packages/expo-modules-test-core/` | Testing utilities for modules |
| `packages/jest-expo/` | Jest configuration for Expo |
| `packages/expo-test-runner/` | Test runner for Expo apps |

---

## Additional Build and Configuration Files

### Root Configuration
| File | Description |
|------|-------------|
| `package.json` | Root package configuration |
| `tsconfig.json` | Root TypeScript configuration |
| `.eslintrc.js` | ESLint configuration |
| `.prettierrc` | Prettier configuration |
| `yarn.lock` | Dependency lock file |

### Platform-Specific Configuration Templates
| File | Description |
|------|-------------|
| `template-files/ios/dependencies.json` | iOS CocoaPods dependencies template |
| `template-files/` | Platform-specific template files |

---

## Key Concepts Summary

### Module Development Flow
1. **Create Module:** Use `create-expo-module` to scaffold
2. **Configure:** Edit `expo-module.config.json`
3. **Implement Native Code:**
   - Android: Kotlin in `android/src/main/java/`
   - iOS: Swift in `ios/`
   - Web: TypeScript with `.web.ts` extension
4. **Implement JS API:** TypeScript in `src/`
5. **Test:** Use `expo-modules-test-core`
6. **Link:** Autolinking handles integration

### Platform Manager Usage
1. **Initialize:** Create platform-specific manager
2. **Resolve Device:** Select target device (simulator/emulator/physical)
3. **Install App:** Ensure app is installed on device
4. **Launch:** Open app with appropriate URL/deep link
5. **Activate:** Bring app to foreground

### Autolinking Process
1. **Scan:** Find modules with `expo-module.config.json`
2. **Generate:** Create platform-specific linking code
3. **Integrate:** Automatically include in build process
4. **Register:** Register modules at runtime

---

## For AI Platform Development

### Recommended Files to Study

#### For Creating AI Modules
1. Start with: `packages/create-expo-module/`
2. Reference: `packages/expo-modules-core/src/index.ts`
3. Android ML: Implement in `android/src/main/java/`
4. iOS ML: Implement in `ios/` using Core ML
5. Web ML: Implement with TensorFlow.js or WebAssembly

#### For Platform-Specific AI Optimization
1. Platform Managers: `packages/@expo/cli/src/start/platforms/`
2. Device Management: Study device detection and capabilities
3. Type Converters: For efficient data passing between JS and native

#### For Bot Integration
1. Event System: `packages/expo-modules-core/src/EventEmitter.ts`
2. Shared Objects: For maintaining bot state
3. Background Tasks: See `packages/expo-background-fetch/`

---

## File Naming Conventions

### Platform-Specific Files
- `.android.ts` - Android-specific TypeScript
- `.ios.ts` - iOS-specific TypeScript
- `.web.ts` - Web-specific TypeScript
- `.native.ts` - Native platforms (iOS + Android)

### Test Files
- `__tests__/` - Test directory
- `*.test.ts` - Jest test files
- `__mocks__/` - Mock directory

### Native Files
- `*.kt` - Kotlin (Android)
- `*.java` - Java (Android)
- `*.swift` - Swift (iOS)
- `*.m` - Objective-C (iOS)
- `*.h` - C/Objective-C headers

---

## Next Steps for Your Project

1. **Study Module Creation:** Review `packages/create-expo-module/`
2. **Understand Platform Managers:** Study `packages/@expo/cli/src/start/platforms/`
3. **Review Module Examples:** Look at existing modules in `packages/expo-*/`
4. **Set Up Development Environment:** Follow guides in `guides/`
5. **Create Your First Module:** Use `npx create-expo-module` command
6. **Implement Platform-Specific Code:** Use templates as reference
7. **Test Across Platforms:** Use testing utilities in `packages/expo-modules-test-core/`

---

Last Updated: 2025-12-06
Repository: expo/expo
