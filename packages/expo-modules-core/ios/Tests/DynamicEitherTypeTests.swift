// Copyright 2024-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("DynamicEitherType")
struct DynamicEitherTypeTests {
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
    #expect(~Either<Int, String>.self is DynamicEitherType<Either<Int, String>>)
  }

  @Test
  func `converts from raw values`() throws {
    let either1 = try (~Either<Int, String>.self).cast(123, appContext: appContext) as! Either<Int, String>
    #expect(try either1.as(Int.self) == 123)

    let either2 = try (~Either<Int, String>.self).cast("expo", appContext: appContext) as! Either<Int, String>
    #expect(try either2.as(String.self) == "expo")
  }

  @Test
  func `converts from JS values`() throws {
    let either1 = try (~Either<Int, String>.self).cast(jsValue: .number(123), appContext: appContext) as! Either<Int, String>
    #expect(try either1.as(Int.self) == 123)

    let either2 = try (~Either<Int, String>.self).cast(jsValue: .string("expo", runtime: runtime), appContext: appContext) as! Either<Int, String>
    #expect(try either2.as(String.self) == "expo")
  }

  @Test
  func `throws when converting from neither type`() {
    #expect(throws: NeitherTypeException.self) {
      try (~Either<String, Int>.self).cast(true, appContext: appContext)
    }

    #expect(throws: NeitherTypeException.self) {
      try (~Either<String, Bool>.self).cast(jsValue: .number(100), appContext: appContext)
    }

    #expect(throws: NeitherTypeException.self) {
      try (~EitherOfThree<String, Int, Double>.self).cast(false, appContext: appContext)
    }

    #expect(throws: NeitherTypeException.self) {
      try (~EitherOfFour<String, Int, Double, Bool>.self).cast([1, 2], appContext: appContext)
    }
  }

  @Test
  func `supports arrays`() throws {
    let either = try (~Either<String, [String]>.self).cast(["foo"], appContext: appContext) as! Either<String, [String]>
    let value: [String]? = either.get()

    #expect(either.is([String].self) == true)
    #expect(value == ["foo"])
  }

  @Test
  func `supports convertibles (UIColor)`() throws {
    let either = try (~Either<Int, UIColor>.self).cast("blue", appContext: appContext) as! Either<Int, UIColor>
    let color: UIColor? = either.get()

    #expect(either.is(Int.self) == false)
    #expect(either.is(UIColor.self) == true)
    #expect(color?.cgColor.components == CGColor(red: 0, green: 0, blue: 1, alpha: 1).components)
  }

  @Test
  func `supports records`() throws {
    struct TestRecord: Record {
      @Field
      var foo: String
    }
    let either = try (~Either<String, TestRecord>.self).cast(["foo": "bar"], appContext: appContext) as! Either<String, TestRecord>
    let record: TestRecord? = either.get()

    #expect(either.is(String.self) == false)
    #expect(either.is(TestRecord.self) == true)
    #expect(record?.foo == "bar")
  }

  @Test
  func `supports shared objects`() throws {
    class TestSharedObject: SharedObject {}

    let nativeObject = TestSharedObject()

    // Register a pair of objects
    _ = appContext.sharedObjectRegistry.createSharedJavaScriptObject(runtime: try runtime, nativeObject: nativeObject)

    // TODO: We should test with JS value, but currently we have no way to convert JavaScriptObject to JavaScriptValue
    let either = try (~Either<TestSharedObject, String>.self).cast(nativeObject.sharedObjectId, appContext: appContext) as! Either<TestSharedObject, String>

    #expect(either.is(TestSharedObject.self) == true)
    #expect(either.is(String.self) == false)
    #expect(try either.as(TestSharedObject.self).sharedObjectId == nativeObject.sharedObjectId)
  }

  @Test
  func `supports array of either`() throws {
    let eitherArray2 = try (~[Either<String, Int>].self).cast(["bg", 37], appContext: appContext) as! [Either<String, Int>]
    #expect(eitherArray2[0].is(String.self) == true)
    #expect(eitherArray2[0].get() == "bg")
    #expect(eitherArray2[1].is(Int.self) == true)
    #expect(eitherArray2[1].is(String.self) == false)
    #expect(eitherArray2[1].get() == 37)

    let eitherArray3 = try (~[EitherOfThree<Int, String, Bool>].self).cast(["foo", 1, "bar", true, 3], appContext: appContext) as! [EitherOfThree<Int, String, Bool>]
    #expect(eitherArray3[0].is(String.self) == true)
    #expect(eitherArray3[0].get() == "foo")
    #expect(eitherArray3[1].is(Int.self) == true)
    #expect(eitherArray3[1].get() == 1)
    #expect(eitherArray3[2].is(String.self) == true)
    #expect(eitherArray3[2].get() == "bar")
    #expect(eitherArray3[3].is(Bool.self) == true)
    #expect(eitherArray3[3].get() == true)
    #expect(eitherArray3[4].is(Int.self) == true)
    #expect(eitherArray3[4].get() == 3)

    let eitherArray4 = try (~[EitherOfFour<Bool, CGFloat, CGColor, String>].self).cast(["foo", 123.4, false], appContext: appContext) as! [EitherOfFour<Bool, CGFloat, CGColor, String>]
    #expect(eitherArray4[0].is(String.self) == true)
    #expect(eitherArray4[0].get() == "foo")
    #expect(eitherArray4[1].is(CGFloat.self) == true)
    #expect(eitherArray4[1].get() == 123.4)
    #expect(eitherArray4[1].is(CGColor.self) == true)
    #expect(eitherArray4[1].get() == 123.4)
    #expect(eitherArray4[2].is(Bool.self) == true)
    #expect(eitherArray4[2].get() == false)
    #expect(eitherArray4[2].is(CGFloat.self) == false)
  }
}
