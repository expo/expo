//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

@Suite("StringDictionary serialization")
struct StringDictionaryTests {
  @Test
  func `validates basic cases`() throws {
    #expect(try StringDictionary(value: ["hello": StringItem(value: "world")]).serialize() == "hello=\"world\"")
    #expect(try StringDictionary(value: ["*hello": StringItem(value: "world")]).serialize() == "*hello=\"world\"")
    #expect(try StringDictionary(value: ["*_-.*": StringItem(value: "")]).serialize() == "*_-.*=\"\"")

    // escapes
    #expect(try StringDictionary(value: ["test": StringItem(value: "\\test\"")]).serialize() == "test=\"\\\\test\\\"\"")
  }

  @Test
  func `throws for empty key`() {
    #expect {
      try StringDictionary(value: ["": StringItem(value: "world")]).serialize()
    } throws: { error in
      guard case SerializerError.emptyKey = error else {
        return false
      }
      return true
    }
  }

  @Test
  func `throws for capital letter in key`() {
    #expect {
      try StringDictionary(value: ["Hello": StringItem(value: "world")]).serialize()
    } throws: { error in
      guard case SerializerError.invalidCharacterInKey(key: "Hello", character: "H") = error else {
        return false
      }
      return true
    }
  }

  @Test
  func `throws for invalid character in key`() {
    #expect {
      try StringDictionary(value: ["hell&o": StringItem(value: "world")]).serialize()
    } throws: { error in
      guard case SerializerError.invalidCharacterInKey(key: "hell&o", character: "&") = error else {
        return false
      }
      return true
    }
  }
}
