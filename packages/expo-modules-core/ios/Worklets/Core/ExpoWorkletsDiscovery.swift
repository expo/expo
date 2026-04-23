// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/// Locates the optional `ExpoWorkletsProvider` at runtime. Mirrors the
/// `NSClassFromString` pattern used by `ExpoCamera`'s
/// `BarcodeScanner.discoverProvider()` — when
/// `ExpoModulesWorkletsAdapter` isn't linked (i.e. `react-native-worklets`
/// isn't installed), `sharedProvider` is `nil` and callers can
/// short-circuit.
@objc(EXWorkletsDiscovery)
public final class ExpoWorkletsDiscovery: NSObject {
  private static let providerClassName = "ExpoWorkletsBridgeProvider"

  /// Initialized exactly once at first access and never mutated
  /// afterwards, so the `nonisolated(unsafe)` mark is accurate.
  @objc public static nonisolated(unsafe) let sharedProvider: ExpoWorkletsProvider? = {
    guard
      let cls = NSClassFromString(providerClassName) as? NSObject.Type,
      let instance = cls.init() as? ExpoWorkletsProvider
    else {
      return nil
    }
    return instance
  }()
}
