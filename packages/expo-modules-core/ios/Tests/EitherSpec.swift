// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

final class EitherSpec: ExpoSpec {
  override class func spec() {
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
    }
  }
}
