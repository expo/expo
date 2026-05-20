import Foundation
import Testing

@testable import ExpoObserve

@Suite("OTAnyValue conversion (otAnyValue)")
struct OTAnyValueConversionTests {
  @Test
  func `maps a Bool true to .bool`() throws {
    let value = try #require(otAnyValue(from: true))
    if case .bool(let bool) = value {
      #expect(bool == true)
    } else {
      Issue.record("Expected .bool, got \(value)")
    }
  }

  @Test
  func `maps a Bool false to .bool (and not .int)`() throws {
    let value = try #require(otAnyValue(from: false))
    if case .bool(let bool) = value {
      #expect(bool == false)
    } else {
      Issue.record("Expected .bool, got \(value)")
    }
  }

  @Test
  func `maps an Int to .int`() throws {
    let value = try #require(otAnyValue(from: 42))
    if case .int(let int) = value {
      #expect(int == 42)
    } else {
      Issue.record("Expected .int, got \(value)")
    }
  }

  @Test
  func `maps NSNumber(0) and NSNumber(1) to .int, not .bool`() throws {
    // The bug this guards against: `NSNumber as? Bool` succeeds for any 0/1 value, so without
    // the CFBoolean type-id check an integer-typed NSNumber holding 0 or 1 would emit as
    // `boolValue`. Inputs from the JS bridge and JSON-deserialized attributes arrive as
    // NSNumbers, so this is the realistic boxed shape — a Swift-pure `Int(0)` does not bridge
    // until forced and would fall through `as? Bool` cleanly even without the fix.
    for raw: Int in [0, 1] {
      let value = try #require(otAnyValue(from: NSNumber(value: raw)))
      if case .int(let int) = value {
        #expect(int == Int64(raw))
      } else {
        Issue.record("Expected .int for NSNumber(\(raw)), got \(value)")
      }
    }
  }

  @Test
  func `maps NSNumber boolean to .bool`() throws {
    // A genuine boxed Bool is backed by CFBoolean (different type id from a numeric NSNumber),
    // so the same call path that rejects NSNumber(0) as a bool still accepts NSNumber(true).
    for raw in [true, false] {
      let value = try #require(otAnyValue(from: NSNumber(value: raw)))
      if case .bool(let bool) = value {
        #expect(bool == raw)
      } else {
        Issue.record("Expected .bool for NSNumber(\(raw)), got \(value)")
      }
    }
  }

  @Test
  func `maps an Int64 to .int`() throws {
    let value = try #require(otAnyValue(from: Int64(9_999_999_999)))
    if case .int(let int) = value {
      #expect(int == 9_999_999_999)
    } else {
      Issue.record("Expected .int, got \(value)")
    }
  }

  @Test
  func `maps a UInt within Int64 range to .int`() throws {
    let value = try #require(otAnyValue(from: UInt(7)))
    if case .int(let int) = value {
      #expect(int == 7)
    } else {
      Issue.record("Expected .int, got \(value)")
    }
  }

  @Test
  func `drops a UInt that overflows Int64`() {
    #expect(otAnyValue(from: UInt.max) == nil)
  }

  @Test
  func `maps a Double to .double`() throws {
    let value = try #require(otAnyValue(from: 3.14))
    if case .double(let double) = value {
      #expect(double == 3.14)
    } else {
      Issue.record("Expected .double, got \(value)")
    }
  }

  @Test
  func `drops Double NaN`() {
    #expect(otAnyValue(from: Double.nan) == nil)
  }

  @Test
  func `drops positive infinity`() {
    #expect(otAnyValue(from: Double.infinity) == nil)
  }

  @Test
  func `drops negative infinity`() {
    #expect(otAnyValue(from: -Double.infinity) == nil)
  }

  @Test
  func `maps a finite Float to .double`() throws {
    let value = try #require(otAnyValue(from: Float(1.5)))
    if case .double(let double) = value {
      #expect(double == 1.5)
    } else {
      Issue.record("Expected .double, got \(value)")
    }
  }

  @Test
  func `drops a non-finite Float`() {
    #expect(otAnyValue(from: Float.nan) == nil)
    #expect(otAnyValue(from: Float.infinity) == nil)
  }

  @Test
  func `maps a String to .string`() throws {
    let value = try #require(otAnyValue(from: "hello"))
    if case .string(let string) = value {
      #expect(string == "hello")
    } else {
      Issue.record("Expected .string, got \(value)")
    }
  }

