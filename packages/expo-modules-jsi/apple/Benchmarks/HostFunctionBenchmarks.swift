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
        return .undefined()
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
        return .undefined()
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval("(function(n) { for (var i = 0; i < n; i++) benchFn(); })").getFunction()
      try benchmark("host function: noop unowned-this", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }

  /// Same as `noop unowned-this host function`, but through the `Void` closure form that
  /// leaves the result slot untouched.
  @Test
  func `noop void unowned-this host function`() async throws {
    try await benchmarkCase { runtime in
      let fn = runtime.createFunction("noop") {
        (this: borrowing JavaScriptUnownedValue, arguments: consuming JavaScriptValuesBuffer) in
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval("(function(n) { for (var i = 0; i < n; i++) benchFn(); })").getFunction()
      try benchmark("host function: noop void unowned-this", runtime: runtime) { iterations in
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

  // The integer codables, as bindings call them: `Int.decode` for an `Int` argument and `Int?.decode`
  // for an optional one.

  @Test
  func `host function adding two Ints`() async throws {
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
      try benchmark("host function: add two Ints", runtime: runtime) { iterations in
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

  // MARK: - Many arguments

  // Bindings decode each argument through its own `JavaScriptUnownedValue`, so these show how the
  // per-argument cost adds up in functions with longer argument lists.

  @Test
  func `host function summing eight Ints`() async throws {
    try await benchmarkCase { runtime in
      let fn = runtime.createFunction("sum") {
        [runtime] (this: borrowing JavaScriptUnownedValue, arguments: consuming JavaScriptValuesBuffer) in
        var sum = 0
        for index in 0..<8 {
          sum += try Int.decode(arguments.unownedValue(at: index), in: runtime)
        }
        return try Int.encode(sum, in: runtime)
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval(
        "(function(n) { for (var i = 0; i < n; i++) benchFn(1, 2, 3, 4, 5, 6, 7, 8); })"
      ).getFunction()
      try benchmark("host function: sum eight Ints", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }

  /// Eight arguments of the types a module function commonly takes, each decoded as a separate
  /// statement like the code that the `@JS` macro generates.
  @Test
  func `host function with eight mixed arguments`() async throws {
    try await benchmarkCase { runtime in
      let fn = runtime.createFunction("mixed") {
        [runtime] (this: borrowing JavaScriptUnownedValue, arguments: consuming JavaScriptValuesBuffer) in
        let a = try String.decode(arguments.unownedValue(at: 0), in: runtime)
        let b = try Int.decode(arguments.unownedValue(at: 1), in: runtime)
        let c = try Double.decode(arguments.unownedValue(at: 2), in: runtime)
        let d = try Bool.decode(arguments.unownedValue(at: 3), in: runtime)
        let e = try String?.decode(arguments.unownedValue(at: 4), in: runtime)
        let f = try Int?.decode(arguments.unownedValue(at: 5), in: runtime)
        let g = try Double.decode(arguments.unownedValue(at: 6), in: runtime)
        let h = try Bool.decode(arguments.unownedValue(at: 7), in: runtime)
        let count = a.utf8.count + b + Int(c) + (d ? 1 : 0) + (e?.utf8.count ?? 0) + (f ?? 0) + Int(g) + (h ? 1 : 0)
        return try Int.encode(count, in: runtime)
      }
      runtime.global().setProperty("benchFn", value: fn)
      let driver = try runtime.eval(
        "(function(n) { for (var i = 0; i < n; i++) benchFn('expo', 2, 3.5, true, null, 6, 7.5, false); })"
      ).getFunction()
      try benchmark("host function: eight mixed arguments", runtime: runtime) { iterations in
        _ = try driver.call(arguments: iterations)
      }
    }
  }
}
