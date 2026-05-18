// Re-exports the sibling Clang target `ExpoModulesWorkletsObjC` so every Swift
// source in this target sees `SerializableValueType`, `WorkletRuntimeHandle`,
// `JavaScriptSerializable`, etc. without explicit imports — mirroring the
// single-module shape this code had under CocoaPods. Same pattern as the
// `ExpoModulesCore` target's own `ImplicitImports.swift`.

@_exported import Foundation
#if canImport(UIKit)
@_exported import UIKit
#endif

@_exported import ExpoModulesWorkletsObjC
