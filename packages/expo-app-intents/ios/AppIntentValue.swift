import ExpoModulesCore
import Foundation

public typealias AppIntentParams = [String: AppIntentValue]

/// Thrown when a value from JavaScript has a type that `AppIntentValue` cannot hold.
internal final class AppIntentUnsupportedValueException: GenericException<String>, LocalizedError, @unchecked Sendable {
  override var reason: String {
    "expo-app-intents could not read a value of type '\(param)' that came from JavaScript, because App Intent "
      + "values must be JSON: a string, number, boolean, null, array, or plain object. Convert the value to one "
      + "of these types before you pass it on."
  }

  var errorDescription: String? {
    reason
  }
}

// swift-format moves the brace to a new line for wrapped declarations.
// swiftlint:disable opening_brace
/// A Codable, Sendable JSON value used to persist App Intent params while JS is cold.
public enum AppIntentValue: Codable, Equatable, Sendable, ExpressibleByStringLiteral,
  ExpressibleByIntegerLiteral, ExpressibleByFloatLiteral, ExpressibleByBooleanLiteral,
  ExpressibleByArrayLiteral, ExpressibleByDictionaryLiteral, ExpressibleByNilLiteral
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

  /// Converts a Foundation value from JavaScript through JSON, with NaN as `.null` and infinity as the max double.
  init(foundationValue value: Any?) throws {
    // Wrapped in an array, because JSONSerialization only accepts an array or a dictionary at the top.
    var wrapped: [Any] = [value ?? NSNull()]
    // Checked rather than caught: JSONSerialization raises an Objective-C exception for an invalid
    // object, which Swift cannot catch.
    if !JSONSerialization.isValidJSONObject(wrapped) {
      wrapped = [Self.replacingNonFiniteNumbers(in: value ?? NSNull())]
      guard JSONSerialization.isValidJSONObject(wrapped) else {
        throw AppIntentUnsupportedValueException(String(describing: type(of: value ?? NSNull())))
      }
    }
    let data = try JSONSerialization.data(withJSONObject: wrapped)
    guard case .array(let values) = try JSONDecoder().decode(AppIntentValue.self, from: data),
      let decoded = values.first
    else {
      throw AppIntentUnsupportedValueException(String(describing: type(of: value ?? NSNull())))
    }
    self = decoded
  }

  private static func replacingNonFiniteNumbers(in value: Any) -> Any {
    switch value {
    case let number as NSNumber where CFGetTypeID(number) != CFBooleanGetTypeID() && !number.doubleValue.isFinite:
      let double = number.doubleValue
      log.warn(
        "expo-app-intents replaced a non-finite number (\(double)) that came from JavaScript, because JSON cannot "
          + "represent NaN or infinity. Return a finite number, or a string if the exact value matters."
      )
      if double.isNaN {
        return NSNull()
      }
      return double > 0 ? Double.greatestFiniteMagnitude : -Double.greatestFiniteMagnitude
    case let array as [Any]:
      return array.map(replacingNonFiniteNumbers(in:))
    case let object as [String: Any]:
      return object.mapValues(replacingNonFiniteNumbers(in:))
    default:
      return value
    }
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
