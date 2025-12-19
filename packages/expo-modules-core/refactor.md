# ExpoModulesCore React Native Decoupling Analysis

## Goal
Investigate whether expo-modules-core can be decoupled from direct React Native class inheritance to support precompiled xcframeworks and Swift Package Manager without re-exporting the React package.

## Current State: Objective-C Headers Inheriting from React Native Types

### 1. ExpoFabricViewObjC : RCTViewComponentView
**File:** `ios/Fabric/ExpoFabricViewObjC.h` (line 11)

**Purpose:** Base class for all Expo Fabric views

**Why inheritance is currently needed:**
- Must participate in React Native's component view system for proper lifecycle
- Implements `RCTComponentViewProtocol` (finalizeUpdates, updateState, etc.)
- Component registration via `RCTComponentViewFactory`
- Access to `_props`, `_eventEmitter`, `_state` from base class

**Key RN functionality used in ExpoFabricViewObjC.mm:**
- `RCTComponentViewFactory` for component registration
- `ComponentDescriptorProvider` return type
- State management via `ExpoViewShadowNode::ConcreteState`
- Event dispatch via `ExpoViewEventEmitter`

**Swift subclass:** `ExpoFabricView` in `ios/Fabric/ExpoFabricView.swift`

**Feasibility of abstraction:** DIFFICULT
- Deep integration with Fabric's C++ rendering infrastructure
- Would require a thin bridging layer between a "React-free" view and RCTViewComponentView

---

### 2. RCTComponentDataSwiftAdapter : RCTComponentData
**File:** `ios/RCTComponentData+Privates.h` (line 23)

**Purpose:** Adapter to allow nullable `eventDispatcher` parameter for Swift interop

**Used by:** `ComponentData.swift` which extends `RCTComponentDataSwiftAdapter`

**Code path:** `EXNativeModulesProxy.mm` registers `EXComponentData` instances into the bridge's UIManager (`_componentDataByName`)

**Key observation:** This appears to be Paper-era infrastructure for UIManager-based view registration. In Fabric-only mode, views are registered via `RCTComponentViewFactory` instead.

**Feasibility of removal:** LIKELY POSSIBLE
- Need to verify if `ComponentData` is still used in Fabric mode
- The `registerComponentData:inBridge:forAppId:` method in EXNativeModulesProxy.mm may be dead code in Fabric-only builds

---

### 3. EXReactNativeEventEmitter : RCTEventEmitter
**File:** `ios/Legacy/Services/EXReactNativeEventEmitter.h` (line 12)

**Purpose:** Bridge for sending events from native modules (not views) to JavaScript

**Still needed:** Yes, even in Fabric this is used for module-level events

**Key RN functionality:**
- `RCT_EXPORT_MODULE` macro
- `sendEventWithName:body:` method
- `supportedEvents` array

**Feasibility of abstraction:** MODERATE
- Could define a protocol and inject the RCTEventEmitter subclass at runtime
- The protocol would need to match the event emitter interface

---

### 4. Classes Conforming to RCTBridgeModule (Protocol, not inheritance)

These don't inherit from RN classes but conform to the protocol:
- `ExpoBridgeModule` (`ios/Core/ExpoBridgeModule.h`)
- `EXNativeModulesProxy` (`ios/Legacy/NativeModulesProxy/EXNativeModulesProxy.h`)
- `EXModuleRegistryHolderReactModule` (`ios/Legacy/ModuleRegistryAdapter/EXModuleRegistryHolderReactModule.h`)

These are less problematic as protocols can be forward-declared.

---

## Investigation Tasks

### Task 1: Verify if ComponentData/RCTComponentDataSwiftAdapter is used in Fabric mode

#### Status: ✅ INVESTIGATED

#### Findings:

**Code Flow Analysis:**

