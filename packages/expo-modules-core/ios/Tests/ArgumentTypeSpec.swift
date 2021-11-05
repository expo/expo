// Copyright 2021-present 650 Industries. All rights reserved.

import Quick
import Nimble

@testable import ExpoModulesCore

class ArgumentTypeSpec: QuickSpec {
  override func spec() {

    it("casts primitives") {
      let type = ArgumentType(Int.self)
      let value = 123
      let anyValue = value as Any

      expect(try type.cast(anyValue)).to(be(value))
    }

    it("casts arrays") {
      let type = ArgumentType([Double].self)
      let value = 9.9
      let anyValue = [value] as [Any]
      let result = try type.cast(anyValue) as! [Any]

      expect(result).to(beAKindOf([Double].self))
      expect((result as! [Double]).first) == value
    }

    it("casts convertibles") {
      let type = ArgumentType(ConvertibleTestStruct.self)
      let value = "expo is the best"
      let result = try type.cast(value)

      expect(result).to(beAKindOf(ConvertibleTestStruct.self))
      expect((result as! ConvertibleTestStruct).value) == value
    }

    it("casts array of convertibles") {
      let type = ArgumentType([ConvertibleTestStruct].self)
      let value = ["expo is the best"]
      let result = try type.cast(value)

      expect(result).to(beAKindOf([ConvertibleTestStruct].self))
      expect((result as! [ConvertibleTestStruct]).first!.value) == value.first
    }

    it("casts array of array of convertibles") {
      let type = ArgumentType([[ConvertibleTestStruct]].self)
      let value = [["expo is the best"]]
      let result = try type.cast(value)

      expect(result).to(beAKindOf([[ConvertibleTestStruct]].self))
      expect((result as! [[ConvertibleTestStruct]]).first!.first!.value) == value.first!.first
    }
  }
}

struct ConvertibleTestStruct: ConvertibleArgument {
  let value: String

  static func convert(from value: Any?) throws -> ConvertibleTestStruct {
    guard let str = value as? String else { fatalError() }
    return ConvertibleTestStruct(value: str)
  }
}
