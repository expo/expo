// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

/// A host dispatch function that drops every task, so these cases measure only the work that
/// dropping a promise or callback does on the JavaScript thread. The dropped values stay registered
/// as long-lived objects until the runtime goes away.
private let dropHostTask:
  @convention(c) (
    UnsafeMutableRawPointer?, Int32, @escaping @convention(block) () -> Void
  ) -> Void = { _, _, _ in }

/// The opaque scheduler handle that the runtime gets. `dropHostTask` never reads it.
nonisolated(unsafe) private let hostSchedulerHandle = UnsafeMutableRawPointer.allocate(byteCount: 1, alignment: 1)

/// Like `benchmarkCase`, but the runtime has a host scheduler, as in React Native. Without one, a
/// standalone runtime runs scheduled work inline, so the release path for a value dropped on the
/// JavaScript thread is not the one that apps use.
private func hostScheduledBenchmarkCase(
  _ body: @escaping @JavaScriptActor (JavaScriptRuntime) throws -> Void
) async throws {
  try await Task(priority: .high) { @JavaScriptActor in
    let owningRuntime = JavaScriptRuntime()
    let runtime = owningRuntime.withUnsafePointee { runtimePointer in
      JavaScriptRuntime(
        unsafePointer: runtimePointer,
        scheduler: hostSchedulerHandle,
        dispatch: unsafeBitCast(dropHostTask, to: UnsafeRawPointer.self)
      )
    }
    try body(runtime)
    withExtendedLifetime(owningRuntime) {}
  }.value
}

/// Benchmarks for dropping promises and callbacks on the JavaScript thread of a runtime with a host
/// scheduler.
extension JSIBenchmarks {
  @Test
  func `create and drop deferred promise with a host scheduler`() async throws {
    try await hostScheduledBenchmarkCase { runtime in
      try benchmark("host scheduler: JavaScriptPromise create and drop", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try JavaScriptPromise(runtime)
        }
      }
    }
  }

  @Test
  func `create, resolve, and drop deferred promise with a host scheduler`() async throws {
    try await hostScheduledBenchmarkCase { runtime in
      try benchmark("host scheduler: JavaScriptPromise create, resolve, and drop", runtime: runtime) {
        iterations in
        for _ in 0..<iterations {
          let promise = try JavaScriptPromise(runtime)
          promise.resolve(42.0)
        }
      }
    }
  }

  @Test
  func `decode and drop callback with a host scheduler`() async throws {
    try await hostScheduledBenchmarkCase { runtime in
      let value = try runtime.eval("(function () {})")
      try benchmark("host scheduler: JavaScriptCallback decode and drop", runtime: runtime) { iterations in
        try value.withUnownedValue(in: runtime) { unownedValue in
          for _ in 0..<iterations {
            _ = try JavaScriptCallback.decode(unownedValue, in: runtime)
          }
        }
      }
    }
  }
}