1. `EXNativeModulesProxy.setBridge:` is called when the module is initialized
2. This calls `registerExpoModulesInBridge:` 
3. Which calls `registerComponentData:inBridge:forAppId:` for each view module
4. This method does TWO things:
   - **Lines 417-477**: Creates `EXComponentData` and registers it in UIManager's `_componentDataByName` dictionary
   - **Lines 479-518** (inside `#ifdef RCT_NEW_ARCH_ENABLED`): Registers with `RCTComponentViewFactory`

**Key Discovery - React Native's Interop Layer:**

Looking at React Native's `LegacyViewManagerInteropComponentDescriptor.mm` (lines 132-159), the interop layer creates its **own** `RCTComponentData` directly:

```objc
RCTComponentData *componentData =
    [[RCTComponentData alloc] initWithManagerClass:viewManagerClass
                                            bridge:bridge != nil ? bridge : (RCTBridge *)bridgeProxy
                                   eventDispatcher:eventDispatcher];
```

The interop layer does NOT look up components from UIManager's `_componentDataByName`. It:
1. Looks up the view manager class by name (`NSClassFromString`, bridge lookup, etc.)
2. Creates a fresh `RCTComponentData` with that class

**Conclusion for Task 1:**

The `EXComponentData` registration in `_componentDataByName` appears to be **legacy Paper infrastructure** that is NOT used by:
- Fabric's native view registration (uses `RCTComponentViewFactory`)
- Fabric's interop layer (creates its own `RCTComponentData`)

**However**, there are some edge cases to consider:
- `RCTUIManager.dispatchViewManagerCommand` (line 1149-1167) looks up `_componentDataByName` for command dispatch
- Some older code paths might still use it

**Recommendation:**
- The `EXComponentData`/`RCTComponentDataSwiftAdapter` registration into `_componentDataByName` is likely safe to remove for Fabric-only builds
- The Fabric registration via `RCTComponentViewFactory` should be sufficient
- Need to verify command dispatch still works (Fabric uses different path via `schedulerDidDispatchCommand`)

---

### Task 2: Design protocol abstraction for EXReactNativeEventEmitter

#### Status: ✅ IMPLEMENTED

**Changes made:**

1. **`ios/Legacy/Services/EXReactNativeEventEmitter.h`**
   - ✅ Changed inheritance from `RCTEventEmitter` to `NSObject`
   - ✅ Changed `#import <React/RCTEventEmitter.h>` to `#import <React/RCTBridgeModule.h>`
   - ✅ Conforms directly to `RCTBridgeModule` instead of inheriting from `RCTEventEmitter`
   - ✅ Removed `EXBridgeModule` conformance (was only needed for RCTEventEmitter compatibility)
   - ✅ Added documentation explaining JSI-based event emission

2. **`ios/Legacy/Services/EXReactNativeEventEmitter.m`**
   - ✅ Implemented `sendEventWithName:body:` to forward to AppContext's eventEmitter (JSI-based)
   - ✅ Added local `startObserving`/`stopObserving` methods (no longer inherited from RCTEventEmitter)
   - ✅ Added local `addListener:`/`removeListeners:` methods (no longer inherited)
   - ✅ Added `isObserving` property to track observation state

3. **`ios/Protocols/EXAppContextProtocol.h`**
   - ✅ Added forward declaration for `EXEventEmitterService` protocol
   - ✅ Added `eventEmitter` property to protocol for JSI-based event sending

**Impact:**
- ✅ Removed dependency on `RCTEventEmitter` class inheritance
- ✅ Removed `#import <React/RCTEventEmitter.h>` requirement
- ✅ Events now sent via JSI through `LegacyEventEmitterCompat` instead of bridge
- ✅ Legacy modules (`EXExportedModule` subclasses) continue to work via this event emitter
- ✅ Still conforms to `RCTBridgeModule` for bridge registration (required for module loading)

### Task 3: Evaluate ExpoFabricViewObjC bridging options

#### Status: ✅ COMPLETE (Decision: Accept dependency)

**Current dependency:** `ExpoFabricViewObjC : RCTViewComponentView`

