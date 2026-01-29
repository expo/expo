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
