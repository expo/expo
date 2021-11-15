
internal final class Conversions {
  /**
   Converts an array to tuple. Because of tuples nature, it's not possible to convert an array of any size, so we can support only up to some fixed size.
   */
  static func toTuple(_ array: [Any?]) throws -> Any? {
    switch (array.count) {
    case 0:
      return ()
    case 1:
      return (array[0])
    case 2:
      return (array[0], array[1])
    case 3:
      return (array[0], array[1], array[2])
    case 4:
      return (array[0], array[1], array[2], array[3])
    case 5:
      return (array[0], array[1], array[2], array[3], array[4])
    case 6:
      return (array[0], array[1], array[2], array[3], array[4], array[5])
    case 7:
      return (array[0], array[1], array[2], array[3], array[4], array[5], array[6])
    case 8:
      return (array[0], array[1], array[2], array[3], array[4], array[5], array[6], array[7])
    case 9:
      return (array[0], array[1], array[2], array[3], array[4], array[5], array[6], array[7], array[8])
    case 10:
      return (array[0], array[1], array[2], array[3], array[4], array[5], array[6], array[7], array[8], array[9])
    default:
      throw TooManyArgumentsError(count: array.count, limit: 10)
    }
  }

  static func fromNSObject(_ object: Any) -> Any {
    switch object {
    case let object as NSArray:
      return object.map { Conversions.fromNSObject($0) }
    case let object as NSDictionary:
      let keyValuePairs: [(String, Any)] = object.map { ($0 as! String, Conversions.fromNSObject($1)) }
      return Dictionary(uniqueKeysWithValues: keyValuePairs)
    case is NSNull:
      return Optional<Any>.none as Any
    default:
      return object
    }
  }

  /**
   Picks values under given keys from the dictionary, casted to a specific type. Can throw errors when
   - The dictionary is missing some of the given keys (`MissingKeysError`)
   - Some of the values cannot be casted to specified type (`CastingValuesError`)
   */
  static func pickValues<ValueType>(from dict: [String: Any], byKeys keys: [String], as type: ValueType.Type) throws -> [ValueType] {
    var result = (
      values: [ValueType](),
      missingKeys: [String](),
      invalidKeys: [String]()
    )

    for key in keys {
      if dict[key] == nil {
        result.missingKeys.append(key)
      }
      if let value = dict[key] as? ValueType {
        result.values.append(value)
      } else {
        result.invalidKeys.append(key)
      }
    }
    if result.missingKeys.count > 0 {
      throw MissingKeysError<ValueType>(keys: result.missingKeys)
    }
    if result.invalidKeys.count > 0 {
      throw CastingValuesError<ValueType>(keys: result.invalidKeys)
    }
    return result.values
  }

