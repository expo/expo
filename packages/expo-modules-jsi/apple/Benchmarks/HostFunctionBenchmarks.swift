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

  /// Same as `noop host function`, but through the unowned-`this` closure form that
  /// macro-generated `@JS` functions bind to.
  @Test
  func `noop unowned-this host function`() async throws {
    try await benchmarkCase { runtime in
      let fn = runtime.createFunction("noop") {
        (this: borrowing JavaScriptUnownedValue, arguments: consuming JavaScriptValuesBuffer) in
        return .undefined
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval("(function(n) { for (var i = 0; i < n; i++) benchFn(); })").getFunction()
      try benchmark("host function: noop unowned-this", runtime: runtime) { iterations in
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

  // The integer codables, through the call shapes bindings use. A direct `Int.decode` is what the
  // macros emit for an `Int` argument; a generic decode specialized for `Int` is what generic code
  // such as `JavaScriptCallback` or a container runs; `Int?` is an optional `Int` argument.

  @Test
  func `host function adding two Ints, decoded directly`() async throws {
    try await benchmarkCase { runtime in
      let fn = runtime.createFunction("add") {
        [runtime] (this: borrowing JavaScriptUnownedValue, arguments: consuming JavaScriptValuesBuffer) in
        let a = try Int.decode(arguments.unownedValue(at: 0), in: runtime)
        let b = try Int.decode(arguments.unownedValue(at: 1), in: runtime)
        return try Int.encode(a + b, in: runtime)
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval(
        "(function(n) { for (var i = 0; i < n; i++) benchFn(3, 38); })"
      ).getFunction()
      try benchmark("host function: add two Ints, decoded directly", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }

  @Test
  func `host function adding two Ints, decoded generically`() async throws {
    try await benchmarkCase { runtime in
      let fn = runtime.createFunction("add") {
        [runtime] (this: borrowing JavaScriptUnownedValue, arguments: consuming JavaScriptValuesBuffer) in
        let a: Int = try genericDecode(arguments.unownedValue(at: 0), in: runtime)
        let b: Int = try genericDecode(arguments.unownedValue(at: 1), in: runtime)
        return try genericEncode(a + b, in: runtime)
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval(
        "(function(n) { for (var i = 0; i < n; i++) benchFn(3, 38); })"
      ).getFunction()
      try benchmark("host function: add two Ints, decoded generically", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }

  @Test
  func `host function adding two optional Ints`() async throws {
    try await benchmarkCase { runtime in
      let fn = runtime.createFunction("add") {
        [runtime] (this: borrowing JavaScriptUnownedValue, arguments: consuming JavaScriptValuesBuffer) in
        let a = try Int?.decode(arguments.unownedValue(at: 0), in: runtime) ?? 0
        let b = try Int?.decode(arguments.unownedValue(at: 1), in: runtime) ?? 0
        return try Int.encode(a + b, in: runtime)
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval(
        "(function(n) { for (var i = 0; i < n; i++) benchFn(3, 38); })"
      ).getFunction()
      try benchmark("host function: add two optional Ints", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }

  // MARK: - Unowned-this form with string arguments

  @Test
  func `concat two strings unowned-this`() async throws {
    try await benchmarkCase { runtime in
      let fn = runtime.createFunction("concat") {
        [runtime] (this: borrowing JavaScriptUnownedValue, arguments: consuming JavaScriptValuesBuffer) in
        let a = try String.decode(arguments.unownedValue(at: 0), in: runtime)
        let b = try String.decode(arguments.unownedValue(at: 1), in: runtime)
        return try String.encode(a + b, in: runtime)
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval(
        """
        (function(n) { for (var i = 0; i < n; i++) benchFn('expo ', 'modules'); })
        """
      ).getFunction()
      try benchmark("host function: concat two strings unowned-this", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }

  /// Like `concat two strings unowned-this`, with inputs and result longer than libc++'s 22-byte
  /// `std::string` inline capacity, so every `std::string` on the path has to allocate.
  @Test
  func `concat two long strings unowned-this`() async throws {
    try await benchmarkCase { runtime in
      let fn = runtime.createFunction("concat") {
        [runtime] (this: borrowing JavaScriptUnownedValue, arguments: consuming JavaScriptValuesBuffer) in
        let a = try String.decode(arguments.unownedValue(at: 0), in: runtime)
        let b = try String.decode(arguments.unownedValue(at: 1), in: runtime)
        return try String.encode(a + b, in: runtime)
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval(
        """
        (function(n) {
          for (var i = 0; i < n; i++) benchFn('expo modules are quite fast, ', 'and this string is also long');
        })
        """
      ).getFunction()
      try benchmark("host function: concat two long strings unowned-this", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }

  @Test
  func `concat two 256B strings unowned-this`() async throws {
    try await benchmarkCase { runtime in
      let fn = runtime.createFunction("concat") {
        [runtime] (this: borrowing JavaScriptUnownedValue, arguments: consuming JavaScriptValuesBuffer) in
        let a = try String.decode(arguments.unownedValue(at: 0), in: runtime)
        let b = try String.decode(arguments.unownedValue(at: 1), in: runtime)
        return try String.encode(a + b, in: runtime)
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval(
        "(function(n) { var a = 'a'.repeat(128); var b = 'b'.repeat(128); for (var i = 0; i < n; i++) benchFn(a, b); })"
      ).getFunction()
      try benchmark("host function: concat two 256B strings unowned-this", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }

  @Test
  func `concat two 4KB strings unowned-this`() async throws {
    try await benchmarkCase { runtime in
      let fn = runtime.createFunction("concat") {
        [runtime] (this: borrowing JavaScriptUnownedValue, arguments: consuming JavaScriptValuesBuffer) in
        let a = try String.decode(arguments.unownedValue(at: 0), in: runtime)
        let b = try String.decode(arguments.unownedValue(at: 1), in: runtime)
        return try String.encode(a + b, in: runtime)
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval(
        """
        (function(n) { var a = 'a'.repeat(2048); var b = 'b'.repeat(2048); for (var i = 0; i < n; i++) benchFn(a, b); })
        """
      ).getFunction()
      try benchmark("host function: concat two 4KB strings unowned-this", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }

  @Test
  func `concat two 4KB non-ASCII strings unowned-this`() async throws {
    try await benchmarkCase { runtime in
      let fn = runtime.createFunction("concat") {
        [runtime] (this: borrowing JavaScriptUnownedValue, arguments: consuming JavaScriptValuesBuffer) in
        let a = try String.decode(arguments.unownedValue(at: 0), in: runtime)
        let b = try String.decode(arguments.unownedValue(at: 1), in: runtime)
        return try String.encode(a + b, in: runtime)
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval(
        """
        (function(n) { var a = 'ą'.repeat(2048); var b = 'ą'.repeat(2048); for (var i = 0; i < n; i++) benchFn(a, b); })
        """
      ).getFunction()
      try benchmark("host function: concat two 4KB non-ASCII strings unowned-this", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }

  @Test
  func `concat two 12B non-ASCII strings unowned-this`() async throws {
    try await benchmarkCase { runtime in
      let fn = runtime.createFunction("concat") {
        [runtime] (this: borrowing JavaScriptUnownedValue, arguments: consuming JavaScriptValuesBuffer) in
        let a = try String.decode(arguments.unownedValue(at: 0), in: runtime)
        let b = try String.decode(arguments.unownedValue(at: 1), in: runtime)
        return try String.encode(a + b, in: runtime)
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval(
        "(function(n) { var a = 'ąęó'.repeat(2); var b = 'ąęó'.repeat(2); for (var i = 0; i < n; i++) benchFn(a, b); })"
      ).getFunction()
      try benchmark("host function: concat two 12B non-ASCII strings unowned-this", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }
}

/// Decodes through a generic function specialized at the call site, the way generic code reaches a
/// conformance.
@JavaScriptActor
private func genericDecode<T: JavaScriptDecodable>(
  _ value: borrowing JavaScriptUnownedValue,
  in runtime: borrowing JavaScriptRuntime
) throws -> T {
  return try T.decode(value, in: runtime)
}

/// Encodes through a generic function specialized at the call site.
@JavaScriptActor
private func genericEncode<T: JavaScriptEncodable>(_ value: T, in runtime: borrowing JavaScriptRuntime) throws
  -> JavaScriptValue
{
  return try T.encode(value, in: runtime)
}
