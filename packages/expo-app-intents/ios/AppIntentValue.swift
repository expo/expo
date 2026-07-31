import Foundation
import ExpoModulesCore

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
  /**
   A whole number.

   JavaScript has no integer type, so ExpoModulesCore delivers this as a `Number`, which is a
   double. Magnitudes above `Number.MAX_SAFE_INTEGER` (2^53 - 1) therefore arrive in JavaScript
   rounded, even though JSON and this enum both keep them exactly. The value is passed through
   rather than replaced, because the rounded number is still closer to the truth than `null` would
   be, and `jsonSafe()` logs a warning so the loss is not silent. Pass such a value as a `String`
   when every digit matters, which is the same advice as for a 64-bit id in any other JSON API.
   */
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

  /// The largest magnitude JavaScript represents exactly: `Number.MAX_SAFE_INTEGER`, 2^53 - 1.
  private static let maxSafeJSInteger = 9_007_199_254_740_991

  /**
   Returns an equivalent value that JSON can represent.

   `Double.nan` and the infinities have no JSON form, so `JSONEncoder` throws on them. Persisting
   invocations happens before JS is involved and has nowhere to report that error to, so an
   unrepresentable number would silently drop the invocation that carries it. Such numbers become
   `null` instead, which is also what `JSON.stringify` produces for them in JavaScript, and the
   substitution is logged.

   An `Int` beyond JavaScript's safe-integer range is a different problem and gets a different
   answer: JSON stores it exactly, so nothing here has to change it, but JavaScript still receives
   it rounded. It is passed through with a warning rather than replaced, because dropping a mostly
   correct number would lose more than it saves. See the note on `case int`.
   */
  func jsonSafe() -> AppIntentValue {
    switch self {
    case .double(let value) where !value.isFinite:
      log.warn(
        "expo-app-intents replaced a non-finite number (\(value)) in App Intent params with null, "
          + "because JSON cannot represent NaN or infinity and the invocation would otherwise be "
          + "dropped. Pass a finite number, or a string if the exact value matters."
      )
      return .null
    case .int(let value) where value.magnitude > Self.maxSafeJSInteger.magnitude:
      log.warn(
        "expo-app-intents is passing the whole number \(value) in App Intent params to JavaScript, "
          + "where it will be rounded: it is larger than Number.MAX_SAFE_INTEGER "
          + "(\(Self.maxSafeJSInteger)), and JavaScript has no exact type for it. The persisted "
          + "value stays exact. Pass it as a string if every digit matters."
      )
      return self
    case .array(let values):
      return .array(values.map { $0.jsonSafe() })
    case .object(let values):
      return .object(values.mapValues { $0.jsonSafe() })
    default:
      return self
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
