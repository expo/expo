// Copyright 2025-present 650 Industries. All rights reserved.

import CoreGraphics
import ExpoModulesJSI
import Testing

@Suite("JavaScriptCodable+Primitives")
@JavaScriptActor
struct JavaScriptCodablePrimitivesTests {
  let runtime = JavaScriptRuntime()

  // `Number.MAX_SAFE_INTEGER` (2^53 - 1): the largest integer a JS number round-trips exactly.
  static let maxSafeInteger: Int64 = (1 << 53) - 1
  // 2^53 + 1: the first integer above the safe range, which a JS number can no longer represent.
  static let firstUnsafeInteger: Int64 = (1 << 53) + 1

  // MARK: - Double

  @Test
  func `decodes a double from a JS number`() throws {
    let value = try runtime.eval("3.5")
    let decoded = try Double.decode(value, in: runtime)
    #expect(decoded == 3.5)
  }

  @Test
  func `encodes a double to a JS number`() throws {
    let encoded = try Double.encode(2.5, in: runtime)
    #expect(encoded.getDouble() == 2.5)
  }

  @Test
  func `round-trips a double`() throws {
    let value = try runtime.eval("42.25")
    let decoded = try Double.decode(value, in: runtime)
    let reencoded = try Double.encode(decoded, in: runtime)
    #expect(reencoded.getDouble() == 42.25)
  }

  // MARK: - Int

  @Test
  func `decodes and encodes an int`() throws {
    let decoded = try Int.decode(runtime.eval("42"), in: runtime)
    #expect(decoded == 42)
    let encoded = try Int.encode(-7, in: runtime)
    #expect(encoded.getInt() == -7)
  }

  // MARK: - Integer family (representative widths)

  @Test
  func `decodes and encodes narrow and unsigned integers`() throws {
    #expect(try Int8.decode(runtime.eval("127"), in: runtime) == 127)
    #expect(try UInt8.decode(runtime.eval("255"), in: runtime) == 255)
    #expect(try Int64.decode(runtime.eval("1024"), in: runtime) == 1024)
    #expect(try UInt32.encode(300, in: runtime).getInt() == 300)
  }

  // MARK: - 64-bit integers and BigInt

  @Test
  func `encodes Int64 and UInt64 as a JS bigint regardless of magnitude`() throws {
    let smallSigned = try Int64.encode(5, in: runtime)
    #expect(smallSigned.isBigInt())
    #expect(try smallSigned.asBigInt().asInt64() == 5)

    let smallUnsigned = try UInt64.encode(5, in: runtime)
    #expect(smallUnsigned.isBigInt())
    #expect(try smallUnsigned.asBigInt().asUint64() == 5)
  }

  @Test
  func `round-trips Int64 and UInt64 values beyond the JS safe-integer range losslessly`() throws {
    // A magnitude above the safe-integer range would silently lose precision if it went through `.number`.
    let signed = Self.firstUnsafeInteger
    let signedEncoded = try Int64.encode(signed, in: runtime)
    #expect(try Int64.decode(signedEncoded, in: runtime) == signed)

    let unsigned = UInt64.max
    let unsignedEncoded = try UInt64.encode(unsigned, in: runtime)
    #expect(try UInt64.decode(unsignedEncoded, in: runtime) == unsigned)
  }

  @Test
  func `decodes Int64 and UInt64 from a JS bigint`() throws {
    #expect(try Int64.decode(runtime.eval("-\(Self.firstUnsafeInteger)n"), in: runtime) == -Self.firstUnsafeInteger)
    #expect(try UInt64.decode(runtime.eval("\(UInt64.max)n"), in: runtime) == UInt64.max)
  }

  @Test
  func `Int and UInt encode as a JS number within the safe-integer range`() throws {
    let small = try Int.encode(5, in: runtime)
    #expect(small.isNumber())
    #expect(small.getInt() == 5)

    let unsigned = try UInt.encode(UInt(Self.maxSafeInteger), in: runtime)
    #expect(unsigned.isNumber())
    #expect(unsigned.getDouble() == Double(Self.maxSafeInteger))
  }

