internal import jsi

/**
 A Swift representation of a JavaScript BigInt. BigInt is a built-in JavaScript object that provides
 a way to represent whole numbers larger than 2^53 - 1, which is the largest number JavaScript can
 reliably represent with the Number primitive.

 BigInts can be created from 64-bit integers (signed or unsigned) and can be converted back to
 64-bit integers with optional validation to ensure no data loss.

 ## Example Usage
 ```swift
 let runtime = JavaScriptRuntime()

 // Create from Int64
 let bigInt = JavaScriptBigInt(runtime, fromInt64: 9007199254740991)

 // Create from UInt64
 let largeBigInt = JavaScriptBigInt(runtime, fromUint64: UInt64.max)

 // Convert to string with different radixes
 let decimal = bigInt.toString(radix: 10)  // "9007199254740991"
 let hex = bigInt.toString(radix: 16)      // "1fffffffffffff"
 let binary = bigInt.toString(radix: 2)    // "11111111111111111111111111111111111111111111111111111"

 // Safe conversion back to integers
 if bigInt.isInt64() {
   let value = try bigInt.asInt64()  // Safe conversion
 }

 // Equality testing
 let another = JavaScriptBigInt(runtime, fromInt64: 9007199254740991)
 if bigInt == another {
   print("BigInts are equal")
 }
 ```

 - Note: BigInt values cannot be mixed with Number values in arithmetic operations in JavaScript.
 You must explicitly convert between them.
 */
public struct JavaScriptBigInt: JavaScriptType, Sendable, ~Copyable {
  internal let runtime: JavaScriptRuntime
  internal var pointee: facebook.jsi.BigInt

  /**
   Creates a BigInt from an existing JSI BigInt.
   */
  internal init(_ runtime: JavaScriptRuntime, _ bigInt: consuming facebook.jsi.BigInt) {
    self.runtime = runtime
    self.pointee = bigInt
  }

  /**
   Creates a BigInt from a signed 64-bit integer.

   - Parameters:
     - runtime: The JavaScript runtime
     - value: The Int64 value to convert to BigInt
   */
  public init(_ runtime: JavaScriptRuntime, fromInt64 value: Int64) {
    self.runtime = runtime
    self.pointee = facebook.jsi.BigInt.fromInt64(runtime.pointee, value)
  }

  /**
   Creates a BigInt from an unsigned 64-bit integer.

   - Parameters:
     - runtime: The JavaScript runtime
     - value: The UInt64 value to convert to BigInt
   */
  public init(_ runtime: JavaScriptRuntime, fromUint64 value: UInt64) {
    self.runtime = runtime
    self.pointee = facebook.jsi.BigInt.fromUint64(runtime.pointee, value)
  }

  /**
   Creates a BigInt from a string representation.

   This initializer parses a string to create a BigInt value. The string can be in decimal format
   or use prefixes for other bases (e.g., "0x" for hexadecimal, "0o" for octal, "0b" for binary).
   Unlike the numeric initializers which are limited to 64-bit ranges, this initializer can create
   BigInt values of arbitrary size.

   - Parameters:
     - runtime: The JavaScript runtime
     - string: A string representation of the number to parse. Can include:
       - Decimal: "12345" or "-12345"
       - Hexadecimal: "0xFF" or "0xff"
       - Octal: "0o77"
       - Binary: "0b1111"

   - Throws: An error if the string cannot be parsed as a valid BigInt. This can occur if:
     - The string is empty
     - The string contains invalid characters
     - The string format is not recognized by JavaScript's `BigInt()` constructor

   - Note: This method calls JavaScript's `BigInt()` constructor internally, so it follows
     the same parsing rules as JavaScript. Whitespace is trimmed automatically.

   ## Examples
   ```swift
   // Create from decimal string
   let bigInt1 = try JavaScriptBigInt(runtime, string: "123456789012345678901234567890")

   // Create from hexadecimal string
   let bigInt2 = try JavaScriptBigInt(runtime, string: "0xFFFFFFFFFFFFFFFF")

   // Create from binary string
   let bigInt3 = try JavaScriptBigInt(runtime, string: "0b11111111")

   // Create from octal string
   let bigInt4 = try JavaScriptBigInt(runtime, string: "0o777")

   // Negative values
   let bigInt5 = try JavaScriptBigInt(runtime, string: "-999999999999999999")

   // Handle errors
   do {
     let bigInt = try JavaScriptBigInt(runtime, string: "invalid")
   } catch {
     print("Failed to parse BigInt: \(error)")
   }
   ```
   */
  public init(_ runtime: JavaScriptRuntime, string: String) throws {
    self.runtime = runtime
    self.pointee = try runtime
      .global()
      .getPropertyAsFunction("BigInt")
      .call(arguments: string)
      .pointee
      .getBigInt(runtime.pointee)
  }

  // MARK: - Conversions to Integer Types

  /**
   Returns whether this BigInt can be losslessly converted to a signed 64-bit integer.

   If this returns `true`, calling `asInt64()` will succeed without throwing.

   - Returns: `true` if the BigInt fits in an Int64 range, `false` otherwise
   */
  public func isInt64() -> Bool {
    return pointee.isInt64(runtime.pointee)
  }

  /**
   Returns whether this BigInt can be losslessly converted to an unsigned 64-bit integer.

   If this returns `true`, calling `asUint64()` will succeed without throwing.

   - Returns: `true` if the BigInt fits in a UInt64 range, `false` otherwise
   */
  public func isUint64() -> Bool {
    return pointee.isUint64(runtime.pointee)
  }

