// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("Either")
struct EitherTests {
  @Test
  func `is the first type`() {
    let either = Either<String, Int>("string")
    #expect(either.is(String.self) == true)
    #expect(either.is(Int.self) == false)
  }

  @Test
  func `is the second type`() {
    let either = Either<String, Int>(123)
    #expect(either.is(String.self) == false)
    #expect(either.is(Int.self) == true)
  }

  @Test
  func `is neither`() {
    let either = Either<String, Int>(12.34)
    #expect(either.is(String.self) == false)
    #expect(either.is(Int.self) == false)
  }

  @Test
  func `gets the first type`() {
    let either = Either<String, Int>("string")
    let value: String? = either.get()
    #expect(value != nil)
  }

  @Test
  func `gets the second type`() {
    let either = Either<String, Int>(123)
    let value: Int? = either.get()
    #expect(value != nil)
  }
}

@Suite("Either Equatable")
struct EitherEquatableTests {
  @Test
  func `equal when same first type value`() {
    let a = Either<String, Int>("hello")
    let b = Either<String, Int>("hello")
    #expect(a == b)
  }

  @Test
  func `equal when same second type value`() {
    let a = Either<String, Int>(42)
    let b = Either<String, Int>(42)
    #expect(a == b)
  }

  @Test
  func `not equal when different values of same type`() {
    let a = Either<String, Int>("hello")
    let b = Either<String, Int>("world")
    #expect(a != b)
  }

  @Test
  func `not equal when different types`() {
    let a = Either<String, Int>("42")
    let b = Either<String, Int>(42)
    #expect(a != b)
  }

  @Test
  func `equal when both nil`() {
    let a = Either<String, Int>(nil)
    let b = Either<String, Int>(nil)
    #expect(a == b)
  }

  @Test
  func `not equal when one is nil`() {
    let a = Either<String, Int>("hello")
    let b = Either<String, Int>(nil)
    #expect(a != b)
  }

  @Test
  func `EitherOfThree equal when same third type value`() {
    let a = EitherOfThree<String, Int, Bool>(true)
    let b = EitherOfThree<String, Int, Bool>(true)
    #expect(a == b)
  }

  @Test
  func `EitherOfThree not equal when different third type values`() {
    let a = EitherOfThree<String, Int, Bool>(true)
    let b = EitherOfThree<String, Int, Bool>(false)
    #expect(a != b)
  }

  @Test
  func `EitherOfFour equal when same fourth type value`() {
    let a = EitherOfFour<String, Int, Bool, Double>(3.14)
    let b = EitherOfFour<String, Int, Bool, Double>(3.14)
    #expect(a == b)
  }

  @Test
  func `equal when same array value`() {
    let a = Either<[Int], String>([1, 2, 3])
    let b = Either<[Int], String>([1, 2, 3])
    #expect(a == b)
  }

  @Test
  func `not equal when different array values`() {
    let a = Either<[Int], String>([1, 2, 3])
    let b = Either<[Int], String>([1, 2, 4])
    #expect(a != b)
  }

  @Test
  func `equal when same set value`() {
    let a = Either<Set<String>, Int>(Set(["a", "b"]))
    let b = Either<Set<String>, Int>(Set(["b", "a"]))
    #expect(a == b)
  }

  @Test
  func `equal when same UIColor value`() {
    let a = Either<String, UIColor>(UIColor.red)
    let b = Either<String, UIColor>(UIColor.red)
    #expect(a == b)
  }

  @Test
  func `not equal when different UIColors`() {
    let a = Either<String, UIColor>(UIColor.red)
    let b = Either<String, UIColor>(UIColor.blue)
    #expect(a != b)
  }
}

@Suite("EitherOfThree")
struct EitherOfThreeTests {
  @Test
  func `is the third type`() {
    let either = EitherOfThree<String, Int, Bool>(true)
    #expect(either.is(String.self) == false)
    #expect(either.is(Int.self) == false)
    #expect(either.is(Bool.self) == true)
  }

  @Test
  func `is neither`() {
    let either = EitherOfThree<String, Int, Bool>(12.34)
    #expect(either.is(String.self) == false)
    #expect(either.is(Int.self) == false)
    #expect(either.is(Bool.self) == false)
  }

  @Test
  func `gets the third type`() {
    let either = EitherOfThree<String, Int, Bool>(false)
    let value: Bool? = either.get()
    #expect(value != nil)
  }
}

@Suite("EitherOfFour")
struct EitherOfFourTests {
  @Test
  func `is the fourth type`() {
    let either = EitherOfFour<String, Int, Bool, Double>(12.34)
    #expect(either.is(String.self) == false)
    #expect(either.is(Int.self) == false)
    #expect(either.is(Bool.self) == false)
    #expect(either.is(Double.self) == true)
  }

  @Test
  func `is neither`() {
    let either = EitherOfFour<String, Int, Bool, Double>(UIColor.white)
    #expect(either.is(String.self) == false)
    #expect(either.is(Int.self) == false)
    #expect(either.is(Bool.self) == false)
    #expect(either.is(Double.self) == false)
  }

  @Test
  func `gets the fourth type`() {
    let either = EitherOfFour<String, Int, Bool, Double>(12.34)
    let value: Double? = either.get()
    #expect(value != nil)
  }
}
