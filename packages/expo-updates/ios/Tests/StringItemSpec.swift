//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

class StringItemSpec : ExpoSpec {
  override class func spec() {
    describe("serialization") {
      it("works in the normal case") {
        expect(try StringItem(value: "hello").serialize()) == "\"hello\""
      }

      it("escapes") {
        expect(try StringItem(value: "\\test\"").serialize()) == "\"\\\\test\\\"\""
      }

      it("validates") {
        expect {
          try StringItem(value: "hello" + String(Character.fromHex("10"))).serialize()
        }.to(throwError(SerializerError.invalidCharacterInString(string: "hello" + String(Character.fromHex("10")), character: Character.fromHex("10"))))
      }
    }
  }
}