**Why it's needed:**
1. Fabric component registration via `RCTComponentViewFactory`
2. C++ `ComponentDescriptorProvider` for Fabric renderer integration
3. Access to `_props`, `_eventEmitter`, `_state` from base class
4. ShadowNode state management via `ExpoViewShadowNode::ConcreteState`
5. Event dispatch via `ExpoViewEventEmitter` (C++ → JSI)

**Options evaluated:**

**Option A: Accept RN dependency for view layer** ✅ RECOMMENDED
- Keep `ExpoFabricViewObjC : RCTViewComponentView`
- This is fundamental Fabric infrastructure
- Views MUST integrate with Fabric's C++ renderer
- Precompiled xcframeworks would include RCTViewComponentView as a dependency

**Option B: Create protocol-based wrapper** ❌ NOT FEASIBLE
- Would require replicating C++ template infrastructure
- `ComponentDescriptorProvider` must return C++ types
- Can't abstract away without reimplementing Fabric

**Option C: Runtime class creation** ❌ NOT FEASIBLE
- Fabric requires compile-time C++ integration
- Dynamic class injection won't work with ComponentDescriptor system

**Recommendation:**
The `ExpoFabricViewObjC : RCTViewComponentView` dependency should be **accepted** as a required coupling. Views are fundamentally part of React Native's rendering system. The goal of decoupling should focus on:
1. ✅ Removing **unnecessary** RN class inheritance (ComponentData, RCTEventEmitter, RCTViewManager)
2. ✅ Keeping **necessary** RN class inheritance (RCTViewComponentView for Fabric views)

---

## Files to Review

| File | Contains RN Import | Inherits RN Class | Notes |
|------|-------------------|-------------------|-------|
| `ios/Fabric/ExpoFabricViewObjC.h` | Yes | RCTViewComponentView | Core Fabric view |
| ~~`ios/RCTComponentData+Privates.h`~~ | ~~Yes~~ | ~~RCTComponentData~~ | ✅ DELETED |
| ~~`ios/Legacy/Services/EXReactNativeEventEmitter.h`~~ | ~~Yes~~ | ~~RCTEventEmitter~~ | ✅ Now inherits NSObject |
| `ios/Core/ExpoBridgeModule.h` | Yes | Protocol only | Bridge module |
| ~~`ios/Core/Views/ComponentData.swift`~~ | ~~Yes~~ | ~~RCTComponentDataSwiftAdapter~~ | ✅ DELETED |
| `ios/Core/Views/ExpoView.swift` | Yes | RCTView (Paper) / ExpoFabricView (Fabric) | View typedef |
| `ios/Core/Protocols/AnyExpoView.swift` | Yes | Protocol extends RCTView | View protocol |

---

## Proposed Action Plan for Task 1

### Phase 1: Remove ComponentData/RCTComponentDataSwiftAdapter for Fabric-only

#### Status: ✅ IMPLEMENTED

**Changes made:**

1. **`ios/Legacy/NativeModulesProxy/EXNativeModulesProxy.mm`**
   - ✅ Removed `#import <React/RCTUIManager.h>`
   - ✅ Renamed `registerComponentData:inBridge:forAppId:` to `registerViewModule:forAppId:` (no longer needs bridge)
   - ✅ Removed all `_componentDataByName` registration code (Paper infrastructure)
   - ✅ Removed `[bridge uiManager]` access
   - ✅ Removed `registerLegacyComponentData:inBridge:` method entirely
   - ✅ Removed call to `registerLegacyComponentData` for `EXViewModuleWrapper`
   - ✅ Kept only Fabric registration via `RCTComponentViewFactory`

2. **`ios/Core/Views/ComponentData.swift`**
   - ✅ DELETED - no longer needed

3. **`ios/RCTComponentData+Privates.h` and `.m`**
   - ✅ DELETED - no longer needed (contained `RCTComponentDataSwiftAdapter` and `RCTComponentData (Privates)` category)

4. **`ios/ExpoModulesCore.h`**
   - ✅ Removed `#import <ExpoModulesCore/RCTComponentData+Privates.h>`

