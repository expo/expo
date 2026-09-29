import ExpoModulesCore
import Foundation

public typealias AppIntentParams = [String: AppIntentValue]

// swift-format moves the brace to a new line for wrapped declarations.
// swiftlint:disable opening_brace
/// A Codable, Sendable JSON value used to persist App Intent params while JS is cold.
public enum AppIntentValue: Codable, Equatable, Sendable, ExpressibleByStringLiteral,
  ExpressibleByIntegerLiteral, ExpressibleByFloatLiteral, ExpressibleByBooleanLiteral,
  ExpressibleByArrayLiteral, ExpressibleByDictionaryLiteral, ExpressibleByNilLiteral, Convertible
{
  // swiftlint:enable opening_brace
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

  /// Converts a value passed from JavaScript, and throws for anything JSON cannot represent.
  init(jsonValue value: Any?) throws {
    guard let value, !(value is NSNull) else {
      self = .null
      return
    }
    switch value {
    case let string as String:
      self = .string(string)
    // swiftlint:disable:next legacy_objc_type
    case let number as NSNumber:
      self = try AppIntentValue(jsonNumber: number)
    case let array as [Any]:
      self = .array(try array.map { try AppIntentValue(jsonValue: $0) })
    case let object as [String: Any]:
      self = .object(try object.mapValues { try AppIntentValue(jsonValue: $0) })
    default:
      throw AppIntentValueNotJSONException("a value of type \(type(of: value))")
    }
  }

  // A Swift `Bool` bridges to `NSNumber` as well, and only its CoreFoundation type tells it apart.
  // swiftlint:disable:next legacy_objc_type
  private init(jsonNumber number: NSNumber) throws {
    if CFGetTypeID(number) == CFBooleanGetTypeID() {
      self = .bool(number.boolValue)
      return
    }
    let value = number.doubleValue
    guard value.isFinite else {
      throw AppIntentValueNotJSONException("the number \(value)")
    }
    // JavaScript has one number type. Whole numbers become `.int`, as they do when stored params are
    // decoded, so an intent sees the same case whichever way its params arrived.
    self = Int(exactly: value).map(AppIntentValue.int) ?? .double(value)
  }

  public static func convert(from value: Any?, appContext: AppContext) throws -> AppIntentValue {
    return try AppIntentValue(jsonValue: value)
  }

  /// Returns an equivalent value that JSON can represent.
  func jsonSafe() -> AppIntentValue {
    switch self {
    case .double(let value) where !value.isFinite:
      log.warn(
        "expo-app-intents replaced a non-finite number (\(value)) in App Intent params with null, "
          + "because JSON cannot represent NaN or infinity and the invocation would otherwise be "
          + "dropped. Pass a finite number, or a string if the exact value matters."
      )
      return .null
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

internal final class AppIntentValueNotJSONException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    return """
      expo-app-intents cannot pass \(param) as an App Intent param, because params must be JSON \
      values. Pass a string, a finite number, a boolean, null, or an array or object of those. For \
      example, pass a date as an ISO 8601 string.
      """
  }
}
