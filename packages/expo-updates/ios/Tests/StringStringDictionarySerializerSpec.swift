//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

class StringStringDictionarySerializerSpec : ExpoSpec {
  override class func spec() {
    describe("serialization") {
      it("validates") {
        expect(try StringStringDictionarySerializer.serialize(dictionary: ["hello": "world"])) == "hello=\"world\""
        expect(try StringStringDictionarySerializer.serialize(dictionary: ["*hello": "world"])) == "*hello=\"world\""
        expect(try StringStringDictionarySerializer.serialize(dictionary: ["*_-.*": ""])) == "*_-.*=\"\""

        // escapes
        expect(try StringStringDictionarySerializer.serialize(dictionary: ["test": "\\test\""])) == "test=\"\\\\test\\\"\""

        // empty key
        expect {
          try StringStringDictionarySerializer.serialize(dictionary: ["": "world"])
        }.to(throwError(SerializerError.emptyKey))

        // capital letter in key
        expect {
          try StringStringDictionarySerializer.serialize(dictionary: ["Hello": "world"])
        }.to(throwError(SerializerError.invalidCharacterInKey(key: "Hello", character: "H")))

        // capital letter in key
        expect {
          try StringStringDictionarySerializer.serialize(dictionary: ["Hello": "world"])
        }.to(throwError(SerializerError.invalidCharacterInKey(key: "Hello", character: "H")))

        // invalid character in key
        expect {
          try StringStringDictionarySerializer.serialize(dictionary: ["Hell&o": "world"])
        }.to(throwError(SerializerError.invalidCharacterInKey(key: "hell&o", character: "&")))
      }
    }
  }
}
