// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

final class EitherSpec: ExpoSpec {
  override class func spec() {
    let appContext = AppContext.create()

    describe("Either") {
      it("is the first type") {
        let either = Either<String, Int>("string")
        expect(either.is(String.self)) == true
        expect(either.is(Int.self)) == false
      }
      it("is the second type") {
        let either = Either<String, Int>(123)
        expect(either.is(String.self)) == false
        expect(either.is(Int.self)) == true
      }
      it("is neither") {
        let either = Either<String, Int>(12.34)
        expect(either.is(String.self)) == false
        expect(either.is(Int.self)) == false
      }
      it("gets the first type") {
        let either = Either<String, Int>("string")
        let value: String? = either.get()
        expect(value).notTo(beNil())
      }
      it("gets the second type") {
        let either = Either<String, Int>(123)
        let value: Int? = either.get()
        expect(value).notTo(beNil())
      }
      it("converts as convertible") {
        let either = try Either<String, Int>.convert(from: 123, appContext: appContext)
        expect(either.is(String.self)) == false
        expect(either.is(Int.self)) == true
      }
      it("throws when converting from neither type") {
        expect({ try Either<String, Int>.convert(from: true, appContext: appContext) }).to(throwError(errorType: NeitherTypeException.self))
      }

      it("supports arrays") {
        let either = try Either<String, [String]>.convert(from: ["foo"], appContext: appContext)
        let value: [String]? = either.get()

        expect(either.is([String].self)) == true
        expect(value) == ["foo"]
      }

      it("supports convertibles (UIColor)") {
        let either = try Either<Int, UIColor>.convert(from: "blue", appContext: appContext)
        let color: UIColor? = either.get()

        expect(either.is(UIColor.self)) == true
        expect(color?.cgColor.components) == CGColor(red: 0, green: 0, blue: 1, alpha: 1).components
      }

      it("supports records") {
        struct TestRecord: Record {
          @Field
          var foo: String
        }
        let either = try Either<String, TestRecord>.convert(from: ["foo": "bar"], appContext: appContext)
        let record: TestRecord? = either.get()

        expect(either.is(TestRecord.self)) == true
        expect(record?.foo) == "bar"
      }
    }
    describe("EitherOfThree") {
      it("is the third type") {
        let either = EitherOfThree<String, Int, Bool>(true)
        expect(either.is(String.self)) == false
        expect(either.is(Int.self)) == false
        expect(either.is(Bool.self)) == true
      }
      it("is neither") {
        let either = EitherOfThree<String, Int, Bool>(12.34)
        expect(either.is(String.self)) == false
        expect(either.is(Int.self)) == false
        expect(either.is(Bool.self)) == false
      }
      it("gets the third type") {
        let either = EitherOfThree<String, Int, Bool>(false)
        let value: Bool? = either.get()
        expect(value).notTo(beNil())
      }
      it("throws when converting from neither type") {
        expect({ try EitherOfThree<String, Int, Double>.convert(from: false, appContext: appContext) }).to(throwError(errorType: NeitherTypeException.self))
      }
    }
    describe("EitherOfFour") {
      it("is the fourth type") {
        let either = EitherOfFour<String, Int, Bool, Double>(12.34)
        expect(either.is(String.self)) == false
        expect(either.is(Int.self)) == false
        expect(either.is(Bool.self)) == false
        expect(either.is(Double.self)) == true
      }
      it("is neither") {
        let either = EitherOfFour<String, Int, Bool, Double>(UIColor.white)
        expect(either.is(String.self)) == false
        expect(either.is(Int.self)) == false
        expect(either.is(Bool.self)) == false
        expect(either.is(Double.self)) == false
      }
      it("gets the fourth type") {
        let either = EitherOfFour<String, Int, Bool, Double>(12.34)
        let value: Double? = either.get()
        expect(value).notTo(beNil())
      }
      it("throws when converting from neither type") {
        expect({ try EitherOfFour<String, Int, Double, Bool>.convert(from: [1, 2], appContext: appContext) }).to(throwError(errorType: NeitherTypeException.self))
      }
    }
  }
}
