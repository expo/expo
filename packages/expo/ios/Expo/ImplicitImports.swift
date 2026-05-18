// Re-exports the sibling Clang target `ExpoObjC` so the Swift sources in this
// target see `ExpoReactNativeFactoryObjC` and other ObjC types without
// per-file imports. Same pattern as `ExpoModulesCore/ImplicitImports.swift`.

@_exported import Foundation
#if canImport(UIKit)
@_exported import UIKit
#endif

@_exported import ExpoObjC
