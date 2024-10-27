//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

class StringDictionarySpec : ExpoSpec {
  override class func spec() {
    describe("serialization") {
      it("validates") {
        expect(try StringDictionary(value: ["hello": StringItem(value: "world")]).serialize()) == "hello=\"world\""
        expect(try StringDictionary(value: ["*hello": StringItem(value: "world")]).serialize()) == "*hello=\"world\""
        expect(try StringDictionary(value: ["*_-.*": StringItem(value: "")]).serialize()) == "*_-.*=\"\""

        // escapes
        expect(try StringDictionary(value: ["test": StringItem(value: "\\test\"")]).serialize()) == "test=\"\\\\test\\\"\""

        // empty key
        expect {
          try StringDictionary(value: ["": StringItem(value: "world")]).serialize()
        }.to(throwError(SerializerError.emptyKey))

        // capital letter in key
        expect {
          try StringDictionary(value: ["Hello": StringItem(value: "world")]).serialize()
        }.to(throwError(SerializerError.invalidCharacterInKey(key: "Hello", character: "H")))

        // capital letter in key
        expect {
          try StringDictionary(value: ["Hello": StringItem(value: "world")]).serialize()
        }.to(throwError(SerializerError.invalidCharacterInKey(key: "Hello", character: "H")))

        // invalid character in key
        expect {
          try StringDictionary(value: ["Hell&o": StringItem(value: "world")]).serialize()
        }.to(throwError(SerializerError.invalidCharacterInKey(key: "hell&o", character: "&")))
      }
    }
  }
}
