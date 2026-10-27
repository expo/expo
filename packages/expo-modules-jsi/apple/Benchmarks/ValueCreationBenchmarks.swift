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
      try benchmark("JavaScriptValue.undefined()", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = JavaScriptValue.undefined()
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

extension JSIBenchmarks {
  @Test
  func `emplace a Double into a values buffer`() async throws {
    try await benchmarkCase { runtime in
      let buffer = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 1)
      try benchmark("JavaScriptValuesBuffer.emplace(_:at:in:): Double", runtime: runtime) { iterations in
        for index in 0..<iterations {
          try buffer.emplace(Double(index), at: 0, in: runtime)
        }
      }
    }
  }

  @Test
  func `emplace an Int into a values buffer`() async throws {
    try await benchmarkCase { runtime in
      let buffer = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 1)
      try benchmark("JavaScriptValuesBuffer.emplace(_:at:in:): Int", runtime: runtime) { iterations in
        for index in 0..<iterations {
          try buffer.emplace(index, at: 0, in: runtime)
        }
      }
    }
  }

  @Test
  func `emplace a String into a values buffer`() async throws {
    try await benchmarkCase { runtime in
      let buffer = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 1)
      try benchmark("JavaScriptValuesBuffer.emplace(_:at:in:): String", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          try buffer.emplace("hello", at: 0, in: runtime)
        }
      }
    }
  }

  @Test
  func `emplace an optional Int into a values buffer`() async throws {
    try await benchmarkCase { runtime in
      let buffer = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 1)
      try benchmark("JavaScriptValuesBuffer.emplace(_:at:in:): Int?", runtime: runtime) { iterations in
        for index in 0..<iterations {
          try buffer.emplace(index % 2 == 0 ? index : nil, at: 0, in: runtime)
        }
      }
    }
  }

  @Test
  func `emplace a value through the default slot encode`() async throws {
    // `DefaultEncodedNumber` has no `encode(_:into:in:)`, so this measures the default implementation.
    try await benchmarkCase { runtime in
      let buffer = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 1)
      try benchmark("JavaScriptValuesBuffer.emplace(_:at:in:): DefaultEncodedNumber", runtime: runtime) {
        iterations in
        for index in 0..<iterations {
          try buffer.emplace(DefaultEncodedNumber(value: Double(index)), at: 0, in: runtime)
        }
      }
    }
  }
}

/// Encodes as a number through the default `encode(_:into:in:)`.
private struct DefaultEncodedNumber: JavaScriptEncodable {
  let value: Double

  static func encode(_ value: DefaultEncodedNumber, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    return .number(value.value)
  }
}

// MARK: - Objects built property by property

/// Builds an object with four number and four string properties, like a record's `encode`, once with
/// values encoded into `JavaScriptValue`s and once with values encoded into each property's engine value.
extension JSIBenchmarks {
  @Test
  func `set eight properties from encoded values`() async throws {
    try await benchmarkCase { runtime in
      let names = (0..<8).map { JavaScriptPropNameID(runtime, string: "p\($0)") }
      try benchmark("JavaScriptObject.setProperty(_:value:): 4 numbers, 4 strings", runtime: runtime) { iterations in
        for index in 0..<iterations {
          let object = runtime.createObject()
          for property in 0..<4 {
            object.setProperty(names[property], value: try Double.encode(Double(index + property), in: runtime))
          }
          for property in 4..<8 {
            object.setProperty(names[property], value: try String.encode("value", in: runtime))
          }
        }
      }
    }
  }

  @Test
  func `set eight properties through slots`() async throws {
    try await benchmarkCase { runtime in
      let names = (0..<8).map { JavaScriptPropNameID(runtime, string: "p\($0)") }
      try benchmark("JavaScriptObject.setProperty(_:encoding:): 4 numbers, 4 strings", runtime: runtime) {
        iterations in
        for index in 0..<iterations {
          let object = runtime.createObject()
          for property in 0..<4 {
            try object.setProperty(names[property], encoding: Double(index + property))
          }
          for property in 4..<8 {
            try object.setProperty(names[property], encoding: "value")
          }
        }
      }
    }
  }
}
