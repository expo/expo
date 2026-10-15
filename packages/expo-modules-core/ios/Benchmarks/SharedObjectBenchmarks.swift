// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

/// Benchmarks for JavaScript using a `@SharedObject` class: creating instances and calling their `@JS`
/// members. A JavaScript driver runs the measured loop. Read every result against
/// `JS: empty driver loop`.
extension Benchmarks {
  @Test
  func `@SharedObject: new instance`() async throws {
    try await sharedObjectBenchmarkCase(body: "new Counter(i);") { run, runtime in
      try benchmark("@SharedObject: new instance", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `@SharedObject: method call`() async throws {
    try await sharedObjectBenchmarkCase(body: "counter.increment(1);") { run, runtime in
      try benchmark("@SharedObject: method call", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `@SharedObject: property read`() async throws {
    try await sharedObjectBenchmarkCase(body: "counter.current;") { run, runtime in
      try benchmark("@SharedObject: property read", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }
}

@SharedObject
private final class BenchmarkCounter: SharedObject {
  private var value: Int

  @JS
  init(value: Int) {
    self.value = value
  }

  @JS
  func increment(by amount: Int) -> Int {
    value += amount
    return value
  }

  @JS
  var current: Int {
    return value
  }
}

@ExpoModule(classes: [BenchmarkCounter.self])
private final class SharedObjectBenchmarkModule: Module {}

/// Runs one case with `SharedObjectBenchmarkModule` registered and a JavaScript driver that runs `body`
/// in a loop, with the class in `Counter` and one instance in `counter`.
private func sharedObjectBenchmarkCase(
  body: String,
  _ measure: @escaping @JavaScriptActor (borrowing JavaScriptFunction, JavaScriptRuntime) throws -> Void
) async throws {
  try await moduleBenchmarkCase { appContext in
    return SharedObjectBenchmarkModule(appContext: appContext)
  } _: { _, runtime in
    let run = try javaScriptDriver(
      runtime,
      setup: "var Counter = expo.modules.SharedObjectBenchmarkModule.BenchmarkCounter; var counter = new Counter(0);",
      body: body
    )
    try measure(run, runtime)
  }
}
