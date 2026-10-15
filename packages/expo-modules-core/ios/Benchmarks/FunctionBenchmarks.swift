// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

/// Benchmarks for JavaScript calling `@JS` functions of an `@ExpoModule`. A JavaScript driver runs the
/// measured loop, so each operation covers the full call: the engine's call dispatch, decoding the
/// arguments, the Swift function and encoding the result. Read every result against
/// `JS: empty driver loop`.
extension Benchmarks {
  @Test
  func `JS: empty driver loop`() async throws {
    try await functionBenchmarkCase(body: "") { run, runtime in
      try benchmark("JS: empty driver loop", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `@JS: no arguments`() async throws {
    try await functionBenchmarkCase(body: "m.noop();") { run, runtime in
      try benchmark("@JS: no arguments", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `@JS: two Double arguments and a Double result`() async throws {
    try await functionBenchmarkCase(body: "m.add(i, 2);") { run, runtime in
      try benchmark("@JS: two Double arguments and a Double result", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `@JS: String argument and result`() async throws {
    try await functionBenchmarkCase(body: "m.echo('hello');") { run, runtime in
      try benchmark("@JS: String argument and result", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `@JS: record argument and result`() async throws {
    try await functionBenchmarkCase(setup: "var point = { x: 1, y: 2 };", body: "m.mirror(point);") { run, runtime in
      try benchmark("@JS: record argument and result", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `@JS: async function with no arguments`() async throws {
    try await functionBenchmarkCase(body: "m.noopAsync();") { run, runtime in
      try benchmark("@JS: async function with no arguments", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }
}

@Record
private struct BenchmarkPoint {
  var x: Double = 0
  var y: Double = 0
}

@ExpoModule
private final class FunctionBenchmarkModule: Module {
  @JS
  func noop() {}

  @JS
  func add(a: Double, b: Double) -> Double {
    return a + b
  }

  @JS
  func echo(text: String) -> String {
    return text
  }

  @JS
  func mirror(point: BenchmarkPoint) -> BenchmarkPoint {
    return BenchmarkPoint(x: point.y, y: point.x)
  }

  @JS
  @JavaScriptActor
  func noopAsync() async {}
}

/// Runs one case with `FunctionBenchmarkModule` registered and a JavaScript driver that runs `body` in a
/// loop, with the module in `m`.
private func functionBenchmarkCase(
  setup: String = "",
  body: String,
  _ measure: @escaping @JavaScriptActor (borrowing JavaScriptFunction, JavaScriptRuntime) throws -> Void
) async throws {
  try await moduleBenchmarkCase { appContext in
    return FunctionBenchmarkModule(appContext: appContext)
  } _: { _, runtime in
    let run = try javaScriptDriver(runtime, setup: "var m = expo.modules.FunctionBenchmarkModule; \(setup)", body: body)
    try measure(run, runtime)
  }
}
