import Testing
import ExpoModulesJSI

@Suite
@JavaScriptActor
struct JavaScriptBigIntTests {
  let runtime = JavaScriptRuntime()

  // MARK: - Creation Tests

  @Test
  func `create from Int64`() {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 9007199254740991)
    #expect(bigInt.isInt64() == true)
    #expect(bigInt.getInt64() == 9007199254740991)
  }

  @Test
  func `create from negative Int64`() {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: -9007199254740991)
    #expect(bigInt.isInt64() == true)
    #expect(bigInt.getInt64() == -9007199254740991)
  }

  @Test
  func `create from UInt64`() {
    let bigInt = JavaScriptBigInt(runtime, fromUint64: UInt64.max)
    #expect(bigInt.isUint64() == true)
    #expect(bigInt.getUint64() == UInt64.max)
  }

  @Test
  func `toString with decimal radix`() throws {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 255)
    let str = try bigInt.toString(radix: 10)
    #expect(str == "255")
  }

  @Test
  func `equality of same values`() {
    let bigInt1 = JavaScriptBigInt(runtime, fromInt64: 42)
    let bigInt2 = JavaScriptBigInt(runtime, fromInt64: 42)
    #expect((bigInt1 == bigInt2) == true)
  }

  @Test
  func `create JavaScriptValue from Int64 BigInt`() {
    let value = JavaScriptValue(runtime, bigInt: Int64(42))
    #expect(value.isBigInt() == true)
    #expect(value.isNumber() == false)
  }

  @Test
  func `evaluate BigInt literal`() throws {
    let value = try runtime.eval("42n")
    #expect(value.isBigInt() == true)
    #expect(value.getBigInt().getInt64() == 42)
  }

  @Test
  func `create from zero`() {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 0)
    #expect(bigInt.isInt64() == true)
    #expect(bigInt.isUint64() == true)
    #expect(bigInt.getInt64() == 0)
    #expect(bigInt.getUint64() == 0)
  }

  @Test
  func `create from Int64 max`() {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: Int64.max)
    #expect(bigInt.isInt64() == true)
    #expect(bigInt.getInt64() == Int64.max)
  }

  @Test
  func `create from Int64 min`() {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: Int64.min)
    #expect(bigInt.isInt64() == true)
    #expect(bigInt.getInt64() == Int64.min)
  }

  @Test
  func `create from decimal string`() throws {
    let bigInt = try JavaScriptBigInt(runtime, string: "12345")
    #expect(bigInt.getInt64() == 12345)
  }

  @Test
  func `create from negative decimal string`() throws {
    let bigInt = try JavaScriptBigInt(runtime, string: "-12345")
    #expect(bigInt.getInt64() == -12345)
  }

  @Test
  func `create from hexadecimal string`() throws {
    let bigInt = try JavaScriptBigInt(runtime, string: "0xFF")
    #expect(bigInt.getInt64() == 255)
  }

  @Test
  func `create from lowercase hexadecimal string`() throws {
    let bigInt = try JavaScriptBigInt(runtime, string: "0xff")
    #expect(bigInt.getInt64() == 255)
  }

  @Test
  func `create from binary string`() throws {
    let bigInt = try JavaScriptBigInt(runtime, string: "0b11111111")
    #expect(bigInt.getInt64() == 255)
  }

  @Test
  func `create from octal string`() throws {
    let bigInt = try JavaScriptBigInt(runtime, string: "0o377")
    #expect(bigInt.getInt64() == 255)
  }

  @Test
  func `create from very large decimal string`() throws {
    let bigInt = try JavaScriptBigInt(runtime, string: "123456789012345678901234567890")
    let str = try bigInt.toString()
    #expect(str == "123456789012345678901234567890")
  }

  @Test
  func `create from string with whitespace`() throws {
    let bigInt = try JavaScriptBigInt(runtime, string: "  42  ")
    #expect(bigInt.getInt64() == 42)
  }

  @Test
  func `create from string representing zero`() throws {
    let bigInt = try JavaScriptBigInt(runtime, string: "0")
    #expect(bigInt.getInt64() == 0)
  }

  @Test
  func `create from string beyond Int64 range`() throws {
    let bigInt = try JavaScriptBigInt(runtime, string: "9223372036854775808") // Int64.max + 1
    #expect(bigInt.isInt64() == false)
    let str = try bigInt.toString()
    #expect(str == "9223372036854775808")
  }

  @Test
  func `create from large hexadecimal string`() throws {
    let bigInt = try JavaScriptBigInt(runtime, string: "0xFFFFFFFFFFFFFFFF")
    let str = try bigInt.toString(radix: 16)
    #expect(str == "ffffffffffffffff")
  }

  @Test
  func `string initializer preserves exact value`() throws {
    let originalString = "999999999999999999999999999999"
    let bigInt = try JavaScriptBigInt(runtime, string: originalString)
    let str = try bigInt.toString()
    #expect(str == originalString)
  }

  // MARK: - Conversion Tests

  @Test
  func `asInt64 succeeds for values in range`() throws {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 12345)
    let value = try bigInt.asInt64()
    #expect(value == 12345)
  }

  @Test
  func `asInt64 throws when beyond Int64 range`() throws {
    let bigInt = try JavaScriptBigInt(runtime, string: "9223372036854775808") // Int64.max + 1
    #expect(throws: BigIntConversionError.self) {
      try bigInt.asInt64()
    }
  }

  @Test
  func `asUint64 succeeds for values in range`() throws {
    let bigInt = JavaScriptBigInt(runtime, fromUint64: 12345)
    let value = try bigInt.asUint64()
    #expect(value == 12345)
  }

  @Test
  func `negative value is not UInt64`() {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: -1)
    #expect(bigInt.isUint64() == false)
  }

  @Test
  func `asUint64 throws for negative values`() {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: -42)
    #expect(throws: BigIntConversionError.self) {
      try bigInt.asUint64()
    }
  }

  // MARK: - String Conversion Tests

  @Test
  func `toString with binary radix`() throws {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 255)
    let str = try bigInt.toString(radix: 2)
    #expect(str == "11111111")
  }

  @Test
  func `toString with hexadecimal radix`() throws {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 255)
    let str = try bigInt.toString(radix: 16)
    #expect(str == "ff")
  }

  @Test
  func `toString with octal radix`() throws {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 255)
    let str = try bigInt.toString(radix: 8)
    #expect(str == "377")
  }

  @Test
  func `toString with default radix`() throws {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 42)
    let str = try bigInt.toString()
    #expect(str == "42")
  }

  @Test
  func `toString with negative value`() throws {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: -42)
    let str = try bigInt.toString()
    #expect(str == "-42")
  }

  @Test
  func `toString with base 36`() throws {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 1234567890)
    let str = try bigInt.toString(radix: 36)
    #expect(str == "kf12oi")
  }

  @Test
  func `toString with radix too low throws error`() {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 42)
    #expect(throws: BigIntConversionError.self) {
      try bigInt.toString(radix: 1)
    }
  }

  @Test
  func `toString with radix too high throws error`() {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 42)
    #expect(throws: BigIntConversionError.self) {
      try bigInt.toString(radix: 37)
    }
  }

  @Test
  func `toString with radix 0 throws error`() {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 42)
    #expect(throws: BigIntConversionError.self) {
      try bigInt.toString(radix: 0)
    }
  }

  // MARK: - Equality Tests

  @Test
  func `inequality of different values`() {
    let bigInt1 = JavaScriptBigInt(runtime, fromInt64: 42)
    let bigInt2 = JavaScriptBigInt(runtime, fromInt64: 43)
    #expect((bigInt1 == bigInt2) == false)
  }

  @Test
  func `equality with zero from different sources`() {
    let bigInt1 = JavaScriptBigInt(runtime, fromInt64: 0)
    let bigInt2 = JavaScriptBigInt(runtime, fromUint64: 0)
    #expect((bigInt1 == bigInt2) == true)
  }

  @Test
  func `equality of large values`() {
    let value = Int64(9007199254740991)
    let bigInt1 = JavaScriptBigInt(runtime, fromInt64: value)
    let bigInt2 = JavaScriptBigInt(runtime, fromInt64: value)
    #expect((bigInt1 == bigInt2) == true)
  }

  @Test
  func `equality of negative values`() {
    let bigInt1 = JavaScriptBigInt(runtime, fromInt64: -42)
    let bigInt2 = JavaScriptBigInt(runtime, fromInt64: -42)
    #expect((bigInt1 == bigInt2) == true)
  }

  // MARK: - JavaScriptValue Integration Tests

  @Test
  func `create JavaScriptValue from UInt64 BigInt`() {
    let value = JavaScriptValue(runtime, bigInt: UInt64(42))
    #expect(value.isBigInt() == true)
    #expect(value.isNumber() == false)
  }

  @Test
  func `getBigInt from JavaScriptValue`() {
    let value = JavaScriptValue(runtime, bigInt: Int64(42))
    let bigInt = value.getBigInt()
    #expect(bigInt.getInt64() == 42)
  }

  @Test
  func `asBigInt from JavaScriptValue succeeds`() throws {
    let value = JavaScriptValue(runtime, bigInt: Int64(42))
    let bigInt = try value.asBigInt()
    #expect(bigInt.getInt64() == 42)
  }

  @Test
  func `asBigInt throws for non-BigInt value`() {
    let value = JavaScriptValue(runtime, 42)
    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try value.asBigInt()
    }
  }

  @Test
  func `kind returns bigint`() {
    let value = JavaScriptValue(runtime, bigInt: Int64(42))
    #expect(value.kind == .bigint)
  }

  @Test
  func `asValue converts BigInt to JavaScriptValue`() {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 42)
    let value = bigInt.asValue()
    #expect(value.isBigInt() == true)
    #expect(value.getBigInt().getInt64() == 42)
  }

  @Test
  func `BigInt value is not other types`() {
    let value = JavaScriptValue(runtime, bigInt: Int64(42))
    #expect(value.isUndefined() == false)
    #expect(value.isNull() == false)
    #expect(value.isBool() == false)
    #expect(value.isNumber() == false)
    #expect(value.isString() == false)
    #expect(value.isObject() == false)
    #expect(value.isSymbol() == false)
  }

  // MARK: - JavaScript Evaluation Tests

  @Test
  func `evaluate large BigInt literal`() throws {
    let value = try runtime.eval("9007199254740991n")
    #expect(value.isBigInt() == true)
    let bigInt = value.getBigInt()
    #expect(try bigInt.toString() == "9007199254740991")
  }

  @Test
  func `evaluate negative BigInt literal`() throws {
    let value = try runtime.eval("-42n")
    #expect(value.isBigInt() == true)
    #expect(value.getBigInt().getInt64() == -42)
  }

  @Test
  func `evaluate BigInt constructor from string`() throws {
    let value = try runtime.eval("BigInt('12345')")
    #expect(value.isBigInt() == true)
    #expect(value.getBigInt().getInt64() == 12345)
  }

  @Test
  func `evaluate BigInt constructor from number`() throws {
    let value = try runtime.eval("BigInt(42)")
    #expect(value.isBigInt() == true)
    #expect(value.getBigInt().getInt64() == 42)
  }

  @Test
  func `BigInt arithmetic addition in JavaScript`() throws {
    let value = try runtime.eval("10n + 32n")
    #expect(value.isBigInt() == true)
    #expect(value.getBigInt().getInt64() == 42)
  }

  @Test
  func `BigInt arithmetic subtraction in JavaScript`() throws {
    let value = try runtime.eval("50n - 8n")
    #expect(value.isBigInt() == true)
    #expect(value.getBigInt().getInt64() == 42)
  }

  @Test
  func `BigInt arithmetic multiplication in JavaScript`() throws {
    let value = try runtime.eval("6n * 7n")
    #expect(value.isBigInt() == true)
    #expect(value.getBigInt().getInt64() == 42)
  }

  @Test
  func `BigInt arithmetic division in JavaScript`() throws {
    let value = try runtime.eval("84n / 2n")
    #expect(value.isBigInt() == true)
    #expect(value.getBigInt().getInt64() == 42)
  }

  @Test
  func `BigInt comparison equals in JavaScript`() throws {
    let value = try runtime.eval("42n === 42n")
    #expect(value.getBool() == true)
  }

  @Test
  func `BigInt comparison not equals in JavaScript`() throws {
    let value = try runtime.eval("42n !== 43n")
    #expect(value.getBool() == true)
  }

  @Test
  func `BigInt comparison less than in JavaScript`() throws {
    let value = try runtime.eval("41n < 42n")
    #expect(value.getBool() == true)
  }

  @Test
  func `BigInt comparison greater than in JavaScript`() throws {
    let value = try runtime.eval("43n > 42n")
    #expect(value.getBool() == true)
  }

  // MARK: - Round-trip Tests

  @Test
  func `round-trip through JavaScript property`() throws {
    let original = JavaScriptBigInt(runtime, fromInt64: 9007199254740991)
    
    let global = runtime.global()
    global.setProperty("testBigInt", value: original.asValue())
    
    let retrieved = try runtime.eval("testBigInt").getBigInt()
    #expect((original == retrieved) == true)
  }

  @Test
  func `round-trip through JavaScript function`() throws {
    try runtime.eval("globalThis.identity = (x) => x")
    
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 42)
    let result = try runtime.global()
      .getPropertyAsFunction("identity")
      .call(arguments: bigInt.asValue())
      .getBigInt()
    
    #expect((result == bigInt) == true)
  }

  @Test
  func `pass BigInt to JavaScript function and operate`() throws {
    try runtime.eval("globalThis.double = (x) => x * 2n")
    
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 21)
    let result = try runtime.global()
      .getPropertyAsFunction("double")
      .call(arguments: bigInt.asValue())
      .getBigInt()
    
    #expect(result.getInt64() == 42)
  }

  @Test
  func `BigInt in object property`() throws {
    let obj = runtime.createObject()
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 42)
    obj.setProperty("value", value: bigInt.asValue())
    
    let retrieved = obj.getProperty("value").getBigInt()
    #expect((retrieved == bigInt) == true)
  }

  @Test
  func `BigInt in array element`() throws {
    let array = JavaScriptArray(runtime, length: 1)
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 42)
    array[0] = bigInt.asValue()
    
    let retrieved = try array.getValue(at: 0).getBigInt()
    #expect((retrieved == bigInt) == true)
  }

  // MARK: - Edge Cases

  @Test
  func `zero is both Int64 and UInt64`() {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 0)
    #expect(bigInt.isInt64() == true)
    #expect(bigInt.isUint64() == true)
  }

  @Test
  func `Int64 max is Int64 but may not be UInt64 representable`() {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: Int64.max)
    #expect(bigInt.isInt64() == true)
  }

  @Test
  func `UInt64 max may not be Int64 representable`() {
    let bigInt = JavaScriptBigInt(runtime, fromUint64: UInt64.max)
    #expect(bigInt.isUint64() == true)
    #expect(bigInt.isInt64() == false)
  }

  @Test
  func `toString preserves large numbers accurately`() throws {
    let value = Int64.max
    let bigInt = JavaScriptBigInt(runtime, fromInt64: value)
    let str = try bigInt.toString()
    #expect(str == "\(value)")
  }

  @Test
  func `toString with negative large numbers`() throws {
    let value = Int64.min
    let bigInt = JavaScriptBigInt(runtime, fromInt64: value)
    let str = try bigInt.toString()
    #expect(str == "\(value)")
  }

  // MARK: - JavaScriptRepresentable Conformance

  @Test
  func `BigInt conforms to JavaScriptRepresentable`() {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 42)
    let value = bigInt.toJavaScriptValue(in: runtime)
    #expect(value.isBigInt() == true)
  }

  @Test
  func `fromJavaScriptValue converts correctly`() {
    let value = JavaScriptValue(runtime, bigInt: Int64(42))
    let bigInt = JavaScriptBigInt.fromJavaScriptValue(value)
    #expect(bigInt.getInt64() == 42)
  }

  // MARK: - Error Cases

  @Test
  func `BigIntConversionError has descriptive messages`() {
    let error1 = BigIntConversionError.outOfInt64Range
    #expect(error1.description.contains("Int64"))
    
    let error2 = BigIntConversionError.outOfUint64Range
    #expect(error2.description.contains("UInt64"))
    
    let error3 = BigIntConversionError.invalidRadix(50)
    #expect(error3.description.contains("50"))
    #expect(error3.description.contains("2"))
    #expect(error3.description.contains("36"))
  }

  // MARK: - JavaScript Integration

  @Test
  func `typeof BigInt is bigint`() throws {
    let value = try runtime.eval("typeof 42n")
    #expect(value.getString() == "bigint")
  }

  @Test
  func `BigInt cannot be mixed with Number in arithmetic`() throws {
    #expect(throws: (any Error).self) {
      try runtime.eval("42n + 42")
    }
  }

  @Test
  func `BigInt can be compared with Number using comparison operators`() throws {
    let value = try runtime.eval("42n == 42")
    #expect(value.getBool() == true)
  }

  @Test
  func `BigInt strict equality with Number returns false`() throws {
    let value = try runtime.eval("42n === 42")
    #expect(value.getBool() == false)
  }

  @Test
  func `BigInt toString method in JavaScript`() throws {
    let value = try runtime.eval("42n.toString()")
    #expect(value.getString() == "42")
  }

  @Test
  func `BigInt toString with radix in JavaScript`() throws {
    let value = try runtime.eval("255n.toString(16)")
    #expect(value.getString() == "ff")
  }

  @Test
  func `BigInt valueOf in JavaScript`() throws {
    let value = try runtime.eval("Object(42n).valueOf()")
    #expect(value.isBigInt() == true)
    #expect(value.getBigInt().getInt64() == 42)
  }
}
