# Quick Reference: Finding Code for Modular and Platform Features

This is a quick reference guide for finding specific code patterns and implementations in the Expo repository. Use this when looking for examples or understanding how specific features are implemented.

## Table of Contents
- [Module System](#module-system)
- [Platform Detection](#platform-detection)
- [Device Management](#device-management)
- [Build Systems](#build-systems)
- [Type Conversion](#type-conversion)
- [Event Handling](#event-handling)
- [View Management](#view-management)

---

## Module System

### How to Find: Module Definition Code

**Android (Kotlin)**
```kotlin
// Look for files in:
packages/expo-modules-core/android/src/main/java/expo/modules/kotlin/modules/

// Key classes:
- Module.kt - Base module class
- ModuleDefinition.kt - Module configuration DSL
- ModuleDefinitionBuilder.kt - Builder pattern for modules
```

**iOS (Swift)**
```swift
// Look for files in:
packages/expo-modules-core/ios/Modules/

// Key files:
- Module.swift - Base module protocol
- ModuleDefinition.swift - Module configuration
- ModuleDefinitionBuilder.swift - Builder for modules
```

**JavaScript/TypeScript**
```typescript
// Look for files in:
packages/expo-modules-core/src/

// Key files:
- NativeModule.ts - Base class for modules
- requireNativeModule.ts - Module loading
```

### Example Module Implementations

To see real-world examples, check these packages:
- `packages/expo-camera/` - Camera module
- `packages/expo-file-system/` - File system module
- `packages/expo-location/` - Location module
- `packages/expo-sensors/` - Sensors module
- `packages/expo-battery/` - Simple module example

---

## Platform Detection

### Where to Find Platform Detection Code

**JavaScript Platform Detection**
```typescript
// Main file:
packages/expo-modules-core/src/environment/browser.ts

// Check platform:
import { Platform } from 'react-native';
// Platform.OS returns 'ios' | 'android' | 'web' | 'windows' | 'macos'
```

**Native Platform Checks**

Android:
```kotlin
// In Kotlin modules, platform is implicit (Android)
// Check API level:
android.os.Build.VERSION.SDK_INT
```

iOS:
```swift
// In Swift modules, platform is implicit (iOS)
// Check iOS version:
UIDevice.current.systemVersion
```

### Platform-Specific File Naming

Files automatically loaded based on platform:
- `index.ts` - Default (all platforms)
- `index.native.ts` - Native platforms (iOS + Android)
- `index.android.ts` - Android only
- `index.ios.ts` - iOS only
- `index.web.ts` - Web only

---

## Device Management

### Android Device Management

**Find Device Enumeration:**
```typescript
packages/@expo/cli/src/start/platforms/android/getDevices.ts
```

**ADB Operations:**
```typescript
packages/@expo/cli/src/start/platforms/android/adb.ts
```

**Emulator Control:**
```typescript
packages/@expo/cli/src/start/platforms/android/emulator.ts
```

**Key Functions:**
- `getAttachedDevicesAsync()` - List connected devices
- `getRunningAvdsAsync()` - List running emulators
- `adbAsync()` - Execute ADB commands

### iOS Device Management

**Find Device Enumeration:**
```typescript
packages/@expo/cli/src/start/platforms/ios/simctl.ts
packages/@expo/cli/src/start/platforms/ios/devicectl.ts
```

**Simulator Control:**
```typescript
packages/@expo/cli/src/start/platforms/ios/simctl.ts
```

**Key Functions:**
- `listSimulatorsAsync()` - List available simulators
- `bootAsync()` - Boot simulator
- `installAsync()` - Install app on simulator

---

## Build Systems

### Android Build System (Gradle)

**Main Gradle Integration:**
```groovy
packages/expo-modules-core/gradle.groovy
```

**Expo Module Gradle Plugin:**
```
packages/expo-modules-core/expo-module-gradle-plugin/
```

**CLI Gradle Integration:**
```typescript
packages/@expo/cli/src/start/platforms/android/gradle.ts
```

**Key Files in Android Modules:**
- `build.gradle` - Module build configuration
- `android/build.gradle` - Native Android build
- `gradle.properties` - Gradle properties

### iOS Build System (CocoaPods)

**Main CocoaPods Integration:**
```ruby
packages/expo-modules-core/cocoapods.rb
```

**Podspecs:**
```ruby
packages/expo-modules-core/ExpoModulesCore.podspec
packages/expo-modules-core/ExpoModulesJSI.podspec
```

**CLI Xcode Integration:**
```typescript
packages/@expo/cli/src/start/platforms/ios/xcrun.ts
```

**Key Files in iOS Modules:**
- `ExpoModuleName.podspec` - CocoaPods specification
- `ios/*.xcodeproj` - Xcode project

---

## Type Conversion

### Android Type Conversion

**Location:**
```
packages/expo-modules-core/android/src/main/java/expo/modules/kotlin/types/
```

**Key Type Converters:**
- `JSTypeConverter.kt` - Base converter interface
- `BasicTypeConverter.kt` - Primitive types
- `EnumTypeConverter.kt` - Enum conversion
- `ColorTypeConverter.kt` - Color conversion
- `DateTypeConverter.kt` - Date/time conversion
- `RecordTypeConverter.kt` - Record/object conversion

**Tests:**
```
packages/expo-modules-core/android/src/test/java/expo/modules/kotlin/types/
```

### iOS Type Conversion

**Location:**
```
packages/expo-modules-core/ios/TypeConverters/
```

**Key Converters:**
- Primitive type converters
- Collection converters
- Record converters
- Enum converters

---

## Event Handling

### JavaScript Event Emitter

**Modern Event Emitter:**
```typescript
packages/expo-modules-core/src/EventEmitter.ts
```

**Legacy Event Emitter:**
```typescript
packages/expo-modules-core/src/LegacyEventEmitter.ts
```

**Usage Example:**
```typescript
import { EventEmitter } from 'expo-modules-core';

const emitter = new EventEmitter(nativeModule);
const subscription = emitter.addListener('eventName', (event) => {
  console.log(event);
});
subscription.remove(); // Clean up
```

### Native Event Emission

**Android:**
```kotlin
// In module definition:
Events("onSomethingHappened")

// To emit:
sendEvent("onSomethingHappened", mapOf("data" to value))
```

**iOS:**
```swift
// In module definition:
Events("onSomethingHappened")

// To emit:
sendEvent("onSomethingHappened", ["data": value])
```

---

## View Management

### Android View Management

**Location:**
```
packages/expo-modules-core/android/src/main/java/expo/modules/kotlin/views/
```

**Key Files:**
- `ViewManagerDefinition.kt` - View manager setup
- `ConcreteViewProp.kt` - View property definitions
- `ViewDefinitionBuilder.kt` - Builder for views

**Jetpack Compose Support:**
```
packages/expo-modules-core/android/src/compose/expo/modules/kotlin/views/
```

**Example Usage in Module:**
```kotlin
View(ViewType::class) {
  Prop("text") { view: ViewType, text: String ->
    view.setText(text)
  }
  
  Events("onPress")
}
```

### iOS View Management

**Location:**
```
packages/expo-modules-core/ios/Views/
```

**Key Files:**
- `ViewManager.swift` - View manager protocol
- `ViewDefinition.swift` - View configuration
- `ViewProp.swift` - View property definitions

**Example Usage in Module:**
```swift
View(ViewType.self) {
  Prop("text") { (view: ViewType, text: String) in
    view.text = text
  }
  
  Events("onPress")
}
```

---

## Shared Objects

### JavaScript Shared Objects

**Location:**
```typescript
packages/expo-modules-core/src/SharedObject.ts
packages/expo-modules-core/src/hooks/useReleasingSharedObject.ts
```

**Usage:**
```typescript
import { SharedObject } from 'expo-modules-core';

class MySharedObject extends SharedObject {
  // Methods
}
```

### Native Shared Objects

**Android:**
```
packages/expo-modules-core/android/src/main/java/expo/modules/kotlin/sharedobjects/
```

**iOS:**
```
packages/expo-modules-core/ios/SharedObjects/
```

---

## Permissions

### Permission System

**Interface:**
```typescript
packages/expo-modules-core/src/PermissionsInterface.ts
packages/expo-modules-core/src/PermissionsHook.ts
```

**Example Implementations:**
See these packages for permission examples:
- `packages/expo-camera/` - Camera permissions
- `packages/expo-location/` - Location permissions
- `packages/expo-media-library/` - Media permissions

---

## Autolinking

### How Autolinking Works

**Main Entry:**
```typescript
packages/expo-modules-autolinking/src/index.ts
```

**Configuration:**
```typescript
packages/expo-modules-autolinking/src/ExpoModuleConfig.ts
```

**Platform Implementations:**
- Android: `packages/expo-modules-autolinking/src/platforms/android/`
- iOS: `packages/expo-modules-autolinking/src/platforms/apple/`
- Web: `packages/expo-modules-autolinking/src/platforms/web.ts`

---

## Testing

### Module Testing

**Test Core:**
```
packages/expo-modules-test-core/
```

**Jest Configuration:**
```
packages/jest-expo/
```

**Example Tests:**
Look at any module's `__tests__/` directory, for example:
- `packages/expo-file-system/__tests__/`
- `packages/expo-camera/__tests__/`

---

## CLI Tools

### Creating Modules

**Module Creation:**
```
packages/create-expo-module/
```

**Command:**
```bash
npx create-expo-module my-module
```

### Module Scripts

**Build Scripts:**
```
packages/expo-module-scripts/
```

**Used for:**
- Building TypeScript
- Generating documentation
- Running tests

---

## Common Patterns

### Pattern: Async Function in Module

**Android:**
```kotlin
AsyncFunction("doSomething") { arg: String ->
  // Automatically runs on background thread
  performLongOperation(arg)
  return result
}
```

**iOS:**
```swift
AsyncFunction("doSomething") { (arg: String) -> String in
  // Automatically runs on background thread
  let result = performLongOperation(arg)
  return result
}
```

### Pattern: View with Props

**Android:**
```kotlin
View(MyView::class) {
  Prop("backgroundColor") { view: MyView, color: Int ->
    view.setBackgroundColor(color)
  }
}
```

**iOS:**
```swift
View(MyView.self) {
  Prop("backgroundColor") { (view: MyView, color: UIColor) in
    view.backgroundColor = color
  }
}
```

### Pattern: Constants Export

**Android:**
```kotlin
Constants {
  return mapOf(
    "CONSTANT_NAME" to "value"
  )
}
```

**iOS:**
```swift
Constants {
  return [
    "CONSTANT_NAME": "value"
  ]
}
```

---

## Finding Example Code

### Best Modules for Learning

**Simple Modules (Good Starting Point):**
- `packages/expo-constants/` - Read-only constants
- `packages/expo-battery/` - Simple async functions
- `packages/expo-device/` - Device information

**Medium Complexity:**
- `packages/expo-file-system/` - File operations, async
- `packages/expo-clipboard/` - Clipboard operations
- `packages/expo-brightness/` - System settings

**Complex Modules (Advanced):**
- `packages/expo-camera/` - Views, permissions, events
- `packages/expo-av/` - Audio/video, complex views
- `packages/expo-location/` - Background tasks, permissions
- `packages/expo-sqlite/` - Database, shared objects

---

## Code Search Tips

### Finding Similar Implementations

Use grep or your editor's search:

```bash
# Find all AsyncFunction definitions (Android)
grep -r "AsyncFunction(" packages/expo-*/android/

# Find all Events definitions (iOS)
grep -r "Events(" packages/expo-*/ios/

# Find all View definitions
grep -r "View(" packages/expo-*/

# Find type converters
find packages/expo-modules-core -name "*TypeConverter*"

# Find platform managers
find packages -name "*PlatformManager*"
```

### Looking for Specific Features

**Background Tasks:**
- `packages/expo-background-fetch/`
- `packages/expo-task-manager/`

**Native Views:**
- `packages/expo-camera/`
- `packages/expo-gl/`
- `packages/expo-video/`

**System Integration:**
- `packages/expo-intent-launcher/` (Android)
- `packages/expo-store-review/` (iOS)

**File System:**
- `packages/expo-file-system/`
- `packages/expo-asset/`
- `packages/expo-document-picker/`

---

## Documentation Links

Within the repository:
- `packages/expo-modules-core/README.md` - Core documentation
- `CONTRIBUTING.md` - Contribution guide
- `guides/` - Developer guides

External:
- https://docs.expo.dev/modules/ - Modules API docs
- https://docs.expo.dev/modules/module-api/ - API reference
- https://docs.expo.dev/modules/autolinking/ - Autolinking guide

---

## Tips for AI/Bot Development

### For Machine Learning Modules

**Study These Patterns:**
1. **Camera Module** (`packages/expo-camera/`) - For ML vision
2. **Audio Module** (`packages/expo-av/`) - For ML audio
3. **Sensors** (`packages/expo-sensors/`) - For ML motion data

**Key Considerations:**
- Use native ML frameworks (Core ML for iOS, ML Kit for Android)
- Implement type converters for tensor data
- Use SharedObjects for model management
- Consider WebAssembly for web platform

### For Bot/Agent Systems

**Useful Patterns:**
1. **Event System** - For bot communication
2. **Background Tasks** - For periodic bot actions
3. **Shared Objects** - For maintaining bot state
4. **Async Functions** - For long-running operations

**Example Architecture:**
```
Bot Module
├── JavaScript API (src/)
│   ├── BotController.ts
│   └── BotSharedObject.ts
├── Android (android/)
│   ├── BotModule.kt
│   └── BotAgent.kt
└── iOS (ios/)
    ├── BotModule.swift
    └── BotAgent.swift
```

---

Last Updated: 2025-12-06
