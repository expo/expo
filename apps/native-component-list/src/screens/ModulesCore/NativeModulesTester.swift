internal import ExpoModulesCore

/// iOS-only inline module for exercising Expo Modules native behavior from
/// `native-component-list` screens that need a real native module to call into.
///
/// `suspendWithArguments` decodes large JS arguments and then stays suspended for
/// `delayMs`, so a batch of these calls can be left pending while the runtime is
/// reloaded. It backs the async-function teardown repro on `RuntimeTeardownScreen`
/// (https://github.com/expo/expo/issues/47716).
class NativeModulesTester: Module {
  public func definition() -> ModuleDefinition {
    AsyncFunction("suspendWithArguments") {
      (
        label: String,
        payload: [String: Any],
        items: [[String: Any]],
        delayMs: Int
      ) async throws -> String in
      try await Task.sleep(for: .milliseconds(max(delayMs, 0)))
      return "\(label):\(payload.count):\(items.count)"
    }
  }
}
