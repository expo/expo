import Foundation

public typealias AppIntentParams = [String: AppIntentValue]

/**
 A Codable, Sendable JSON value used to persist App Intent params while JS is cold.

 ExpoModulesCore performs the final conversion to JavaScript. This type exists before
 that, so queued invocations stay typed, serializable, and concurrency-safe.
 */
public enum AppIntentValue: Codable, Equatable, Sendable, ExpressibleByStringLiteral,
  ExpressibleByIntegerLiteral, ExpressibleByFloatLiteral, ExpressibleByBooleanLiteral,
  ExpressibleByArrayLiteral, ExpressibleByDictionaryLiteral, ExpressibleByNilLiteral {
  case string(String)
  case int(Int)
  case double(Double)
  case bool(Bool)
  case array([AppIntentValue])
  case object([String: AppIntentValue])
  case null

  public init(_ value: String) {
    self = .string(value)
  }

  public init(_ value: Int) {
    self = .int(value)
  }

  public init(_ value: Double) {
    self = .double(value)
  }

  public init(_ value: Bool) {
    self = .bool(value)
  }

  init?(any value: Any) {
    switch value {
    case let value as AppIntentValue:
      self = value
    case let value as String:
      self = .string(value)
    case let value as Int:
      self = .int(value)
    case let value as Double:
      self = .double(value)
    case let value as Float:
      self = .double(Double(value))
    case let value as Bool:
      self = .bool(value)
    // swiftlint:disable:next legacy_objc_type
    case let value as NSNumber:
      if CFGetTypeID(value) == CFBooleanGetTypeID() {
        self = .bool(value.boolValue)
      } else {
        self = .double(value.doubleValue)
      }
    case is NSNull:
      self = .null
    case let value as [Any]:
      self = .array(value.compactMap(AppIntentValue.init(any:)))
    case let value as [String: Any]:
      self = .object(value.compactMapValues(AppIntentValue.init(any:)))
    default:
      return nil
    }
  }

  var foundationValue: Any {
    switch self {
    case .string(let value):
      return value
    case .int(let value):
      return value
    case .double(let value):
      return value
    case .bool(let value):
      return value
    case .array(let value):
      return value.map(\.foundationValue)
    case .object(let value):
      return value.mapValues(\.foundationValue)
    case .null:
      return NSNull()
    }
  }

  public init(from decoder: Decoder) throws {
    let container = try decoder.singleValueContainer()
    if container.decodeNil() {
      self = .null
    } else if let value = try? container.decode(Bool.self) {
      self = .bool(value)
    } else if let value = try? container.decode(Int.self) {
      self = .int(value)
    } else if let value = try? container.decode(Double.self) {
      self = .double(value)
    } else if let value = try? container.decode(String.self) {
      self = .string(value)
    } else if let value = try? container.decode([AppIntentValue].self) {
      self = .array(value)
    } else if let value = try? container.decode([String: AppIntentValue].self) {
      self = .object(value)
    } else {
      throw DecodingError.dataCorruptedError(
        in: container,
        debugDescription: "Unsupported App Intent payload value"
      )
    }
  }

  public func encode(to encoder: Encoder) throws {
    var container = encoder.singleValueContainer()
    switch self {
    case .string(let value):
      try container.encode(value)
    case .int(let value):
      try container.encode(value)
    case .double(let value):
      try container.encode(value)
    case .bool(let value):
      try container.encode(value)
    case .array(let value):
      try container.encode(value)
    case .object(let value):
      try container.encode(value)
    case .null:
      try container.encodeNil()
    }
  }

  public init(stringLiteral value: String) {
    self = .string(value)
  }

  public init(integerLiteral value: Int) {
    self = .int(value)
  }

  public init(floatLiteral value: Double) {
    self = .double(value)
  }

  public init(booleanLiteral value: Bool) {
    self = .bool(value)
  }

  public init(arrayLiteral elements: AppIntentValue...) {
    self = .array(elements)
  }

  public init(dictionaryLiteral elements: (String, AppIntentValue)...) {
    self = .object(Dictionary(uniqueKeysWithValues: elements))
  }

  public init(nilLiteral: ()) {
    self = .null
  }
}
