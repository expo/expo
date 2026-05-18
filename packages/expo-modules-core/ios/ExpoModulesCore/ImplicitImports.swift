// Re-exports Foundation/UIKit into the ExpoModulesCore module so every Swift
// source file in this target sees `NSObject`, `URL`, `UIView`, `CGFloat`, etc.
// without an explicit `import`. Under CocoaPods these were visible transitively
// through React's umbrella; SwiftPM's stricter module semantics — especially
// with `internal import React` — hide them, so we restore the old behavior
// here instead of touching ~150 source files.

@_exported import Foundation
#if canImport(UIKit)
@_exported import UIKit
#endif

// ExpoModulesCoreObjC is the sibling Clang target that exposes the ObjC half of
// the module — protocols (`EXAppContextProtocol`, `EXConstantsInterface`, ...),
// fabric/SwiftUI base classes (`ExpoFabricViewObjC`, `SwiftUIVirtualViewObjC`),
// the `JavaScriptValue`/`@JavaScriptActor` JSI bindings, and `CoreModuleHelper`.
// ExpoModulesJSI is the prebuilt xcframework that exposes the C++/JSI bridge.
// Under CocoaPods these all lived in a single `ExpoModulesCore` module; SwiftPM
// splits them into separate modules, so we re-export them here to keep the
// public Swift API identical for downstream consumers.
@_exported import ExpoModulesCoreObjC
@_exported import ExpoModulesJSI
