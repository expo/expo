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

  @Test
  func `invocation params are JSON-safe and match the live event payload`() throws {
    let invocation = AppIntentInvocation(name: "nonFinite", params: ["x": .double(Double.nan)])

    #expect(invocation.params["x"] == .null)
    // The live event and the persisted invocation must carry the same value.
    #expect((invocation.toDict()["params"] as? [String: Any])?["x"] is NSNull)
    _ = try JSONEncoder().encode(invocation)
  }

  @Test
  func `foundation values from JavaScript convert to the matching case`() throws {
    let value = try AppIntentValue(
      foundationValue: [
        "string": "s",
        "int": NSNumber(value: 3),
        "double": NSNumber(value: 1.5),
        "null": NSNull(),
        "array": [NSNumber(value: 1), "two"],
      ] as [String: Any]
    )

    #expect(
      value
        == .object([
          "string": .string("s"),
          "int": .int(3),
          "double": .double(1.5),
          "null": .null,
          "array": .array([.int(1), .string("two")]),
        ])
    )
    #expect(try AppIntentValue(foundationValue: nil) == .null)
  }

  @Test
  func `numbers from JavaScript keep booleans and integers, and non-finite numbers become null`() throws {
    #expect(try AppIntentValue(foundationValue: kCFBooleanTrue) == .bool(true))
    // JavaScript has no integer type, so 250 arrives as the double 250.0. Decoding persisted params
    // turns it into an integer too, so both paths give Swift the same value.
    #expect(try AppIntentValue(foundationValue: NSNumber(value: 250.0)) == .int(250))
    #expect(try AppIntentValue(foundationValue: NSNumber(value: 1e300)) == .double(1e300))
    #expect(try AppIntentValue(foundationValue: NSNumber(value: Double.nan)) == .null)
    #expect(
      try AppIntentValue(foundationValue: [NSNumber(value: Double.infinity), NSNumber(value: -Double.infinity)])
        == .array([.null, .null])
    )
  }
}
