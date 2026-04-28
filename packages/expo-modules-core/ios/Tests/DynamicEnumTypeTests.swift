// Copyright 2024-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("DynamicEnumType")
@JavaScriptActor
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
  func `casts string-backed enum to JS string`() throws {
    let result = try (~StringTestEnum.self).castToJS(StringTestEnum.expo, appContext: appContext)

    #expect(result.kind == .string)
    #expect(try result.asString() == "expo")
  }

  @Test
  func `casts int-backed enum to JS number`() throws {
    let result = try (~IntTestEnum.self).castToJS(IntTestEnum.negative, appContext: appContext)

    #expect(result.kind == .number)
    #expect(try result.asInt() == -1)
  }

  @Test
  func `MainValueConverter converts enum to JS`() throws {
    // Exercises the `convertResult` → `castToJS` path used for async function results.
    let result = try appContext.converter.toJS(StringTestEnum.hello, ~StringTestEnum.self)

    #expect(result.kind == .string)
    #expect(try result.asString() == "hello")
  }

  @Test
  func `casts array of enums to JS array`() throws {
    let array: [StringTestEnum] = [.hello, .expo]
    let result = try (~[StringTestEnum].self).castToJS(array, appContext: appContext)
    let jsArray = result.getArray()

    #expect(jsArray.length == 2)
    #expect(try jsArray[0].asString() == "hello")
    #expect(try jsArray[1].asString() == "expo")
  }

  @Test
  func `casts dictionary of enums to JS object`() throws {
    let dict: [String: StringTestEnum] = ["greeting": .hello, "name": .expo]
    let result = try (~[String: StringTestEnum].self).castToJS(dict, appContext: appContext)
    let object = try result.asObject()

    #expect(try object.getProperty("greeting").asString() == "hello")
    #expect(try object.getProperty("name").asString() == "expo")
  }

  @Test
  func `getRawValueDynamicType returns the raw value's dynamic type`() {
    #expect(StringTestEnum.getRawValueDynamicType() is DynamicStringType)
    #expect(IntTestEnum.getRawValueDynamicType() is DynamicNumberType<Int>)
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
