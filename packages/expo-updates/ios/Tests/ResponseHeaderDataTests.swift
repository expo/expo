//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

@Suite("ResponseHeaderData.dictionaryWithStructuredHeader")
struct ResponseHeaderDataTests {
  @Test
  func `SupportedTypes`() {
    let header = "string=\"string-0000\", true=?1, false=?0, integer=47, decimal=47.5"
    let expected: [String: Any] = [
      "string": "string-0000",
      "true": true,
      "false": false,
      "integer": 47,
      "decimal": 47.5
    ]
    let actual = ResponseHeaderData.dictionaryWithStructuredHeader(header)
    #expect(NSDictionary(dictionary: expected).isEqual(to: actual!))
  }

  @Test
  func `IgnoresOtherTypes`() {
    let header = "branch-name=\"rollout-1\", data=:w4ZibGV0w6ZydGUK:, list=(1 2)"
    let expected: [String: Any] = [
      "branch-name": "rollout-1"
    ]
    let actual = ResponseHeaderData.dictionaryWithStructuredHeader(header)
    #expect(NSDictionary(dictionary: expected).isEqual(to: actual!))
  }

  @Test
  func `IgnoresParameters`() {
    let header = "abc=123;a=1;b=2"
    let expected: [String: Any] = [
      "abc": 123
    ]
    let actual = ResponseHeaderData.dictionaryWithStructuredHeader(header)
    #expect(NSDictionary(dictionary: expected).isEqual(to: actual!))
  }

  @Test
  func `Empty`() {
    let header = ""
    let expected: [String: Any] = [:]
    let actual = ResponseHeaderData.dictionaryWithStructuredHeader(header)
    #expect(NSDictionary(dictionary: expected).isEqual(to: actual!))
  }

  @Test
  func `ParsingError`() {
    let header = "bad dictionary"
    #expect(ResponseHeaderData.dictionaryWithStructuredHeader(header) == nil)
  }
}