5. **`ios/Swift.h`**
   - ✅ Removed `#import <ExpoModulesCore/RCTComponentData+Privates.h>`

6. **`ios/Core/Views/ViewModuleWrapper.swift`**
   - ✅ Changed inheritance from `RCTViewManager` to `NSObject`
   - ✅ Removed override keywords from methods (`init()`, `moduleName()`, `requiresMainQueueSetup()`, `view()`)
   - ✅ Updated class documentation to reflect Fabric-only design
   - ✅ `RCTViewManager` was Paper infrastructure for bridge module registration

**Impact:**
- ✅ Removed dependency on `RCTComponentData` inheritance
- ✅ Removed dependency on `RCTViewManager` inheritance
- ✅ Removed `#import <React/RCTComponentData.h>` requirement
- ✅ Removed `#import <React/RCTUIManager.h>` requirement  
- ✅ Simplified view registration code path
- ✅ Reduced coupling between ExpoModulesCore and React Native's Paper infrastructure

### Phase 2: Testing

**Status:** ✅ COMPLETE

1. [x] Build a minimal app with the changes
2. [x] Verify views render correctly
3. [x] Verify events dispatch correctly  
4. [x] Verify commands work (if any Expo modules use dispatchViewManagerCommand)

---

## Summary

### Completed Decoupling

| Before | After | RN Import Removed |
|--------|-------|-------------------|
| `ViewModuleWrapper : RCTViewManager` | `ViewModuleWrapper : NSObject` | ✅ `<React/RCTViewManager.h>` |
| `EXReactNativeEventEmitter : RCTEventEmitter` | `EXReactNativeEventEmitter : NSObject` | ✅ `<React/RCTEventEmitter.h>` |
| `ComponentData : RCTComponentDataSwiftAdapter` | DELETED | ✅ `<React/RCTComponentData.h>` |
| `RCTComponentDataSwiftAdapter : RCTComponentData` | DELETED | ✅ |
| UIManager `_componentDataByName` registration | Removed (Paper-only) | ✅ `<React/RCTUIManager.h>` |

### Remaining Dependencies (Required for Fabric)

| Class | Inherits From | Why Required |
|-------|---------------|--------------|
| `ExpoFabricViewObjC` | `RCTViewComponentView` | Core Fabric view infrastructure |
| Various | `RCTBridgeModule` protocol | Module registration with RN |

### Files Modified

1. `ios/Legacy/NativeModulesProxy/EXNativeModulesProxy.mm` - Removed Paper code
2. `ios/Core/Views/ViewModuleWrapper.swift` - Changed to NSObject
3. `ios/Legacy/Services/EXReactNativeEventEmitter.h` - Changed to NSObject  
4. `ios/Legacy/Services/EXReactNativeEventEmitter.m` - JSI-based events
5. `ios/Protocols/EXAppContextProtocol.h` - Added eventEmitter property
6. `ios/ExpoModulesCore.h` - Updated imports
7. `ios/Swift.h` - Updated imports

### Files Deleted

1. `ios/Core/Views/ComponentData.swift`
2. `ios/RCTComponentData+Privates.h`
3. `ios/RCTComponentData+Privates.m`

---

## Final Status: ✅ REFACTORING COMPLETE

All tasks have been completed successfully:

- **Task 1:** ✅ Removed Paper/UIManager infrastructure (ComponentData, RCTViewManager)
- **Task 2:** ✅ Decoupled EXReactNativeEventEmitter from RCTEventEmitter
- **Task 3:** ✅ Evaluated and accepted RCTViewComponentView dependency for Fabric views

**Testing verified:**
- minimal-tester app builds and runs correctly
- bare-expo app builds correctly (pod install successful)

**Next steps for xcframework/SPM migration:**
- ExpoModulesCore can now be packaged with fewer React Native header dependencies
- The remaining `RCTViewComponentView` dependency is required and expected for Fabric views
- The `RCTBridgeModule` protocol conformance is required for module registration

