// Copyright 2026-present 650 Industries. All rights reserved.

internal import ExpoModulesCore
internal import ExpoObserveInterface
import Foundation

/// Exposes the native part of the example library to the example screen.
@ExpoModule
final class ObserveIntegrationExample: Module {
  override func didCreate() {
    // A real library registers earlier, for example from an app delegate subscriber, so its integration starts at
    // launch. An inline module has no subscriber, so the example registers when its module is created.
    ExampleObserveIntegration.register()
  }

  /// Whether the native integration is set up.
  @JS
  var isNativeIntegrationSetUp: Bool {
    return ExampleLibraryLog.shared.hasListener
  }

  /// Logs a message in the native part of the example library. Returns whether the integration recorded it.
  @JS
  func log(level: String, message: String) -> Bool {
    return ExampleLibraryLog.shared.log(level: level, message: message)
  }
}

/// The log of the native part of the example library. The integration listens to it.
final class ExampleLibraryLog: @unchecked Sendable {
  static let shared = ExampleLibraryLog()

  private let lock = NSLock()
  private var listener: (@Sendable (String, String) -> Bool)?

  var hasListener: Bool {
    return lock.withLock { listener != nil }
  }

  func setListener(_ listener: (@Sendable (String, String) -> Bool)?) {
    lock.withLock {
      self.listener = listener
    }
  }

  func log(level: String, message: String) -> Bool {
    let listener = lock.withLock { self.listener }
    return listener?(level, message) ?? false
  }
}

/// The native integration of the example library, written the way a library that integrates itself with EAS Observe
/// writes it with expo-observe-interface.
final class ExampleObserveIntegration: ObserveIntegration {
  private static let registration: Void = ObserveIntegrationRegistry.shared.register(ExampleObserveIntegration())

  static func register() {
    _ = registration
  }

  let name = "observe-integration-example"

  func setup(config: [String: Any], observe: any ObserveClient) throws -> (() -> Void)? {
    let reportWarnings = config["reportWarnings"] as? Bool ?? false
    ExampleLibraryLog.shared.setListener { level, message in
      if level == "error" {
        return observe.reportError(
          ObserveErrorReport(type: "observe-integration-example.native-error", message: message, code: "ExampleError")
        )
      }
      guard reportWarnings else {
        return false
      }
      return observe.reportWarning(
        ObserveWarningReport(
          name: "observe-integration-example.native-warning",
          displayName: "Example native warning",
          message: message,
          code: "ExampleWarning"
        )
      )
    }
    return {
      ExampleLibraryLog.shared.setListener(nil)
    }
  }
}
