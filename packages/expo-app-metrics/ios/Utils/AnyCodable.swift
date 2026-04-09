/**
 Type-erased struct that is used to encode/decode types that use `Any` which itself is not conforming to `Encodable` nor `Decodable`.
 */
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

    switch value {
    case let value as Int:
      try container.encode(value)
    case let value as UInt:
      try container.encode(value)
    case let value as Double:
      try container.encode(value)
    case let value as Bool:
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
}
