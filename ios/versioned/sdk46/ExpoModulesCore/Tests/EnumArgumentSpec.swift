// Copyright 2022-present 650 Industries. All rights reserved.

import ABI46_0_0ExpoModulesTestCore

@testable import ABI46_0_0ExpoModulesCore

final class EnumArgumentSpec: ExpoSpec {
  override func spec() {
    describe("static createFromRawValue") {
      it("succeeds") {
        expect(try Position.create(fromRawValue: "top")) == .top
        expect(try Position.create(fromRawValue: "right")) == .right
      }
      it("throws EnumNoSuchValueException") {
        expect { try Position.create(fromRawValue: "top-right") }.to(
          throwError(errorType: EnumNoSuchValueException.self)
        )
      }
      it("throws EnumCastingException") {
        expect { try Position.create(fromRawValue: 4729) }.to(
          throwError(errorType: EnumCastingException.self)
        )
        expect { try Position.create(fromRawValue: ["left"]) }.to(
          throwError(errorType: EnumCastingException.self)
        )
      }
    }

    describe("anyRawValue") {
      it("returns type-erased raw value") {
        expect(Position.left.anyRawValue as? String) == Position.left.rawValue
      }
    }

    describe("allRawValues") {
      it("returns all raw values") {
        expect(Position.allRawValues as? [String]) == ["top", "right", "bottom", "left"]
      }
    }
  }
}

fileprivate enum Position: String, EnumArgument {
  case top
  case right
  case bottom
  case left
}
