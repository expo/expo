import Foundation
import Testing

@testable import ExpoAppIntents

@Suite("AppIntentValue")
struct AppIntentValueTests {
  @Test
  func `round-trips every case through Codable`() throws {
    let value = AppIntentValue.object([
      "string": .string("s"),
      "int": .int(3),
      "double": .double(1.5),
      "bool": .bool(true),
      "null": .null,
      "array": .array([.int(1), .string("two"), .bool(false)]),
    ])

    let data = try JSONEncoder().encode(value)
    let decoded = try JSONDecoder().decode(AppIntentValue.self, from: data)

    #expect(decoded == value)
  }

  @Test
  func `jsonSafe replaces non-finite numbers with null`() {
    #expect(AppIntentValue.double(Double.nan).jsonSafe() == .null)
    #expect(AppIntentValue.double(Double.infinity).jsonSafe() == .null)
    #expect(AppIntentValue.double(-Double.infinity).jsonSafe() == .null)
    #expect(AppIntentValue.double(1.5).jsonSafe() == .double(1.5))
  }

  @Test
  func `jsonSafe recurses into arrays and objects`() {
    let value = AppIntentValue.object([
      "list": .array([.double(Double.infinity), .int(1)]),
      "map": .object(["deep": .double(Double.nan)]),
    ])

    #expect(
      value.jsonSafe()
        == .object([
          "list": .array([.null, .int(1)]),
          "map": .object(["deep": .null]),
        ])
    )
  }

  /// The shapes `JavaScriptValue.getAny()` hands a `Convertible`: Swift `Bool`, `Double`, `String`,
  /// `NSNull`, arrays and string-keyed dictionaries.
  @Test
  func `converts every JSON value from JavaScript`() throws {
    let value = try AppIntentValue(jsonValue: [
      "string": "s",
      "whole": 3.0,
      "fraction": 1.5,
      "bool": true,
      "null": NSNull(),
      "array": [1.0, "two", false] as [Any],
      "object": ["nested": "value"],
    ] as [String: Any])

    #expect(
      value
        == .object([
          "string": .string("s"),
          "whole": .int(3),
          "fraction": .double(1.5),
          "bool": .bool(true),
          "null": .null,
          "array": .array([.int(1), .string("two"), .bool(false)]),
          "object": .object(["nested": .string("value")]),
        ])
    )
  }

  @Test
  func `keeps booleans and numbers apart`() throws {
    #expect(try AppIntentValue(jsonValue: true) == .bool(true))
    #expect(try AppIntentValue(jsonValue: 1.0) == .int(1))
    #expect(try AppIntentValue(jsonValue: 0.0) == .int(0))
    #expect(try AppIntentValue(jsonValue: NSNumber(value: 1)) == .int(1))
  }

  @Test
  func `accepts negative zero and very large finite numbers`() throws {
    #expect(try AppIntentValue(jsonValue: -0.0) == .int(0))
    #expect(try AppIntentValue(jsonValue: 1e300) == .double(1e300))
  }

  @Test
  func `converts a missing value to null`() throws {
    #expect(try AppIntentValue(jsonValue: nil) == .null)
  }

  @Test
  func `rejects values JSON cannot represent`() {
    let values: [Any] = [Date(), ["when": Date()], [Date()], Double.nan, Double.infinity]
    for value in values {
      #expect(throws: AppIntentValueNotJSONException.self, "\(value)") {
        _ = try AppIntentValue(jsonValue: value)
      }
    }
  }

  @Test
  func `invocation params are JSON-safe and match the live event payload`() throws {
    let invocation = AppIntentInvocation(name: "nonFinite", params: ["x": .double(Double.nan)])

    #expect(invocation.params["x"] == .null)
    // The live event and the persisted invocation must carry the same value.
    #expect((invocation.toDict()["params"] as? [String: Any])?["x"] is NSNull)
    _ = try JSONEncoder().encode(invocation)
  }
}
