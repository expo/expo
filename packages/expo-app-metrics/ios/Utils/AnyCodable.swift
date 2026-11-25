import CoreFoundation
import Foundation

/// Type-erased struct that is used to encode/decode types that use `Any` which itself is not conforming to `Encodable` nor `Decodable`.
public struct AnyCodable: Codable, Sendable {
  // Similarly, `Any` does not conform to `Sendable`, but it is safe
  // to send it over different isolation domains as it is immutable.
  public nonisolated(unsafe) let value: Any?

  init<T>(_ value: T) {
    self.value = value
  }

  public init(from decoder: Decoder) throws {
    let container = try decoder.singleValueContainer()

    if let value = try? container.decode(Int.self) {
      self.value = value
    } else if let value = try? container.decode(UInt.self) {
      self.value = value
    } else if let value = try? container.decode(Double.self) {
      self.value = value
    } else if let value = try? container.decode(Bool.self) {
      self.value = value
    } else if let value = try? container.decode(String.self) {
      self.value = value
    } else if let value = try? container.decode([String: AnyCodable].self) {
      self.value = value.mapValues { $0.value }
    } else if let value = try? container.decode([AnyCodable].self) {
      self.value = value.map { $0.value }
    } else {
      self.value = nil
    }
  }

  public func encode(to encoder: Encoder) throws {
    var container = encoder.singleValueContainer()

    // `Bool` must come before the integer cases. Swift bridges `Bool` and the numeric types
    // bidirectionally for `as?`, and on Objective-C runtime values, `Bool` round-trips through
    // `NSNumber` indistinguishably from an integer. Matching `Bool` first preserves type, but the
    // `as? Bool` cast alone isn't enough: a numeric `0`/`1` boxed as `NSNumber` also matches it, so
    // it would serialize as `false`/`true`. Gate the `Bool` case on the value actually being a
    // `CFBoolean` so genuine numbers fall through to the integer cases.
    switch value {
    case let value as Bool where AnyCodable.isBoolean(self.value):
      try container.encode(value)
    case let value as Int:
      try container.encode(value)
    case let value as Int32:
      try container.encode(value)
    case let value as Int64:
      try container.encode(value)
    case let value as UInt:
      try container.encode(value)
    case let value as UInt32:
      try container.encode(value)
    case let value as UInt64:
      try container.encode(value)
    case let value as Double:
      try container.encode(value)
    case let value as String:
      try container.encode(value)
    case let value as [String: Any]:
      try container.encode(value.mapValues(AnyCodable.init))
    case let value as [Any]:
      try container.encode(value.map(AnyCodable.init))
    default:
      try container.encodeNil()
    }
  }

  /// Whether the boxed value is a genuine boolean rather than a numeric `NSNumber` that merely casts
  /// to `Bool` (any `0`/`1`). Foundation bridges both to `NSNumber`, so the only reliable test is the
  /// underlying CoreFoundation type: real booleans are backed by `CFBoolean`.
  private static func isBoolean(_ value: Any?) -> Bool {
    guard let value else {
      return false
    }
    return CFGetTypeID(value as CFTypeRef) == CFBooleanGetTypeID()
  }
}