  /**
   Returns this BigInt truncated to a signed 64-bit integer.

   This method always succeeds but may lose data if the BigInt is outside the Int64 range.
   Use `isInt64()` first to check if conversion is lossless, or use `asInt64()` for safe conversion.

   - Returns: The truncated Int64 value
   */
  public func getInt64() -> Int64 {
    return pointee.getInt64(runtime.pointee)
  }

  /**
   Returns this BigInt truncated to an unsigned 64-bit integer.

   This method always succeeds but may lose data if the BigInt is outside the UInt64 range.
   Use `isUint64()` first to check if conversion is lossless, or use `asUint64()` for safe conversion.

   - Returns: The truncated UInt64 value
   */
  public func getUint64() -> UInt64 {
    return pointee.getUint64(runtime.pointee)
  }

  /**
   Returns this BigInt as a signed 64-bit integer, throwing an error if the conversion is lossy.

   Use this method when you need to ensure no data is lost during conversion.

   - Returns: The Int64 value
   - Throws: `BigIntConversionError` if the BigInt is outside the Int64 range
   */
  public func asInt64() throws -> Int64 {
    guard isInt64() else {
      throw BigIntConversionError.outOfInt64Range
    }
    return getInt64()
  }

  /**
   Returns this BigInt as an unsigned 64-bit integer, throwing an error if the conversion is lossy.

   Use this method when you need to ensure no data is lost during conversion.

   - Returns: The UInt64 value
   - Throws: `BigIntConversionError` if the BigInt is outside the UInt64 range
   */
  public func asUint64() throws -> UInt64 {
    guard isUint64() else {
      throw BigIntConversionError.outOfUint64Range
    }
    return getUint64()
  }

  // MARK: - String Conversion

  /**
   Converts this BigInt to a string representation in the specified radix (base).

   The radix can be any value from 2 to 36. Common bases include:
   - 2: Binary
   - 8: Octal
   - 10: Decimal (default)
   - 16: Hexadecimal

   - Parameter radix: The base to use for string conversion (2-36). Defaults to 10.
   - Returns: A string representation of the BigInt
   - Throws: `BigIntConversionError.invalidRadix` if radix is not in the valid range

   ## Examples
   ```swift
   let bigInt = JavaScriptBigInt(runtime, fromInt64: 255)
   bigInt.toString(radix: 2)   // "11111111"
   bigInt.toString(radix: 8)   // "377"
   bigInt.toString(radix: 10)  // "255"
   bigInt.toString(radix: 16)  // "ff"
   ```
   */
  public func toString(radix: Int = 10) throws -> String {
    guard radix >= 2 && radix <= 36 else {
      throw BigIntConversionError.invalidRadix(radix)
    }
    let jsiString = pointee.toString(runtime.pointee, Int32(radix))
    return String(jsiString.utf16(runtime.pointee))
  }

  // MARK: - JavaScriptType

  public func asValue() -> JavaScriptValue {
    return JavaScriptValue(runtime, facebook.jsi.Value(runtime.pointee, pointee))
  }

  /**
   Returns the BigInt as a `facebook.jsi.Value` instance.
   */
  internal func asJSIValue() -> facebook.jsi.Value {
    return facebook.jsi.Value(runtime.pointee, pointee)
  }

  // MARK: - Equality

  /**
   Tests whether two BigInts are strictly equal (represent the same numeric value).

   This performs a strict equality check as defined by JavaScript's `===` operator for BigInts.

   - Parameters:
     - lhs: The first BigInt to compare
     - rhs: The second BigInt to compare
   - Returns: `true` if the BigInts represent the same value, `false` otherwise
   */
  public static func == (lhs: borrowing JavaScriptBigInt, rhs: borrowing JavaScriptBigInt) -> Bool {
    return facebook.jsi.BigInt.strictEquals(lhs.runtime.pointee, lhs.pointee, rhs.pointee)
  }
}

extension JavaScriptBigInt: JavaScriptRepresentable {
  public static func fromJavaScriptValue(_ value: JavaScriptValue) -> JavaScriptBigInt {
    return value.getBigInt()
  }

  public func toJavaScriptValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    return asValue()
  }
}

extension JavaScriptBigInt: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.Runtime) -> JavaScriptBigInt {
    fatalError("Not implemented: Use JavaScriptValue.getBigInt() instead")
  }

  func toJSIValue(in runtime: facebook.jsi.Runtime) -> facebook.jsi.Value {
    return asJSIValue()
  }
}

// MARK: - Errors

/**
 Errors that can occur when working with BigInt conversions.
 */
public enum BigIntConversionError: Error, CustomStringConvertible {
  /// The BigInt value is outside the valid Int64 range (-2^63 to 2^63-1)
  case outOfInt64Range

  /// The BigInt value is outside the valid UInt64 range (0 to 2^64-1)
  case outOfUint64Range

  /// The radix parameter is not in the valid range (2-36)
  case invalidRadix(Int)

  public var description: String {
    switch self {
    case .outOfInt64Range:
      return "BigInt value is outside the Int64 range (-9223372036854775808 to 9223372036854775807)"
    case .outOfUint64Range:
      return "BigInt value is outside the UInt64 range (0 to 18446744073709551615)"
    case .invalidRadix(let radix):
      return "Invalid radix \(radix). Radix must be between 2 and 36."
    }
  }
}
