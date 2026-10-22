// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

/// Benchmarks for JavaScript using a `@SharedObject` class: creating instances, getting them from a `@JS`
/// function and calling their `@JS` members. A JavaScript driver runs the measured loop. Read every result
/// against `JS: empty driver loop`.
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
  func `@SharedObject: instance returned from a function`() async throws {
    try await sharedObjectBenchmarkCase(body: "m.makeCounter(i);") { run, runtime in
      try benchmark("@SharedObject: instance returned from a function", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `SharedRef without a class: returned from a function`() async throws {
    try await sharedObjectBenchmarkCase(body: "m.makeRef(i);") { run, runtime in
      try benchmark("SharedRef without a class: returned from a function", runtime: runtime) { iterations in
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
private final class SharedObjectBenchmarkModule: Module {
  @JS
  func makeCounter(value: Int) -> BenchmarkCounter {
    return BenchmarkCounter(value: value)
  }

  @JS
  func makeRef(value: Int) -> SharedRef<Int> {
    return SharedRef(value)
  }
}

/// Runs one case with `SharedObjectBenchmarkModule` registered and a JavaScript driver that runs `body`
/// in a loop, with the module in `m`, the class in `Counter` and one instance in `counter`.
private func sharedObjectBenchmarkCase(
  body: String,
  _ measure: @escaping @JavaScriptActor (borrowing JavaScriptFunction, JavaScriptRuntime) throws -> Void
) async throws {
  try await moduleBenchmarkCase { appContext in
    return SharedObjectBenchmarkModule(appContext: appContext)
  } _: { _, runtime in
    let run = try javaScriptDriver(
      runtime,
      setup: "var m = expo.modules.SharedObjectBenchmarkModule; var Counter = m.BenchmarkCounter; var counter = new Counter(0);",
      body: body
    )
    try measure(run, runtime)
  }
}
