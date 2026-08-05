//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

@Suite("StringItem serialization")
struct StringItemTests {
  @Test
  func `works in the normal case`() throws {
    #expect(try StringItem(value: "hello").serialize() == "\"hello\"")
  }

  @Test
  func `escapes`() throws {
    #expect(try StringItem(value: "\\test\"").serialize() == "\"\\\\test\\\"\"")
  }

  @Test
  func `validates`() {
    let invalidString = "hello" + String(Character.fromHex("10"))
    let invalidChar = Character.fromHex("10")
    #expect {
      try StringItem(value: invalidString).serialize()
    } throws: { error in
      guard case SerializerError.invalidCharacterInString(string: invalidString, character: invalidChar) = error else {
        return false
      }
      return true
    }
  }
}
