// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

final class DynamicEitherTypeSpec: ExpoSpec {
  override class func spec() {
    let appContext = AppContext.create()
    let runtime = try! appContext.runtime

    it("is created") {
      expect(~Either<Int, String>.self).to(beAKindOf(DynamicEitherType<Either<Int, String>>.self))
    }

    it("converts from raw values") {
      let either1 = try (~Either<Int, String>.self).cast(123, appContext: appContext) as! Either<Int, String>
      expect(try either1.as(Int.self)) == 123

      let either2 = try (~Either<Int, String>.self).cast("expo", appContext: appContext) as! Either<Int, String>
      expect(try either2.as(String.self)) == "expo"
    }

    it("converts from JS values") {
      let either1 = try (~Either<Int, String>.self).cast(jsValue: .number(123), appContext: appContext) as! Either<Int, String>
      expect(try either1.as(Int.self)) == 123

      let either2 = try (~Either<Int, String>.self).cast(jsValue: .string("expo", runtime: runtime), appContext: appContext) as! Either<Int, String>
      expect(try either2.as(String.self)) == "expo"
    }

    it("throws when converting from neither type") {
      expect({ try (~Either<String, Int>.self).cast(true, appContext: appContext) })
        .to(throwError(errorType: NeitherTypeException.self))

      expect({ try (~Either<String, Bool>.self).cast(jsValue: .number(100), appContext: appContext) })
        .to(throwError(errorType: NeitherTypeException.self))

      expect({ try (~EitherOfThree<String, Int, Double>.self).cast(false, appContext: appContext) })
        .to(throwError(errorType: NeitherTypeException.self))

      expect({ try (~EitherOfFour<String, Int, Double, Bool>.self).cast([1, 2], appContext: appContext) })
        .to(throwError(errorType: NeitherTypeException.self))
    }

    it("supports arrays") {
      let either = try (~Either<String, [String]>.self).cast(["foo"], appContext: appContext) as! Either<String, [String]>
      let value: [String]? = either.get()

      expect(either.is([String].self)) == true
      expect(value) == ["foo"]
    }

    it("supports convertibles (UIColor)") {
      let either = try (~Either<Int, UIColor>.self).cast("blue", appContext: appContext) as! Either<Int, UIColor>
      let color: UIColor? = either.get()

      expect(either.is(Int.self)) == false
      expect(either.is(UIColor.self)) == true
      expect(color?.cgColor.components) == CGColor(red: 0, green: 0, blue: 1, alpha: 1).components
    }

    it("supports records") {
      struct TestRecord: Record {
        @Field
        var foo: String
      }
      let either = try (~Either<String, TestRecord>.self).cast(["foo": "bar"], appContext: appContext) as! Either<String, TestRecord>
      let record: TestRecord? = either.get()

      expect(either.is(String.self)) == false
      expect(either.is(TestRecord.self)) == true
      expect(record?.foo) == "bar"
    }

    it("supports shared objects") {
      class TestSharedObject: SharedObject {}

      let nativeObject = TestSharedObject()

      // Register a pair of objects
      _ = appContext.sharedObjectRegistry.createSharedJavaScriptObject(runtime: runtime, nativeObject: nativeObject)

      // TODO: We should test with JS value, but currently we have no way to convert JavaScriptObject to JavaScriptValue
      let either = try (~Either<TestSharedObject, String>.self).cast(nativeObject.sharedObjectId, appContext: appContext) as! Either<TestSharedObject, String>

      expect(either.is(TestSharedObject.self)) == true
      expect(either.is(String.self)) == false
      expect(try either.as(TestSharedObject.self).sharedObjectId) == nativeObject.sharedObjectId
    }
  }
}

