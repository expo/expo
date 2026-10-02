// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

/// Micro benchmarks for creating `JavaScriptValue`s from Swift. They isolate the cost of the
/// wrapper itself (allocation, runtime handle, `jsi::Value` move) from engine work, so a change to
/// the wrapper's representation shows up here before it shows up in the end-to-end host function
/// benchmarks.
extension JSIBenchmarks {
  /// A runtime-free number: no engine call, so the measured time is the wrapper alone.
  @Test
  func `runtime-free number value`() async throws {
    try await benchmarkCase { runtime in
      try benchmark("JavaScriptValue.number(_:)", runtime: runtime) { iterations in
        for index in 0..<iterations {
          _ = JavaScriptValue.number(Double(index))
        }
      }
    }
  }

  /// A number tied to a runtime: adds the handle retain and release to the runtime-free case.
  @Test
  func `number value in runtime`() async throws {
    try await benchmarkCase { runtime in
      try benchmark("JavaScriptValue(runtime, Double)", runtime: runtime) { iterations in
        for index in 0..<iterations {
          _ = JavaScriptValue(runtime, Double(index))
        }
      }
    }
  }

  @Test
  func `bool value in runtime`() async throws {
    try await benchmarkCase { runtime in
      try benchmark("JavaScriptValue(runtime, Bool)", runtime: runtime) { iterations in
        for index in 0..<iterations {
          _ = JavaScriptValue(runtime, index & 1 == 0)
        }
      }
    }
  }

  /// `undefined` is the return value of every void host function.
  @Test
  func `undefined value`() async throws {
    try await benchmarkCase { runtime in
      try benchmark("JavaScriptValue.undefined", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = JavaScriptValue.undefined
        }
      }
    }
  }

  /// Wrapping an object as a value: an engine clone of the handle plus the wrapper.
  @Test
  func `object to value`() async throws {
    try await benchmarkCase { runtime in
      let object = try runtime.eval("({ answer: 42 })").getObject()
      try benchmark("JavaScriptObject.asValue()", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = object.asValue()
        }
      }
    }
  }

  /// Copying a pointer value: an engine clone of the handle plus a new wrapper.
  @Test
  func `copy object value`() async throws {
    try await benchmarkCase { runtime in
      let value = try runtime.eval("({ answer: 42 })")
      try benchmark("JavaScriptValue.copy(): object", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = value.copy()
        }
      }
    }
  }

  /// Copying a runtime-free number: no engine involvement, so this is the wrapper alone.
  @Test
  func `copy number value`() async throws {
    try await benchmarkCase { runtime in
      let value = JavaScriptValue.number(42)
      try benchmark("JavaScriptValue.copy(): number", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = value.copy()
        }
      }
    }
  }
}
