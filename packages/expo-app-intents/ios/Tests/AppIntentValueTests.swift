import XCTest

@testable import ExpoAppIntents

final class AppIntentValueTests: XCTestCase {
  func testRoundTripsEveryCase() throws {
    let value = AppIntentValue.object([
      "string": .string("s"),
      "int": .int(3),
      "double": .double(1.5),
      "bool": .bool(true),
      "null": .null,
      "array": .array([.int(1), .string("two"), .bool(false)])
    ])

    let data = try JSONEncoder().encode(value)
    let decoded = try JSONDecoder().decode(AppIntentValue.self, from: data)

    XCTAssertEqual(decoded, value)
  }

  func testJSONSafeReplacesNonFiniteNumbersWithNull() {
    XCTAssertEqual(AppIntentValue.double(Double.nan).jsonSafe(), .null)
    XCTAssertEqual(AppIntentValue.double(Double.infinity).jsonSafe(), .null)
    XCTAssertEqual(AppIntentValue.double(-Double.infinity).jsonSafe(), .null)
    XCTAssertEqual(AppIntentValue.double(1.5).jsonSafe(), .double(1.5))
  }

  /**
   An `Int` past JavaScript's safe-integer range is rounded when it reaches JavaScript, but JSON and
   this enum both hold it exactly. It is passed through rather than replaced, so the persisted value
   stays exact and the caller keeps a nearly right number instead of `null`.
   */
  func testJSONSafeKeepsWholeNumbersBeyondTheJavaScriptSafeRange() throws {
    let beyondSafeRange = AppIntentValue.int(9_007_199_254_740_993)

    XCTAssertEqual(beyondSafeRange.jsonSafe(), beyondSafeRange)
    XCTAssertEqual(AppIntentValue.int(-9_007_199_254_740_993).jsonSafe(), .int(-9_007_199_254_740_993))
    XCTAssertEqual(AppIntentValue.int(9_007_199_254_740_991).jsonSafe(), .int(9_007_199_254_740_991))

    // Persisting and reading it back must not change a digit.
    let data = try JSONEncoder().encode(beyondSafeRange)
    XCTAssertEqual(try JSONDecoder().decode(AppIntentValue.self, from: data), beyondSafeRange)
  }

  func testJSONSafeRecursesIntoArraysAndObjects() {
    let value = AppIntentValue.object([
      "list": .array([.double(Double.infinity), .int(1)]),
      "map": .object(["deep": .double(Double.nan)])
    ])

    XCTAssertEqual(
      value.jsonSafe(),
      .object([
        "list": .array([.null, .int(1)]),
        "map": .object(["deep": .null])
      ])
    )
  }

  func testInvocationParamsAreJSONSafeAndMatchTheLiveEventPayload() throws {
    let invocation = AppIntentInvocation(name: "nonFinite", params: ["x": .double(Double.nan)])

    XCTAssertEqual(invocation.params["x"], .null)
    // The live event and the persisted invocation must carry the same value.
    XCTAssertTrue((invocation.toDict()["params"] as? [String: Any])?["x"] is NSNull)
    XCTAssertNoThrow(try JSONEncoder().encode(invocation))
  }
}
