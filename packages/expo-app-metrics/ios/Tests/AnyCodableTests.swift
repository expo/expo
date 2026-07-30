import Foundation
import Testing

@testable import ExpoAppMetrics

@Suite("AnyCodable")
struct AnyCodableTests {
  @Test
  func `encodes a real boolean as a JSON boolean`() throws {
    #expect(try encodedJSON(for: true) == "true")
    #expect(try encodedJSON(for: false) == "false")
  }

  @Test
  func `encodes integer 0 and 1 as numbers, not booleans`() throws {
    // `0`/`1` boxed through Foundation become `NSNumber`, which `as? Bool` happily matches. The
    // encoder must distinguish a genuine `Bool` from such a number so numeric attributes (e.g.
    // `expo.memory.available` returning 0 on the simulator) don't serialize as `false`/`true`.
    #expect(try encodedJSON(for: Int(0)) == "0")
    #expect(try encodedJSON(for: Int(1)) == "1")
    #expect(try encodedJSON(for: UInt(0)) == "0")
    #expect(try encodedJSON(for: UInt(1)) == "1")
  }

  @Test
  func `preserves numeric 0 and 1 carried as Any through Foundation bridging`() throws {
    // Mirrors the real path: attributes live in `[String: Any]`, so the values arrive as `NSNumber`.
    let attributes: [String: Any] = ["available": UInt(0), "warningsCount": 1]
    let json = try encodedJSON(for: attributes)
    #expect(json.contains("\"available\":0"))
    #expect(json.contains("\"warningsCount\":1"))
    #expect(!json.contains("false"))
    #expect(!json.contains("true"))
  }
}

private func encodedJSON<T>(for value: T) throws -> String {
  let encoder = JSONEncoder()
  encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
  let data = try encoder.encode(AnyCodable(value))
  return String(decoding: data, as: UTF8.self)
}
