import ExpoModulesCore

/// A module written the way Expo modules are, with the `@ExpoModule` and `@JS` macros.
@ExpoModule("WindowsTester")
final class WindowsTesterModule: Module {
  @JS
  func greet(name: String) -> String {
    return "Hello, \(name)!"
  }

  @JS
  func add(_ a: Double, _ b: Double) -> Double {
    return a + b
  }

  /// Suspends off the JavaScript thread before it returns, so the result goes back through the
  /// runtime scheduler.
  @JS
  func multiplyAsync(_ a: Double, _ b: Double) async throws -> Double {
    try await Task.sleep(for: .milliseconds(10))
    return a * b
  }
}
