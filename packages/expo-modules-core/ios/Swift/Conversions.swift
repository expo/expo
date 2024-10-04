internal final class Conversions {
  /**
   Converts an array to tuple. Because of tuples nature, it's not possible to convert an array of any size, so we can support only up to some fixed size.
   */
  static func toTuple(_ array: [Any?]) throws -> Any? {
    switch array.count {
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
      throw TooManyArgumentsException((count: array.count, limit: 10))
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
   Picks values under given keys from the dictionary, cast to a specific type. Can throw exceptions when
   - The dictionary is missing some of the given keys (`MissingKeysException`)
   - Some of the values cannot be cast to specified type (`CastingValuesException`)
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
    if !result.missingKeys.isEmpty {
      throw MissingKeysException<ValueType>(result.missingKeys)
    }
    if !result.invalidKeys.isEmpty {
      throw CastingValuesException<ValueType>(result.invalidKeys)
    }
    return result.values
  }

  /**
   Converts hex string to `UIColor` or throws an exception if the string is corrupted.
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
      throw InvalidHexColorException(hex)
    }
    return try toColor(rgba: rgba)
  }

  /**
   Converts an integer for ARGB color to `UIColor`. Since the alpha channel is represented by first 8 bits,
   it's optional out of the box. React Native converts colors to such format.
   */
  static func toColor(argb: UInt64) throws -> UIColor {
    guard argb <= UInt32.max else {
      throw HexColorOverflowException(argb)
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
      throw HexColorOverflowException(rgba)
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

  static func formatPlural(_ number: Int, _ singular: String, _ plural: String? = nil) -> String {
    return String(number) + (number == 1 ? singular : (plural ?? singular + "s"))
  }

  /**
   Converts the function result to the type compatible with JavaScript.
   */
  static func convertFunctionResult<ValueType>(
    _ value: ValueType?,
    appContext: AppContext? = nil,
    dynamicType: AnyDynamicType? = nil
  ) -> Any {
    if let value = value as? Record {
      return value.toDictionary()
    }
    if let value = value as? [Record] {
      return value.map { $0.toDictionary() }
    }
    if let appContext {
      if let value = value as? JavaScriptObjectBuilder {
        return try? value.build(appContext: appContext)
      }

      // If the returned value is a native shared object, create its JS representation and add the pair to the registry of shared objects.
      if let value = value as? SharedObject, let dynamicType = dynamicType as? DynamicSharedObjectType {
        guard let object = try? appContext.newObject(nativeClassId: dynamicType.typeIdentifier) else {
          log.warn("Unable to create a JS object for \(dynamicType.description)")
          return Optional<Any>.none
        }
        SharedObjectRegistry.add(native: value, javaScript: object)
        return object
      }
    }
    return value as Any
  }

  // MARK: - Exceptions

  /**
   An exception meaning that the number of arguments exceeds the limit.
   */
  internal class TooManyArgumentsException: GenericException<(count: Int, limit: Int)> {
    override var reason: String {
      "Native function expects \(formatPlural(param.limit, "argument")), but received \(param.count)"
    }
  }

  /**
   An exception that can be thrown by convertible types, when given value cannot be converted.
   */
  internal class ConvertingException<TargetType>: GenericException<Any?> {
    override var code: String {
      "ERR_CONVERTING_FAILED"
    }
    override var reason: String {
      "Cannot convert '\(String(describing: param))' to \(TargetType.self)"
    }
  }

  /**
   An exception that is thrown when given value cannot be cast.
   */
  internal class CastingException<TargetType>: GenericException<Any> {
    override var code: String {
      "ERR_CASTING_FAILED"
    }
    override var reason: String {
      "Cannot cast '\(String(describing: param))' to \(TargetType.self)"
    }
  }

  /**
   An exception that can be thrown by convertible types,
   when the values in given dictionary cannot be cast to specific type.
   */
  internal class CastingValuesException<ValueType>: GenericException<[String]> {
    override var code: String {
      "ERR_CASTING_VALUES_FAILED"
    }
    override var reason: String {
      "Cannot cast keys \(formatKeys(param)) to \(ValueType.self)"
    }
  }

  /**
   An exception that can be thrown by convertible types,
   when given dictionary is missing some required keys.
   */
  internal class MissingKeysException<ValueType>: GenericException<[String]> {
    override var reason: String {
      "Missing keys \(formatKeys(param)) to create \(ValueType.self) record"
    }
  }

  /**
   An exception that is thrown when null value is tried to be cast to non-optional type.
   */
  internal class NullCastException<TargetType>: Exception {
    override var reason: String {
      "Cannot cast null to non-optional '\(TargetType.self)'"
    }
  }

  /**
   An exception used when the hex color string is invalid (e.g. contains non-hex characters).
   */
  internal class InvalidHexColorException: GenericException<String> {
    override var reason: String {
      "Provided hex color '\(param)' is invalid"
    }
  }

  /**
   An exception used when the integer value of the color would result in an overflow of `UInt32`.
   */
  internal class HexColorOverflowException: GenericException<UInt64> {
    override var reason: String {
      "Provided hex color '\(param)' would result in an overflow"
    }
  }
}