  @Test
  func `maps a homogeneous array to .array`() throws {
    let value = try #require(otAnyValue(from: [1, 2, 3] as [Any]))
    if case .array(let elements) = value {
      #expect(elements.count == 3)
    } else {
      Issue.record("Expected .array, got \(value)")
    }
  }

  @Test
  func `maps a heterogeneous array to .array`() throws {
    let value = try #require(otAnyValue(from: ["x", 1, true] as [Any]))
    if case .array(let elements) = value {
      #expect(elements.count == 3)
    } else {
      Issue.record("Expected .array, got \(value)")
    }
  }

  @Test
  func `drops an array containing an unrepresentable element`() {
    let date = Date()
    #expect(otAnyValue(from: [1, date, 3] as [Any]) == nil)
  }

  @Test
  func `maps a dictionary to .kvlist`() throws {
    let value = try #require(otAnyValue(from: ["a": 1, "b": "x"] as [String: Any]))
    if case .kvlist(let pairs) = value {
      #expect(pairs.count == 2)
      #expect(pairs.contains { $0.key == "a" })
      #expect(pairs.contains { $0.key == "b" })
    } else {
      Issue.record("Expected .kvlist, got \(value)")
    }
  }

  @Test
  func `drops a dictionary containing an unrepresentable value`() {
    let date = Date()
    #expect(otAnyValue(from: ["ok": 1, "bad": date] as [String: Any]) == nil)
  }

  @Test
  func `drops an unsupported value type`() {
    let date = Date()
    #expect(otAnyValue(from: date) == nil)
  }
}

@Suite("OTAnyValue Codable encoding")
struct OTAnyValueCodableTests {
  private func encode(_ value: OTAnyValue) throws -> [String: Any] {
    let data = try JSONEncoder().encode(value)
    return try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
  }

  @Test
  func `encodes .string under stringValue`() throws {
    let json = try encode(.string("hello"))
    #expect(json.count == 1)
    #expect(json["stringValue"] as? String == "hello")
  }

  @Test
  func `encodes .int under intValue as a JSON number`() throws {
    let json = try encode(.int(42))
    #expect(json.count == 1)
    // OTLP/JSON spec stringifies int64 to avoid JS-number precision loss, but the EAS observability
    // backend (ClickHouse) requires a JSON number — see OTAnyValue.encode(to:).
    #expect(json["intValue"] as? Int64 == 42)
  }

  @Test
  func `encodes .double under doubleValue as a JSON number`() throws {
    let json = try encode(.double(3.14))
    #expect(json.count == 1)
    #expect(json["doubleValue"] as? Double == 3.14)
  }

  @Test
  func `encodes .bool under boolValue`() throws {
    let json = try encode(.bool(true))
    #expect(json.count == 1)
    #expect(json["boolValue"] as? Bool == true)
  }

  @Test
  func `encodes .array as arrayValue.values`() throws {
    let json = try encode(.array([.int(1), .string("x")]))
    #expect(json.count == 1)
    let arrayValue = try #require(json["arrayValue"] as? [String: Any])
    let values = try #require(arrayValue["values"] as? [[String: Any]])
    #expect(values.count == 2)
    #expect(values[0]["intValue"] as? Int64 == 1)
    #expect(values[1]["stringValue"] as? String == "x")
  }

  @Test
  func `encodes .kvlist as kvlistValue.values with key/value pairs`() throws {
    let json = try encode(.kvlist([
      OTKeyValue(key: "a", value: .int(1)),
      OTKeyValue(key: "b", value: .string("x"))
    ]))
    #expect(json.count == 1)
    let kvlistValue = try #require(json["kvlistValue"] as? [String: Any])
    let values = try #require(kvlistValue["values"] as? [[String: Any]])
    #expect(values.count == 2)
    #expect(values[0]["key"] as? String == "a")
    let firstValue = try #require(values[0]["value"] as? [String: Any])
    #expect(firstValue["intValue"] as? Int64 == 1)
  }

  @Test
  func `roundtrips through Codable`() throws {
    let original: OTAnyValue = .kvlist([
      OTKeyValue(key: "name", value: .string("hello")),
      OTKeyValue(key: "count", value: .int(3)),
      OTKeyValue(key: "ratio", value: .double(0.5)),
      OTKeyValue(key: "ok", value: .bool(true)),
      OTKeyValue(key: "tags", value: .array([.string("a"), .string("b")]))
    ])
    let data = try JSONEncoder().encode(original)
    let decoded = try JSONDecoder().decode(OTAnyValue.self, from: data)
    if case .kvlist(let pairs) = decoded {
      #expect(pairs.count == 5)
    } else {
      Issue.record("Expected .kvlist after roundtrip")
    }
  }
}
