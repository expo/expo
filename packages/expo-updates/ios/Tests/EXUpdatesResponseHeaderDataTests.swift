//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import EXUpdates

class EXUpdatesResponseHeaderDataTests : XCTestCase {
  func testDictionaryWithStructuredHeader_SupportedTypes() {
    let header = "string=\"string-0000\", true=?1, false=?0, integer=47, decimal=47.5"
    let expected: [String : Any] = [
      "string": "string-0000",
      "true": true,
      "false": false,
      "integer": 47,
      "decimal": 47.5
    ]
    let actual = EXUpdatesResponseHeaderData.dictionaryWithStructuredHeader(header)
    XCTAssertTrue(NSDictionary(dictionary: expected).isEqual(to: actual!))
  }
  
  func testDictionaryWithStructuredHeader_IgnoresOtherTypes() {
    let header = "branch-name=\"rollout-1\", data=:w4ZibGV0w6ZydGUK:, list=(1 2)"
    let expected: [String : Any] = [
      "branch-name": "rollout-1"
    ]
    let actual = EXUpdatesResponseHeaderData.dictionaryWithStructuredHeader(header)
    XCTAssertTrue(NSDictionary(dictionary: expected).isEqual(to: actual!))
  }
  
  func testDictionaryWithStructuredHeader_IgnoresParameters() {
    let header = "abc=123;a=1;b=2"
    let expected: [String : Any] = [
      "abc": 123
    ]
    let actual = EXUpdatesResponseHeaderData.dictionaryWithStructuredHeader(header)
    XCTAssertTrue(NSDictionary(dictionary: expected).isEqual(to: actual!))
  }
  
  func testDictionaryWithStructuredHeader_Empty() {
    let header = ""
    let expected: [String : Any] = [:]
    let actual = EXUpdatesResponseHeaderData.dictionaryWithStructuredHeader(header)
    XCTAssertTrue(NSDictionary(dictionary: expected).isEqual(to: actual!))
  }
  
  func testDictionaryWithStructuredHeader_ParsingError() {
    let header = "bad dictionary"
    XCTAssertNil(EXUpdatesResponseHeaderData.dictionaryWithStructuredHeader(header))
  }
}
