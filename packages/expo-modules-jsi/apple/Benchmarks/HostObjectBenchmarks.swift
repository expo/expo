// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

/// End-to-end benchmarks for JavaScript accessing properties of a Swift host object. A JavaScript
/// driver function runs the measured loop, so each operation covers the engine's dispatch to the host
/// object, handing the property name to Swift, and the result or assigned value crossing back.
extension JSIBenchmarks {
  @Test
  func `host object property get`() async throws {
    try await benchmarkCase { runtime in
      let hostObject = runtime.createHostObject(get: { _ in
        return JavaScriptValue.number(42)
      })
      runtime.global().setProperty("benchHostObject", value: hostObject)
      let driver = try runtime.eval("(function(n) { for (var i = 0; i < n; i++) benchHostObject.answer; })")
        .getFunction()
      try benchmark("host object: get", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }

  @Test
  func `host object property get with long name`() async throws {
    try await benchmarkCase { runtime in
      let hostObject = runtime.createHostObject(get: { _ in
        return JavaScriptValue.number(42)
      })
      runtime.global().setProperty("benchHostObject", value: hostObject)
      // Longer than the 22-byte inline capacity of libc++'s `std::string`.
      let driver = try runtime.eval(
        "(function(n) { for (var i = 0; i < n; i++) benchHostObject.aPropertyNameLongerThanTheInlineCapacity; })"
      ).getFunction()
      try benchmark("host object: get, 40B name", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }

  @Test
  func `host object property set`() async throws {
    try await benchmarkCase { runtime in
      let hostObject = runtime.createHostObject(
        get: { _ in .undefined },
        set: { _, _ in }
      )
      runtime.global().setProperty("benchHostObject", value: hostObject)
      let driver = try runtime.eval("(function(n) { for (var i = 0; i < n; i++) benchHostObject.answer = i; })")
        .getFunction()
      try benchmark("host object: set", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }
}
