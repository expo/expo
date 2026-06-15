// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@testable import ExpoModulesCore

@Suite("JavaScriptCodable+Primitives")
@JavaScriptActor
struct JavaScriptCodablePrimitivesTests {
  let appContext = AppContext.create()

  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  // MARK: - Double

  @Test
  func `decodes a double from a JS number`() throws {
    let runtime = try runtime
    let value = try runtime.eval("3.5")
    let decoded = try Double.decode(value, appContext: appContext, runtime: runtime)
    #expect(decoded == 3.5)
  }

  @Test
  func `encodes a double to a JS number`() throws {
    let runtime = try runtime
    let encoded = try Double.encode(2.5, appContext: appContext, runtime: runtime)
    #expect(encoded.getDouble() == 2.5)
  }

  @Test
  func `round-trips a double`() throws {
    let runtime = try runtime
    let value = try runtime.eval("42.25")
    let decoded = try Double.decode(value, appContext: appContext, runtime: runtime)
    let reencoded = try Double.encode(decoded, appContext: appContext, runtime: runtime)
    #expect(reencoded.getDouble() == 42.25)
  }

  // MARK: - Int

  @Test
  func `decodes and encodes an int`() throws {
    let runtime = try runtime
    let decoded = try Int.decode(runtime.eval("42"), appContext: appContext, runtime: runtime)
    #expect(decoded == 42)
    let encoded = try Int.encode(-7, appContext: appContext, runtime: runtime)
    #expect(encoded.getInt() == -7)
  }

  // MARK: - Integer family (representative widths)

  @Test
  func `decodes and encodes narrow and unsigned integers`() throws {
    let runtime = try runtime
    #expect(try Int8.decode(runtime.eval("127"), appContext: appContext, runtime: runtime) == 127)
    #expect(try UInt8.decode(runtime.eval("255"), appContext: appContext, runtime: runtime) == 255)
    #expect(try Int64.decode(runtime.eval("1024"), appContext: appContext, runtime: runtime) == 1024)
    #expect(try UInt32.encode(300, appContext: appContext, runtime: runtime).getInt() == 300)
  }

  @Test
  func `rounds a fractional number when decoding an integer, matching v1`() throws {
    // v1 `DynamicNumberType` rounds before narrowing, so 1.6 -> 2 (not truncated to 1).
    let runtime = try runtime
    #expect(try Int.decode(runtime.eval("1.6"), appContext: appContext, runtime: runtime) == 2)
    #expect(try Int.decode(runtime.eval("1.4"), appContext: appContext, runtime: runtime) == 1)
    #expect(try Int.decode(runtime.eval("-1.6"), appContext: appContext, runtime: runtime) == -2)
  }

  @Test
  func `integer decode throws instead of trapping on out-of-range or non-finite numbers`() throws {
    let runtime = try runtime
    #expect(throws: IntegerOutOfRangeException.self) {
      _ = try Int8.decode(runtime.eval("200"), appContext: appContext, runtime: runtime)
    }
    #expect(throws: IntegerOutOfRangeException.self) {
      _ = try Int.decode(runtime.eval("1e308"), appContext: appContext, runtime: runtime)
    }
    #expect(throws: IntegerOutOfRangeException.self) {
      _ = try Int.decode(runtime.eval("NaN"), appContext: appContext, runtime: runtime)
    }
  }

  // MARK: - Float / CGFloat

  @Test
  func `decodes and encodes float and cgfloat`() throws {
    let runtime = try runtime
    #expect(try Float.decode(runtime.eval("1.5"), appContext: appContext, runtime: runtime) == 1.5)
    #expect(try CGFloat.encode(2.5, appContext: appContext, runtime: runtime).getDouble() == 2.5)
  }

  // MARK: - Bool

  @Test
  func `decodes and encodes a bool`() throws {
    let runtime = try runtime
    #expect(try Bool.decode(runtime.eval("true"), appContext: appContext, runtime: runtime) == true)
    #expect(try Bool.encode(false, appContext: appContext, runtime: runtime).getBool() == false)
  }

  // MARK: - String

  @Test
  func `decodes and encodes a string`() throws {
    let runtime = try runtime
    #expect(try String.decode(runtime.eval("'expo'"), appContext: appContext, runtime: runtime) == "expo")
    #expect(try String.encode("modules", appContext: appContext, runtime: runtime).getString() == "modules")
  }

  // MARK: - Zero-copy borrowed-value overload

  @Test
  func `decodes primitives from a borrowed argument buffer`() throws {
    // Each `decode` resolves to the borrowing `JavaScriptUnownedValue` overload (the fast path the
    // macro emits for arguments), exercising the per-type overrides rather than the owning form.
    let runtime = try runtime
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: 42, 3.5, "expo", true)
    #expect(try Int.decode(buffer.unownedValue(at: 0), appContext: appContext, runtime: runtime) == 42)
    #expect(try Double.decode(buffer.unownedValue(at: 1), appContext: appContext, runtime: runtime) == 3.5)
    #expect(try String.decode(buffer.unownedValue(at: 2), appContext: appContext, runtime: runtime) == "expo")
    #expect(try Bool.decode(buffer.unownedValue(at: 3), appContext: appContext, runtime: runtime) == true)
  }

  // MARK: - Error paths

  @Test
  func `decode throws on a wrong-typed primitive instead of crashing`() throws {
    let runtime = try runtime
    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try String.decode(runtime.eval("42"), appContext: appContext, runtime: runtime)
    }
    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try Double.decode(runtime.eval("'not a number'"), appContext: appContext, runtime: runtime)
    }
    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try Bool.decode(runtime.eval("'true'"), appContext: appContext, runtime: runtime)
    }
  }
}
