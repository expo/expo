// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@testable import ExpoModulesCore

@Suite("JavaScriptCodable+Either")
@JavaScriptActor
struct JavaScriptCodableEitherTests {
  let appContext = AppContext.create()

  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  // MARK: - Decoding

  @Test
  func `decodes the first type`() throws {
    let runtime = try runtime
    let decoded = try Either<String, Int>.decode(runtime.eval("'expo'"), in: runtime)

    #expect(decoded.is(String.self) == true)
    #expect(try decoded.as(String.self) == "expo")
  }

  @Test
  func `decodes the second type`() throws {
    let runtime = try runtime
    let decoded = try Either<String, Int>.decode(runtime.eval("123"), in: runtime)

    #expect(decoded.is(Int.self) == true)
    #expect(try decoded.as(Int.self) == 123)
  }

  @Test
  func `decodes an array type`() throws {
    let runtime = try runtime
    let decoded = try Either<String, [Int]>.decode(runtime.eval("[1, 2, 3]"), in: runtime)
    let value: [Int]? = decoded.get()

    #expect(value == [1, 2, 3])
  }

  // Convertibles have no `JavaScriptCodable` conformance of their own, so this covers the types that
  // only the dynamic converters can handle.
  @Test
  func `decodes a convertible`() throws {
    let runtime = try runtime
    let decoded = try Either<Int, UIColor>.decode(runtime.eval("'blue'"), in: runtime)
    let color: UIColor? = decoded.get()

    #expect(decoded.is(UIColor.self) == true)
    #expect(color?.cgColor.components == CGColor(red: 0, green: 0, blue: 1, alpha: 1).components)
  }

  @Test
  func `throws when the value is of neither type`() throws {
    let runtime = try runtime

    #expect(throws: NeitherTypeException.self) {
      try Either<String, Int>.decode(runtime.eval("true"), in: runtime)
    }
  }

  // MARK: - Decoding in subclasses

  // `EitherOfThree` and `EitherOfFour` inherit the conformance from `Either`, so these cover that an
  // inherited decode dispatches to the subclass's `dynamicTypes()` and creates the subclass.

  @Test
  func `decodes the third type of EitherOfThree`() throws {
    let runtime = try runtime
    let decoded = try EitherOfThree<String, Int, Bool>.decode(runtime.eval("true"), in: runtime)

    #expect(decoded.is(Bool.self) == true)
    #expect(try decoded.as(Bool.self) == true)
  }

  @Test
  func `decodes the fourth type of EitherOfFour`() throws {
    let runtime = try runtime
    let decoded = try EitherOfFour<String, Int, Bool, [String]>.decode(runtime.eval("['a', 'b']"), in: runtime)
    let value: [String]? = decoded.get()

    #expect(value == ["a", "b"])
  }

  @Test
  func `throws when the value is of neither of four types`() throws {
    let runtime = try runtime

    #expect(throws: NeitherTypeException.self) {
      try EitherOfFour<String, Int, Bool, [String]>.decode(runtime.eval("({ foo: 'bar' })"), in: runtime)
    }
  }

  // MARK: - Encoding

  @Test
  func `encodes the wrapped value`() throws {
    let runtime = try runtime

    #expect(try Either<String, Int>.encode(Either("expo"), in: runtime).getString() == "expo")
    #expect(try Either<String, Int>.encode(Either(123), in: runtime).getInt() == 123)
  }

  @Test
  func `encodes the third type of EitherOfThree`() throws {
    let runtime = try runtime
    let encoded = try EitherOfThree<String, Int, Bool>.encode(EitherOfThree<String, Int, Bool>(true), in: runtime)

    #expect(encoded.getBool() == true)
  }

  @Test
  func `encodes an empty either as null`() throws {
    let runtime = try runtime
    let encoded = try Either<String, Int>.encode(Either(nil), in: runtime)

    #expect(encoded.isNull() == true)
  }

  // MARK: - Round-trips

  @Test
  func `round-trips both types`() throws {
    let runtime = try runtime

    for either in [Either<String, Int>("expo"), Either<String, Int>(123)] {
      let roundTripped = try Either<String, Int>.decode(Either<String, Int>.encode(either, in: runtime), in: runtime)
      #expect(roundTripped == either)
    }
  }
}
