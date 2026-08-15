//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

@Suite("StringList serialization")
struct StringListTests {
  @Test
  func `empty list`() {
    #expect(StringList(value: []).serialize() == "")
  }

  @Test
  func `basic list`() throws {
    #expect(try StringList(value: [StringItem(value: "10"), StringItem(value: "20")]).serialize() == "\"10\", \"20\"")
  }
}
