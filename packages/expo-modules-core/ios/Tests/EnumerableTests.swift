// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("Enumerable")
struct EnumerableTests {
  // MARK: - createFromRawValue

  @Test
  func `createFromRawValue succeeds`() throws {
    #expect(try Position.create(fromRawValue: "top") == .top)
    #expect(try Position.create(fromRawValue: "right") == .right)
  }

  @Test
  func `createFromRawValue throws EnumNoSuchValueException`() {
    #expect(throws: EnumNoSuchValueException.self) {
      try Position.create(fromRawValue: "top-right")
    }
  }

  @Test
  func `createFromRawValue throws EnumCastingException`() {
    #expect(throws: EnumCastingException.self) {
      try Position.create(fromRawValue: 4729)
    }
    #expect(throws: EnumCastingException.self) {
      try Position.create(fromRawValue: ["left"])
    }
  }

  // MARK: - anyRawValue

  @Test
  func `anyRawValue returns type-erased raw value`() {
    #expect(Position.left.anyRawValue as? String == Position.left.rawValue)
  }

  // MARK: - allRawValues

  @Test
  func `allRawValues returns all raw values`() {
    #expect(Position.allRawValues as? [String] == ["top", "right", "bottom", "left"])
  }
}

private enum Position: String, Enumerable {
  case top
  case right
  case bottom
  case left
}