  /**
   Converts hex string to `UIColor` or throws an error if the string is corrupted.
   */
  static func toColor(hexString hex: String) throws -> UIColor {
    var hexStr = hex
      .trimmingCharacters(in: .whitespacesAndNewlines)
      .replacingOccurrences(of: "#", with: "")

    // If just RGB, set alpha to maximum
    if hexStr.count == 6 { hexStr += "FF" }
    if hexStr.count == 3 { hexStr += "F" }

    // Expand short form (supported by Web)
    if hexStr.count == 4 {
      let chars = Array(hexStr)
      hexStr = [
        String(repeating: chars[0], count: 2),
        String(repeating: chars[1], count: 2),
        String(repeating: chars[2], count: 2),
        String(repeating: chars[3], count: 2)
      ].joined(separator: "")
    }

    var rgba: UInt64 = 0

    guard hexStr.range(of: #"^[0-9a-fA-F]{8}$"#, options: .regularExpression) != nil,
          Scanner(string: hexStr).scanHexInt64(&rgba) else {
      throw InvalidHexColorError(hex: hex)
    }
    return try toColor(rgba: rgba)
  }

  /**
   Converts an integer for ARGB color to `UIColor`. Since the alpha channel is represented by first 8 bits,
   it's optional out of the box. React Native converts colors to such format.
   */
  static func toColor(argb: UInt64) throws -> UIColor {
    guard argb <= UInt32.max else {
      throw HexColorOverflowError(hex: argb)
    }
    let alpha = CGFloat((argb >> 24) & 0xff) / 255.0
    let red   = CGFloat((argb >> 16) & 0xff) / 255.0
    let green = CGFloat((argb >> 8) & 0xff) / 255.0
    let blue  = CGFloat(argb & 0xff) / 255.0
    return UIColor(red: red, green: green, blue: blue, alpha: alpha)
  }

  /**
   Converts an integer for RGBA color to `UIColor`.
   */
  static func toColor(rgba: UInt64) throws -> UIColor {
    guard rgba <= UInt32.max else {
      throw HexColorOverflowError(hex: rgba)
    }
    let red   = CGFloat((rgba >> 24) & 0xff) / 255.0
    let green = CGFloat((rgba >> 16) & 0xff) / 255.0
    let blue  = CGFloat((rgba >> 8) & 0xff) / 255.0
    let alpha = CGFloat(rgba & 0xff) / 255.0
    return UIColor(red: red, green: green, blue: blue, alpha: alpha)
  }

  /**
   Formats an array of keys to the string with keys in apostrophes separated by commas.
   */
  static func formatKeys(_ keys: [String]) -> String {
    return keys.map { "`\($0)`" }.joined(separator: ", ")
  }

  // MARK: - Errors

  /**
   An error meaning that the number of arguments exceeds the limit.
   */
  internal struct TooManyArgumentsError: CodedError {
    let count: Int
    let limit: Int
    var description: String {
      "A number of arguments `\(count)` exceeds the limit of `\(limit)`"
    }
  }

  /**
   An error that can be thrown by convertible types, when given value cannot be converted.
   */
  internal struct ConvertingError<TargetType>: CodedError {
    let value: Any?
    var code: String = "ERR_CONVERTING_FAILED"
    var description: String {
      "Cannot convert `\(String(describing: value))` to `\(TargetType.self)`"
    }
  }

  /**
   An error that is thrown when given value cannot be casted.
   */
  internal struct CastingError<TargetType>: CodedError {
    let value: Any
    var code: String = "ERR_CASTING_FAILED"
    var description: String {
      "Cannot cast `\(String(describing: value))` to `\(TargetType.self)`"
    }
  }

  /**
   An error that can be thrown by convertible types,
   when the values in given dictionary cannot be casted to specific type.
   */
  internal struct CastingValuesError<ValueType>: CodedError {
    let keys: [String]
    var code: String = "ERR_CASTING_VALUES_FAILED"
    var description: String {
      "Cannot cast keys \(formatKeys(keys)) to `\(ValueType.self)`"
    }
  }

  /**
   An error that can be throw by convertible types,
   when given dictionary is missing some required keys.
   */
  internal struct MissingKeysError<ValueType>: CodedError {
    let keys: [String]
    var description: String {
      "Missing keys \(formatKeys(keys)) of type `\(ValueType.self)`"
    }
  }

  /**
   An error that is thrown when null value is tried to be casted to non-optional type.
   */
  internal struct NullCastError<TargetType>: CodedError {
    var description: String {
      "Cannot cast null value to non-optional `\(TargetType.self)`"
    }
  }

  /**
   An error used when the hex color string is invalid (e.g. contains non-hex characters).
   */
  internal struct InvalidHexColorError: CodedError {
    let hex: String
    var description: String {
      "Provided hex color `\(hex)` is invalid"
    }
  }

  /**
   An error used when the integer value of the color would result in an overflow of `UInt32`.
   */
  internal struct HexColorOverflowError: CodedError {
    let hex: UInt64
    var description: String {
      "Provided hex color `\(hex)` would result in an overflow"
    }
  }
}
