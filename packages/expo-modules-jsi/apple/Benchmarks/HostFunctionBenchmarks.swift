// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

/// End-to-end benchmarks for JavaScript calling into Swift host functions.
/// A JavaScript driver function runs the measured loop, so each operation covers
/// the full round trip: the engine's call dispatch, argument decoding in Swift,
/// and encoding the result back to JavaScript.
extension JSIBenchmarks {
  /// Measures the raw JavaScript loop that drives the other host function benchmarks,
  /// so their results can be read relative to the loop's own overhead.
  @Test
  func `empty JS loop`() async throws {
    try await benchmarkCase { runtime in
      let driver = try runtime.eval("(function(n) { for (var i = 0; i < n; i++); })").getFunction()
      try benchmark("host function: empty driver loop", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }

  @Test
  func `noop host function`() async throws {
    try await benchmarkCase { runtime in
      let fn = runtime.createFunction("noop") { _, _ in
        return .undefined
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval("(function(n) { for (var i = 0; i < n; i++) benchFn(); })").getFunction()
      try benchmark("host function: noop", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }

  @Test
  func `host function concatenating two strings`() async throws {
    try await benchmarkCase { runtime in
      let fn = runtime.createFunction("concat") { [runtime] _, arguments in
        let a = try arguments[0].asString()
        let b = try arguments[1].asString()
        return JavaScriptValue(runtime, a + b)
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval(
        "(function(n) { for (var i = 0; i < n; i++) benchFn('expo ', 'modules'); })"
      ).getFunction()
      try benchmark("host function: concat two strings", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }

  @Test
  func `host function adding two numbers`() async throws {
    try await benchmarkCase { runtime in
      let fn = runtime.createFunction("add") { [runtime] _, arguments in
        let a = try arguments[0].asDouble()
        let b = try arguments[1].asDouble()
        return JavaScriptValue(runtime, a + b)
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval(
        "(function(n) { for (var i = 0; i < n; i++) benchFn(3.5, 38.5); })"
      ).getFunction()
      try benchmark("host function: add two numbers", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }
}
