//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

@Suite("UpdatesParameterParser")
struct UpdatesParameterParserTests {
  static let testCases: [(String, [String: Any])] = [
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

  @Test
  func `parses parameter strings`() {
    let parser = UpdatesParameterParser()

    for (parameterString, expectedDictionary) in Self.testCases {
      let parameters = parser.parseParameterString(parameterString, withDelimiter: ";")

      #expect(parameters.count == expectedDictionary.count,
              "Parameter count mismatch for: '\(parameterString)'")

      for (key, expectedValue) in expectedDictionary {
        #expect(parameters.keys.contains(key),
                "Missing key '\(key)' for: '\(parameterString)'")

        let actualValue = parameters[key]

        if expectedValue is NSNull && actualValue is NSNull {
          continue
        } else if let expectedString = expectedValue as? String,
                  let actualString = actualValue as? String {
          #expect(actualString == expectedString,
                  "Value mismatch for key '\(key)' in: '\(parameterString)'")
        } else {
          Issue.record("Type mismatch for key '\(key)' in: '\(parameterString)'. Expected: \(type(of: expectedValue)), Actual: \(type(of: actualValue ?? "nil" as Any))")
        }
      }
    }
  }
}
