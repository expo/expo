// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

/// Benchmarks for JavaScript using `@JSClass` classes: calling a `@JS` method, which reads the native instance from the
/// native state of `this`, and emitting from JavaScript to an instance of a `BaseEventEmitter` subclass. A JavaScript
/// driver runs the measured loop, so read these results against `JS: empty driver loop`.
///
/// `method call after a native emit` calls the method of an instance that emitted an event from Swift once before.
/// Read it against `@JSClass event emitter: method call`.
extension Benchmarks {
  @Test
  func `@JSClass: method call`() async throws {
    try await jsClassBenchmarkCase(body: "point.getX();") { run, runtime in
      try benchmark("@JSClass: method call", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `@JSClass event emitter: method call`() async throws {
    try await jsClassBenchmarkCase(body: "emitter.getInterval();") { run, runtime in
      try benchmark("@JSClass event emitter: method call", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `@JSClass event emitter: method call after a native emit`() async throws {
    try await jsClassBenchmarkCase(setup: "emitter.tick();", body: "emitter.getInterval();") { run, runtime in
      try benchmark("@JSClass event emitter: method call after a native emit", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `@JSClass event emitter: emit from JS to 1 listener`() async throws {
    try await jsClassBenchmarkCase(body: "emitter.emit('tick', i);") { run, runtime in
      try benchmark("@JSClass event emitter: emit from JS to 1 listener", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }
}

@JSClass
private final class BenchmarkPoint {
  private let x: Double

  @JS
  init(x: Double) {
    self.x = x
  }

  @JS
  func getX() -> Double {
    return x
  }
}

@JSClass
private final class BenchmarkEmitter: BaseEventEmitter {
  private let interval: Double

  @Event
  var onTick: () -> Void

  @JS
  init(interval: Double) {
    self.interval = interval
    super.init()
  }

  @JS
  func getInterval() -> Double {
    return interval
  }

  @JS
  func tick() {
    onTick()
  }
}

@ExpoModule(classes: [BenchmarkPoint.self, BenchmarkEmitter.self])
private final class JSClassBenchmarkModule: Module {}

/// Runs one case with `JSClassBenchmarkModule` registered, a point and an emitter with one no-op listener of the `tick`
/// event in JavaScript.
private func jsClassBenchmarkCase(
  setup: String = "",
  body: String,
  _ measure: @escaping @JavaScriptActor (borrowing JavaScriptFunction, JavaScriptRuntime) throws -> Void
) async throws {
  try await moduleBenchmarkCase { appContext in
    return JSClassBenchmarkModule(appContext: appContext)
  } _: { _, runtime in
    try runtime.eval(
      """
      var m = expo.modules.JSClassBenchmarkModule;
      var point = new m.BenchmarkPoint(1);
      var emitter = new m.BenchmarkEmitter(1);
      emitter.addListener('tick', () => {});
      \(setup)
      """
    )
    let run = try javaScriptDriver(runtime, body: body)
    try measure(run, runtime)
  }
}
