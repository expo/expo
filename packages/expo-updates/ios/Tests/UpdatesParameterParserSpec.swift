//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest
@testable import EXUpdates

class UpdatesParameterParserSpec: XCTestCase {
  func testParameterParser() {
    let testCases: [(String, [String: Any])] = [
      ("", [:]),
      ("test; test1 =  stuff   ; test2 =  \"stuff; stuff\"; test3=\"stuff",
       ["test": NSNull(), "test1": "stuff", "test2": "stuff; stuff", "test3": "\"stuff"]),
      ("  test  ; test1=stuff   ;  ; test2=; test3; ",
       ["test": NSNull(), "test1": "stuff", "test2": NSNull(), "test3": NSNull()]),
      ("  test", ["test": NSNull()]),
      ("  ", [:]),
      (" = stuff ", [:]),
      ("text/plain; Charset=UTF-8", ["text/plain": NSNull(), "Charset": "UTF-8"]),
      ("param = \"stuff\\\"; more stuff\"", ["param": "stuff\\\"; more stuff"]),
      ("param = \"stuff\\\\\"; anotherparam", ["param": "stuff\\\\", "anotherparam": NSNull()]),
      ("foo/bar; param=\"baz=bat\"", ["foo/bar": NSNull(), "param": "baz=bat"]),

      // Expo-specific tests
      ("multipart/mixed; boundary=BbC04y", ["multipart/mixed": NSNull(), "boundary": "BbC04y"]),
      ("form-data; name=\"manifest\"; filename=\"hello2\"", ["form-data": NSNull(), "name": "manifest", "filename": "hello2"])
    ]

    let parser = UpdatesParameterParser()

    for (parameterString, expectedDictionary) in testCases {
      let parameters = parser.parseParameterString(parameterString, withDelimiter: ";")

      XCTAssertEqual(parameters.count, expectedDictionary.count,
                     "Parameter count mismatch for: '\(parameterString)'")

      for (key, expectedValue) in expectedDictionary {
        XCTAssertTrue(parameters.keys.contains(key),
                      "Missing key '\(key)' for: '\(parameterString)'")

        let actualValue = parameters[key]

        if expectedValue is NSNull && actualValue is NSNull {
          continue
        } else if let expectedString = expectedValue as? String,
                  let actualString = actualValue as? String {
          XCTAssertEqual(actualString, expectedString,
                         "Value mismatch for key '\(key)' in: '\(parameterString)'")
        } else {
          XCTFail("Type mismatch for key '\(key)' in: '\(parameterString)'. Expected: \(type(of: expectedValue)), Actual: \(type(of: actualValue ?? "nil"))")
        }
      }
    }
  }
}
