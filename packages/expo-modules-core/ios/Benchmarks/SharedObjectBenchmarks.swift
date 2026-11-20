// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

/// Benchmarks for JavaScript using a `@SharedObject` class: creating, releasing and collecting instances,
/// reading their IDs, passing them to and getting them from `@JS` functions, and calling their `@JS` members.
/// A JavaScript driver runs the measured loop, so read these results against `JS: empty driver loop`.
///
/// Notes on reading the results:
/// - `new instance and garbage collection` adds one full collection to each sample and spreads its cost over
///   the instances created in the sample. It shows whether collecting shared objects got cheaper, not the
///   exact cost of finalizing one instance.
/// - `existing instance returned from a function` includes decoding the argument, which
///   `instance passed as an argument` measures alone.
/// - The `emit` cases emit from Swift in a loop, without the JavaScript driver. Read
///   `emit: Int payload from a @SharedObject` against `emit: Int payload`, which emits the same payload from a
///   module, and the other `@SharedObject` emit cases against it.
/// - `with a listener in another runtime too` attaches a second runtime, which runs scheduled work on the calling
///   thread like the main runtime here, so each emit includes the dispatch in both runtimes.
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
  func `@SharedObject: new instance and release`() async throws {
    try await sharedObjectBenchmarkCase(body: "new Counter(i).release();") { run, runtime in
      try benchmark("@SharedObject: new instance and release", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `@SharedObject: new instance and garbage collection`() async throws {
    try await sharedObjectBenchmarkCase(body: "new Counter(i);") { run, runtime in
      try benchmark("@SharedObject: new instance and garbage collection", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
        runtime.collectGarbage()
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
  func `@SharedObject: new instance and ID read`() async throws {
    try await sharedObjectBenchmarkCase(body: "new Counter(i).__expo_shared_object_id__;") { run, runtime in
      try benchmark("@SharedObject: new instance and ID read", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `@SharedObject: ID read`() async throws {
    try await sharedObjectBenchmarkCase(body: "counter.__expo_shared_object_id__;") { run, runtime in
      try benchmark("@SharedObject: ID read", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `@SharedObject: instance passed as an argument`() async throws {
    try await sharedObjectBenchmarkCase(body: "m.readCounter(counter);") { run, runtime in
      try benchmark("@SharedObject: instance passed as an argument", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `@SharedObject: existing instance returned from a function`() async throws {
    try await sharedObjectBenchmarkCase(body: "m.echoCounter(counter);") { run, runtime in
      try benchmark("@SharedObject: existing instance returned from a function", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `emit: Int payload from a @SharedObject`() async throws {
    try await counterEventBenchmarkCase(listenerCount: 1) { counter, runtime in
      try benchmark("emit: Int payload from a @SharedObject", runtime: runtime) { iterations in
        for index in 0..<iterations {
          counter.emit(event: "count", payload: index)
        }
      }
    }
  }

  @Test
  func `emit: Int payload from a @SharedObject without listeners`() async throws {
    try await counterEventBenchmarkCase(listenerCount: 0) { counter, runtime in
      try benchmark("emit: Int payload from a @SharedObject without listeners", runtime: runtime) { iterations in
        for index in 0..<iterations {
          counter.emit(event: "count", payload: index)
        }
      }
    }
  }

  @Test
  func `emit: Int payload from a @SharedObject to 5 listeners`() async throws {
    try await counterEventBenchmarkCase(listenerCount: 5) { counter, runtime in
      try benchmark("emit: Int payload from a @SharedObject to 5 listeners", runtime: runtime) { iterations in
        for index in 0..<iterations {
          counter.emit(event: "count", payload: index)
        }
      }
    }
  }

  @Test
  func `emit: Int payload from a @SharedObject with a listener in another runtime too`() async throws {
    try await counterEventBenchmarkCase(listenerCount: 1) { counter, runtime in
      let otherRuntime = JavaScriptRuntime()
      try counter.appContext?.attach(runtime: otherRuntime)
      try otherRuntime.eval(
        "var counter = expo.SharedObject.__resolveInWorklet(\(counter.sharedObjectId))",
        "counter.addListener('count', () => {})"
      )
      try benchmark("emit: Int payload from a @SharedObject with a listener in another runtime too", runtime: runtime) {
        iterations in
        for index in 0..<iterations {
          counter.emit(event: "count", payload: index)
        }
      }
    }
  }

  @Test
  func `emit: Int payload from a @SharedObject through @Event(.inline)`() async throws {
    try await counterEventBenchmarkCase(listenerCount: 1) { counter, runtime in
      try benchmark("emit: Int payload from a @SharedObject through @Event(.inline)", runtime: runtime) { iterations in
        for index in 0..<iterations {
          counter.onCount(index)
        }
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

  @Event(.inline)
  var onCount: (Int) -> Void

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

  @JS
  func readCounter(counter: BenchmarkCounter) -> Int {
    return counter.current
  }

  @JS
  func echoCounter(counter: BenchmarkCounter) -> BenchmarkCounter {
    return counter
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

/// Runs one case with `SharedObjectBenchmarkModule` registered and a counter in JavaScript that has
/// `listenerCount` no-op listeners of the `count` event. `body` gets the native counter.
private func counterEventBenchmarkCase(
  listenerCount: Int,
  _ body: @escaping @JavaScriptActor (BenchmarkCounter, JavaScriptRuntime) throws -> Void
) async throws {
  try await moduleBenchmarkCase { appContext in
    return SharedObjectBenchmarkModule(appContext: appContext)
  } _: { _, runtime in
    try runtime.eval(
      "var counter = new expo.modules.SharedObjectBenchmarkModule.BenchmarkCounter(0)",
      "for (var k = 0; k < \(listenerCount); k++) { counter.addListener('count', () => {}); }"
    )
    let counterObject = try runtime.eval("counter").asObject()
    try body(try SharedObject.native(from: counterObject, as: BenchmarkCounter.self), runtime)
  }
}
