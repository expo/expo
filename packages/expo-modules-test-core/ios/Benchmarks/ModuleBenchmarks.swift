// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
@testable import ExpoModulesCore

/// Runs one benchmark case with a fresh app context. The app context's runtime runs scheduled work
/// synchronously, so the measured operations include the work they schedule.
public func appContextBenchmarkCase(_ body: @escaping @JavaScriptActor (AppContext) throws -> Void) async throws {
  try await benchmarkCase {
    try body(AppContext.create())
  }
}

/// Runs one benchmark case with a fresh app context that has the module from `makeModule` registered, so
/// JavaScript drivers reach it through `expo.modules`.
public func moduleBenchmarkCase<ModuleType: AnyModule>(
  _ makeModule: @escaping @JavaScriptActor (AppContext) -> ModuleType,
  _ body: @escaping @JavaScriptActor (ModuleType, JavaScriptRuntime) throws -> Void
) async throws {
  try await appContextBenchmarkCase { appContext in
    let module = makeModule(appContext)
    appContext.moduleRegistry.register(module: module, name: nil)
    try body(module, try appContext.runtime)
  }
}

/// A JavaScript function that runs `setup` once and then `body` `n` times, where `n` is its argument.
/// `body` can read the loop index `i` and anything that `setup` declares.
@JavaScriptActor
public func javaScriptDriver(
  _ runtime: JavaScriptRuntime,
  setup: String = "",
  body: String
) throws -> JavaScriptFunction {
  return try runtime.eval("(function(n) { \(setup) for (var i = 0; i < n; i++) { \(body) } })").getFunction()
}
