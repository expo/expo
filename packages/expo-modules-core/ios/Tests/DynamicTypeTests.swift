// Copyright 2022-present 650 Industries. All rights reserved.

import CoreGraphics
import Testing

@testable import ExpoModulesCore

@Suite("DynamicType")
struct DynamicTypeTests {
  let appContext: AppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = AppContext.create()
  }

  // MARK: - DynamicRawType

  @Suite("DynamicRawType")
  struct DynamicRawTypeTests {
    let appContext: AppContext

    init() {
      appContext = AppContext.create()
    }

    @Test
    func `is created`() {
      #expect(~Any.self is DynamicRawType<Any>)
      #expect(~Bool.self is DynamicRawType<Bool>)
      #expect(~DynamicRawTypeTests.self is DynamicRawType<DynamicRawTypeTests>)
    }

    @Test
    func `casts succeeds`() throws {
      #expect(try (~String.self).cast("expo", appContext: appContext) as? String == "expo")
      #expect(try (~Double.self).cast(2.1, appContext: appContext) as? Double == 2.1)
      #expect(try (~Bool.self).cast(false, appContext: appContext) as? Bool == false)
    }

    @Test
    func `throws NullCastException`() {
      let value: Bool? = nil

      #expect(throws: Conversions.NullCastException<Bool>.self) {
        try (~Bool.self).cast(value as Any, appContext: appContext)
      }
    }

    @Test
    func `throws CastingException`() {
      #expect(throws: Conversions.CastingException<String>.self) {
        try (~String.self).cast(true, appContext: appContext)
      }
    }

    @Test
    func `wraps is true`() {
      #expect((~Double.self ~> Double.self) == true)
      #expect((~Bool.self ~> Bool.self) == true)
      #expect((~DynamicTypeTests.self ~> DynamicTypeTests.self) == true)
    }

    @Test
    func `wraps is false`() {
      #expect((~Double.self !~> Bool.self) == true)
      #expect((~Bool.self !~> Double.self) == true)
      #expect((~DynamicTypeTests.self !~> DynamicRawTypeTests.self) == true)
    }

    @Test
    func `equals is true`() {
      #expect((~Int.self == ~Int.self) == true)
      #expect((~Double.self == ~Double.self) == true)
      #expect((~Bool.self == ~Bool.self) == true)
      #expect((~DynamicRawTypeTests.self == ~DynamicRawTypeTests.self) == true)
    }

    @Test
    func `equals is false`() {
      #expect((~Int.self != ~String.self) == true)
      #expect((~String.self != ~CGSize.self) == true)
      #expect((~Bool.self != ~Promise.self) == true)
    }
  }

  // MARK: - DynamicNumberType

  @Suite("DynamicNumberType")
  struct DynamicNumberTypeTests {
    let appContext: AppContext

    init() {
      appContext = AppContext.create()
    }

    @Test
    func `is created`() {
      #expect(~Double.self is DynamicNumberType<Double>)
      #expect(~Int32.self is DynamicNumberType<Int32>)
      #expect(~CGFloat.self is DynamicNumberType<CGFloat>)
    }

    @Test
    func `casts from the same numeric type`() throws {
      // integer literal (Int) -> Int
      #expect(try (~Int.self).cast(7, appContext: appContext) as? Int == 7)
      // Int16 -> Int16
      #expect(try (~Int16.self).cast(Int16(5), appContext: appContext) as? Int16 == Int16(5))
      // float literal (Double) -> Double
      #expect(try (~Double.self).cast(3.14, appContext: appContext) as? Double == 3.14)
      // Float64 -> Float64
      #expect(try (~Float64.self).cast(Float64(1.61), appContext: appContext) as? Float64 == Float64(1.61))
    }

    @Test
    func `casts from different numeric type`() throws {
      // integer literal (Int) -> Int64
      #expect(try (~Int64.self).cast(11, appContext: appContext) as? Int64 == Int64(11))
      // integer literal (Int) -> Double
      #expect(try (~Double.self).cast(37, appContext: appContext) as? Double == 37.0)
      // float literal (Double) -> Int (schoolbook rounding)
      #expect(try (~Int.self).cast(21.8, appContext: appContext) as? Int == 22)
      // float literal (Double) -> Float64
      #expect(try (~Float64.self).cast(6.6, appContext: appContext) as? Float64 == Float64(6.6))
    }

    @Test
    func `casts from JS value`() throws {
      #expect(try (~Double.self).cast(jsValue: .number(12.34), appContext: appContext) as? Double == 12.34)
      #expect(try (~Int.self).cast(jsValue: .number(0.8), appContext: appContext) as? Int == 1)
    }
  }

  // MARK: - DynamicStringType

  @Suite("DynamicStringType")
  struct DynamicStringTypeTests {
    let appContext: AppContext
    var runtime: ExpoRuntime {
      get throws {
        try appContext.runtime
      }
    }

    init() {
      appContext = AppContext.create()
    }

    @Test
    func `is created`() {
      #expect(~String.self is DynamicStringType)
    }

    @Test
    func `casts`() throws {
      #expect(try (~String.self).cast("foo", appContext: appContext) as? String == "foo")
    }

    @Test
    func `casts from JS value`() throws {
      #expect(try (~String.self).cast(jsValue: .string("bar", runtime: runtime), appContext: appContext) as? String == "bar")
    }
  }

  // MARK: - DynamicArrayType

  @Suite("DynamicArrayType")
  struct DynamicArrayTypeTests {
    let appContext: AppContext

    init() {
      appContext = AppContext.create()
    }

    @Test
    func `is created`() {
      #expect(~[Double].self is DynamicArrayType)
      #expect(~[String?].self is DynamicArrayType)
      #expect(~[[Int]].self is DynamicArrayType)
    }

    @Test
    func `casts succeeds`() throws {
      #expect(try (~[Double].self).cast([1.2, 3.4], appContext: appContext) as? [Double] == [1.2, 3.4])
      #expect(try (~[[String]].self).cast([["hello", "expo"]], appContext: appContext) as? [[String]] == [["hello", "expo"]])
    }

    @Test
    func `casts from JS value`() throws {
      let appContext = AppContext.create()
      let jsValue = try appContext.runtime.eval("([1.2, 3.4])")
      #expect(try (~[Double].self).cast(jsValue: jsValue, appContext: appContext) as? [Double] == [1.2, 3.4])
    }

    @Test
    func `casts arrays`() throws {
      let value = 9.9
      let anyValue = [value] as [Any]
      let result = try (~[Double].self).cast(anyValue, appContext: appContext) as! [Any]

      #expect(result is [Double])
      #expect(result as? [Double] == [value])
    }

    @Test
    func `arrayizes single element`() throws {
      // The dynamic array type can arrayize the single element
      // if only the array element's dynamic type can cast it.
      #expect(try (~[Int].self).cast(50, appContext: appContext) as? [Int] == [50])
      #expect(try (~[String].self).cast("not an array", appContext: appContext) as? [String] == ["not an array"])
    }

    @Test
    func `throws CastingException`() {
      #expect(throws: Conversions.CastingException<String>.self) {
        try (~[String].self).cast(84, appContext: appContext)
      }
    }

    @Test
    func `wraps is true`() {
      #expect((~[Double].self ~> [Double].self) == true)
      #expect((~[[String]].self ~> [[String]].self) == true)
      #expect((~[CGPoint].self ~> [CGPoint].self) == true)
    }

    @Test
    func `wraps is false`() {
      #expect((~[String].self !~> [Int].self) == true)
      #expect((~[Promise].self !~> Promise.self) == true)
    }

    @Test
    func `equals is true`() {
      #expect((~[String].self == ~[String].self) == true)
      #expect((~[CGSize].self == ~[CGSize].self) == true)
      #expect((~[[[Double]]].self == ~[[[Double]]].self) == true)
    }

    @Test
    func `equals is false`() {
      #expect((~[Int].self != ~[Double].self) == true)
      #expect((~[[String]].self != ~[String].self) == true)
      #expect((~[URL].self != ~[String].self) == true)
    }
  }

  // MARK: - DynamicConvertibleType

  @Suite("DynamicConvertibleType")
  struct DynamicConvertibleTypeTests {
    let appContext: AppContext

    init() {
      appContext = AppContext.create()
    }

    @Test
    func `is created`() {
      #expect(~CGPoint.self is DynamicConvertibleType)
      #expect(~CGRect.self is DynamicConvertibleType)
      #expect(~CGColor.self is DynamicConvertibleType)
      #expect(~URL.self is DynamicConvertibleType)
    }

    @Test
    func `casts succeeds`() throws {
      #expect(try (~CGPoint.self).cast([2.1, 3.7], appContext: appContext) as? CGPoint == CGPoint(x: 2.1, y: 3.7))
      #expect(try (~CGVector.self).cast(["dx": 0.8, "dy": 4.1], appContext: appContext) as? CGVector == CGVector(dx: 0.8, dy: 4.1))
      #expect(try (~URL.self).cast("/test/path", appContext: appContext) as? URL == URL(fileURLWithPath: "/test/path"))
    }

    @Test
    func `throws ConvertingException`() {
      #expect(throws: Conversions.ConvertingException<CGRect>.self) {
        try (~CGRect.self).cast("not a rect", appContext: appContext)
      }
    }

    @Test
    func `wraps is true`() {
      #expect((~CGRect.self ~> CGRect.self) == true)
      #expect((~CGColor.self ~> CGColor.self) == true)
      #expect((~URL.self ~> URL.self) == true)
    }

    @Test
    func `wraps is false`() {
      #expect((~CGRect.self !~> Double.self) == true)
      #expect((~CGColor.self !~> CGRect.self) == true)
      #expect((~URL.self !~> String.self) == true)
    }

    @Test
    func `equals is true`() {
      #expect((~CGSize.self == ~CGSize.self) == true)
      #expect((~URL.self == ~URL.self) == true)
      #expect((~UIColor.self == ~UIColor.self) == true)
    }

    @Test
    func `equals is false`() {
      #expect((~CGSize.self != ~CGRect.self) == true)
      #expect((~CGPoint.self != ~CGVector.self) == true)
      #expect((~URL.self != ~String.self) == true)
    }
  }

  // MARK: - DynamicEnumType

  @Suite("DynamicEnumType")
  struct DynamicEnumTypeTests {
    let appContext: AppContext

    enum StringTestEnum: String, Enumerable {
      case hello
      case expo
    }
    enum IntTestEnum: Int, Enumerable {
      case negative = -1
      case positive = 1
    }

    init() {
      appContext = AppContext.create()
    }

    @Test
    func `is created`() {
      #expect(~StringTestEnum.self is DynamicEnumType)
      #expect(~IntTestEnum.self is DynamicEnumType)
    }

    @Test
    func `casts succeeds`() throws {
      #expect(try (~StringTestEnum.self).cast("expo", appContext: appContext) as? StringTestEnum == .expo)
      #expect(try (~IntTestEnum.self).cast(1, appContext: appContext) as? IntTestEnum == .positive)
    }

    @Test
    func `throws EnumNoSuchValueException`() {
      #expect(throws: EnumNoSuchValueException.self) {
        try (~StringTestEnum.self).cast("react native", appContext: appContext)
      }
    }

    @Test
    func `throws EnumCastingException`() {
      #expect(throws: EnumCastingException.self) {
        try (~IntTestEnum.self).cast(true, appContext: appContext)
      }
    }

    @Test
    func `wraps is true`() {
      #expect((~StringTestEnum.self ~> StringTestEnum.self) == true)
      #expect((~IntTestEnum.self ~> IntTestEnum.self) == true)
    }

    @Test
    func `wraps is false`() {
      #expect((~StringTestEnum.self !~> IntTestEnum.self) == true)
      #expect((~IntTestEnum.self !~> StringTestEnum.self) == true)
    }

    @Test
    func `equals is true`() {
      #expect((~StringTestEnum.self == ~StringTestEnum.self) == true)
      #expect((~IntTestEnum.self == ~IntTestEnum.self) == true)
    }

    @Test
    func `equals is false`() {
      #expect((~StringTestEnum.self != ~IntTestEnum.self) == true)
      #expect((~IntTestEnum.self != ~StringTestEnum.self) == true)
      #expect((~StringTestEnum.self != ~Double.self) == true)
      #expect((~IntTestEnum.self != ~Int.self) == true)
    }
  }

  // MARK: - DynamicOptionalType

  @Suite("DynamicOptionalType")
  struct DynamicOptionalTypeTests {
    let appContext: AppContext

    init() {
      appContext = AppContext.create()
    }

    @Test
    func `is created`() {
      #expect(~String?.self is DynamicOptionalType)
      #expect(~[Double]?.self is DynamicOptionalType)
      #expect(~[Int?]?.self is DynamicOptionalType)
    }

    @Test
    func `casts succeeds`() throws {
      #expect(try (~String?.self).cast("expo", appContext: appContext) as? String == "expo")
      #expect(try (~Bool?.self).cast(false, appContext: appContext) as? Bool == false)
    }

    @Test
    func `casts succeeds with nil`() throws {
      let value: Double? = nil
      let result = try (~Double?.self).cast(value as Any, appContext: appContext)

      #expect(result is Double?)

      // Since this `nil` is in fact of non-optional `Any` type, under the hood it's described as `Optional` enum.
      // Simply checking `result == nil` does NOT work here, see `Optional.isNil` extension implementation.
      #expect(Optional.isNil(result) == true)
    }

    @Test
    func `casts succeeds with NSNull`() throws {
      let value = NSNull()
      let result = try (~Double?.self).cast(value as Any, appContext: appContext)
      #expect(result is Double?)
      #expect(Optional.isNil(result) == true)
    }

    @Test
    func `throws CastingException`() {
      #expect(throws: Conversions.CastingException<Double>.self) {
        try (~Double?.self).cast("a string", appContext: appContext)
      }
    }

    @Test
    func `wraps is true`() {
      #expect((~Double?.self ~> Double?.self) == true)
      #expect((~String?.self ~> String?.self) == true)
      #expect((~URL?.self ~> URL?.self) == true)
    }

    @Test
    func `wraps is false`() {
      #expect((~Double?.self !~> Double.self) == true)
      #expect((~[URL]?.self !~> URL.self) == true)
      #expect((~[String]?.self !~> [String?].self) == true)
    }

    @Test
    func `equals is true`() {
      #expect((~Int?.self == ~Int?.self) == true)
      #expect((~DynamicOptionalTypeTests?.self == ~DynamicOptionalTypeTests?.self) == true)
    }

    @Test
    func `equals is false`() {
      #expect((~Double?.self != ~Double.self) == true)
      #expect((~Int?.self != ~Double?.self) == true)
      #expect((~[Bool]?.self != ~[Bool].self) == true)
    }
  }

  // MARK: - DynamicSharedObjectType

  @Suite("DynamicSharedObjectType")
  struct DynamicSharedObjectTypeTests {
    let appContext: AppContext
    var runtime: ExpoRuntime {
      get throws {
        try appContext.runtime
      }
    }

    class TestSharedObject: SharedObject {}

    init() {
      appContext = AppContext.create()
    }

    @Test
    func `is created`() {
      #expect(~TestSharedObject.self is DynamicSharedObjectType)
    }

    @Test
    func `casts succeeds`() throws {
      let appContext = AppContext.create()
      let nativeObject = TestSharedObject()
      let jsObjectValue = try appContext.runtime.eval("({})")

      appContext.sharedObjectRegistry.add(native: nativeObject, javaScript: try jsObjectValue.asObject())

      // `DynamicSharedObjectType` only supports casting
      // from `JavaScriptValue`, but not from `JavaScriptObject`.
      #expect(try (~TestSharedObject.self).cast(jsValue: jsObjectValue, appContext: appContext) as? TestSharedObject === nativeObject)
    }

    @Test
    func `throws NativeSharedObjectNotFoundException`() {
      #expect(throws: NativeSharedObjectNotFoundException.self) {
        try (~TestSharedObject.self).cast("a string", appContext: appContext)
      }
    }

    @Test
    func `wraps is true`() {
      #expect((~TestSharedObject.self ~> TestSharedObject.self) == true)
    }

    @Test
    func `wraps is false`() {
      #expect((~TestSharedObject.self !~> SharedObject.self) == true)
      #expect((~TestSharedObject.self !~> String?.self) == true)
    }

    @Test
    func `equals is true`() {
      #expect((~TestSharedObject.self == ~TestSharedObject.self) == true)
      #expect((~TestSharedObject?.self == ~TestSharedObject?.self) == true)
      #expect((~[TestSharedObject].self == ~[TestSharedObject].self) == true)
    }

    @Test
    func `equals is false`() {
      #expect((~TestSharedObject.self != ~TestSharedObject?.self) == true)
      #expect((~TestSharedObject.self != ~[String: Any].self) == true)
      #expect((~TestSharedObject.self != ~[TestSharedObject].self) == true)
    }
  }

  // MARK: - DynamicEitherType

  @Suite("DynamicEitherType")
  struct DynamicEitherTypeBasicTests {
    let appContext: AppContext

    init() {
      appContext = AppContext.create()
    }

    @Test
    func `is created`() {
      #expect(~Either<Int, String>.self is DynamicEitherType<Either<Int, String>>)
    }

    @Test
    func `casts succeeds`() throws {
      let either1 = try (~Either<Int, String>.self).cast(123, appContext: appContext) as! Either<Int, String>
      #expect(try either1.as(Int.self) == 123)

      let either2 = try (~Either<Int, String>.self).cast("expo", appContext: appContext) as! Either<Int, String>
      #expect(try either2.as(String.self) == "expo")
    }
  }

  // MARK: - DynamicEncodableType

  @Suite("DynamicEncodableType")
  struct DynamicEncodableTypeTests {
    let appContext: AppContext
    var runtime: ExpoRuntime {
      get throws {
        try appContext.runtime
      }
    }

    struct TestEncodable: Encodable {
      let string: String
      let number: Int
      let bool: Bool
      var object: TestEncodableChild? = nil
      var array: [Int]? = nil
    }
    struct TestEncodableChild: Encodable {
      let name: String
    }

    init() {
      appContext = AppContext.create()
    }

    @Test
    func `is created`() {
      #expect(~TestEncodable.self is DynamicEncodableType)
    }

    @Test
    func `casts to JS object`() throws {
      let encodable = TestEncodable(string: "test", number: -5, bool: true)
      let result = try (~TestEncodable.self).castToJS(encodable, appContext: appContext)

      #expect(result.kind == .object)
    }

    @Test
    func `has proper property names`() throws {
      let encodable = TestEncodable(string: "test", number: -5, bool: true)
      let result = try (~TestEncodable.self).castToJS(encodable, appContext: appContext)
      let propertyNames = result.getObject().getPropertyNames()

      #expect(propertyNames.count == 3)
      #expect(propertyNames.contains("string"))
      #expect(propertyNames.contains("number"))
      #expect(propertyNames.contains("bool"))
    }

    @Test
    func `has correct values`() throws {
      let encodable = TestEncodable(string: "test", number: -5, bool: true)
      let result = try (~TestEncodable.self).castToJS(encodable, appContext: appContext)
      let object = result.getObject()

      #expect(try object.getProperty("string").asString() == encodable.string)
      #expect(try object.getProperty("number").asInt() == encodable.number)
      #expect(try object.getProperty("bool").asBool() == encodable.bool)
      #expect(object.getProperty("object").isUndefined() == true)
      #expect(object.getProperty("array").isUndefined() == true)
    }

    @Test
    func `casts nested objects`() throws {
      let encodable = TestEncodable(
        string: "test",
        number: -5,
        bool: true,
        object: TestEncodableChild(name: "expo")
      )
      let result = try (~TestEncodable.self).castToJS(encodable, appContext: appContext)
      let nestedValue = result.getObject().getProperty("object")

      #expect(nestedValue.kind == .object)
      #expect(try nestedValue.getObject().getProperty("name").asString() == encodable.object?.name)
    }

    @Test
    func `casts arrays`() throws {
      let encodable = TestEncodable(
        string: "test",
        number: -5,
        bool: true,
        array: [1, 2, 3]
      )
      let result = try (~TestEncodable.self).castToJS(encodable, appContext: appContext)
      let array = result.getObject().getProperty("array").getArray()

      #expect(array.count == encodable.array?.count)
      #expect(array.map({ $0.getInt() }) == encodable.array)
    }
  }
}