  @Test
  func `Int and UInt encode throws beyond the JS safe-integer range`() throws {
    // Above the safe-integer range a JS number can't represent the value exactly; Int maps to a number,
    // so encoding throws rather than silently losing precision. Int64/UInt64 carry such values as a bigint.
    #expect(throws: UnsafeIntegerException.self) {
      _ = try Int.encode(Int(Self.firstUnsafeInteger), in: runtime)
    }
    #expect(throws: UnsafeIntegerException.self) {
      _ = try UInt.encode(UInt.max, in: runtime)
    }
  }

  @Test
  func `Int and UInt decode from a JS bigint`() throws {
    #expect(try Int.decode(runtime.eval("\(Self.firstUnsafeInteger)n"), in: runtime) == Int(Self.firstUnsafeInteger))
    #expect(try UInt.decode(runtime.eval("\(Self.firstUnsafeInteger)n"), in: runtime) == UInt(Self.firstUnsafeInteger))
  }

  @Test
  func `64-bit decode throws instead of trapping on an out-of-range bigint`() throws {
    // 2^64 overflows UInt64, and a negative bigint can't be a UInt64.
    #expect(throws: BigIntOutOfRangeException.self) {
      _ = try UInt64.decode(runtime.eval("18446744073709551616n"), in: runtime)
    }
    #expect(throws: BigIntOutOfRangeException.self) {
      _ = try UInt64.decode(runtime.eval("-1n"), in: runtime)
    }
  }

  @Test
  func `rounds a fractional number when decoding an integer, matching v1`() throws {
    // v1 `DynamicNumberType` rounds before narrowing, so 1.6 -> 2 (not truncated to 1).
    #expect(try Int.decode(runtime.eval("1.6"), in: runtime) == 2)
    #expect(try Int.decode(runtime.eval("1.4"), in: runtime) == 1)
    #expect(try Int.decode(runtime.eval("-1.6"), in: runtime) == -2)
  }

  @Test
  func `integer decode throws instead of trapping on out-of-range or non-finite numbers`() throws {
    #expect(throws: IntegerOutOfRangeException.self) {
      _ = try Int8.decode(runtime.eval("200"), in: runtime)
    }
    #expect(throws: IntegerOutOfRangeException.self) {
      _ = try Int.decode(runtime.eval("1e308"), in: runtime)
    }
    #expect(throws: IntegerOutOfRangeException.self) {
      _ = try Int.decode(runtime.eval("NaN"), in: runtime)
    }
  }

  // MARK: - Float / CGFloat

  @Test
  func `decodes and encodes float and cgfloat`() throws {
    #expect(try Float.decode(runtime.eval("1.5"), in: runtime) == 1.5)
    #expect(try CGFloat.encode(2.5, in: runtime).getDouble() == 2.5)
  }

  // MARK: - Bool

  @Test
  func `decodes and encodes a bool`() throws {
    #expect(try Bool.decode(runtime.eval("true"), in: runtime) == true)
    #expect(try Bool.encode(false, in: runtime).getBool() == false)
  }

  // MARK: - String

  @Test
  func `decodes and encodes a string`() throws {
    #expect(try String.decode(runtime.eval("'expo'"), in: runtime) == "expo")
    #expect(try String.encode("modules", in: runtime).getString() == "modules")
  }

  // MARK: - Zero-copy borrowed-value overload

  @Test
  func `decodes primitives from a borrowed argument buffer`() throws {
    // Each `decode` resolves to the borrowing `JavaScriptUnownedValue` overload (the fast path the
    // macro emits for arguments), exercising the per-type overrides rather than the owning form.
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: 42, 3.5, "expo", true)
    #expect(try Int.decode(buffer.unownedValue(at: 0), in: runtime) == 42)
    #expect(try Double.decode(buffer.unownedValue(at: 1), in: runtime) == 3.5)
    #expect(try String.decode(buffer.unownedValue(at: 2), in: runtime) == "expo")
    #expect(try Bool.decode(buffer.unownedValue(at: 3), in: runtime) == true)
  }

  @Test
  func `decodes a 64-bit bigint from a borrowed argument buffer`() throws {
    // The borrowing overload reads a `number` zero-copy but has to materialize an owning value on the
    // `bigint` branch; this exercises that materialization path for a value beyond the safe-integer range.
    let buffer = JavaScriptValuesBuffer.allocate(
      in: runtime,
      with: JavaScriptValue(runtime, bigInt: Self.firstUnsafeInteger),
      JavaScriptValue(runtime, bigInt: UInt64.max)
    )
    #expect(try Int64.decode(buffer.unownedValue(at: 0), in: runtime) == Self.firstUnsafeInteger)
    #expect(try UInt64.decode(buffer.unownedValue(at: 1), in: runtime) == UInt64.max)
  }

  // MARK: - Error paths

  @Test
  func `decode throws on a wrong-typed primitive instead of crashing`() throws {
    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try String.decode(runtime.eval("42"), in: runtime)
    }
    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try Double.decode(runtime.eval("'not a number'"), in: runtime)
    }
    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try Bool.decode(runtime.eval("'true'"), in: runtime)
    }
  }
}
