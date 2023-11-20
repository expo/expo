//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

@testable import EXUpdates

class ResponseHeaderDataSpec : ExpoSpec {
  override class func spec() {
    describe("dictionaryWithStructuredHeader") {
      it("SupportedTypes") {
        let header = "string=\"string-0000\", true=?1, false=?0, integer=47, decimal=47.5"
        let expected: [String : Any] = [
          "string": "string-0000",
          "true": true,
          "false": false,
          "integer": 47,
          "decimal": 47.5
        ]
        let actual = ResponseHeaderData.dictionaryWithStructuredHeader(header)
        expect(NSDictionary(dictionary: expected).isEqual(to: actual!)).to(beTrue())
      }
      
      it("IgnoresOtherTypes") {
        let header = "branch-name=\"rollout-1\", data=:w4ZibGV0w6ZydGUK:, list=(1 2)"
        let expected: [String : Any] = [
          "branch-name": "rollout-1"
        ]
        let actual = ResponseHeaderData.dictionaryWithStructuredHeader(header)
        expect(NSDictionary(dictionary: expected).isEqual(to: actual!)).to(beTrue())
      }
      
      it("IgnoresParameters") {
        let header = "abc=123;a=1;b=2"
        let expected: [String : Any] = [
          "abc": 123
        ]
        let actual = ResponseHeaderData.dictionaryWithStructuredHeader(header)
        expect(NSDictionary(dictionary: expected).isEqual(to: actual!)).to(beTrue())
      }
      
      it("Empty") {
        let header = ""
        let expected: [String : Any] = [:]
        let actual = ResponseHeaderData.dictionaryWithStructuredHeader(header)
        expect(NSDictionary(dictionary: expected).isEqual(to: actual!)).to(beTrue())
      }
      
      it("ParsingError") {
        let header = "bad dictionary"
        expect(ResponseHeaderData.dictionaryWithStructuredHeader(header)).to(beNil())
      }
    }
  }
}
