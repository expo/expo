public struct Conversions {
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
  public static func pickValues<ValueType>(from dict: [String: Any], byKeys keys: [String], as type: ValueType.Type) throws -> [ValueType] {
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
   Converts color string to `UIColor` or throws an exception if the string is corrupted.
   */
  static func toColor(colorString: String) throws -> UIColor {
    let input = colorString.trimmingCharacters(in: .whitespacesAndNewlines)

    // Handle RGB format
    if input.hasPrefix("rgb") {
      return try fromRGBString(input)
    }

    var hexStr = input
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
      throw InvalidHexColorException(input)
    }
    return try toColor(rgba: rgba)
  }

  private static func fromRGBString(_ rgbString: String) throws -> UIColor {
    let components = rgbString
      .replacingOccurrences(of: "rgba(", with: "")
      .replacingOccurrences(of: "rgb(", with: "")
      .replacingOccurrences(of: ")", with: "")
      .split(separator: ",")
      .compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }

    guard components.count >= 3,
      components[0] >= 0 && components[0] <= 255,
      components[1] >= 0 && components[1] <= 255,
      components[2] >= 0 && components[2] <= 255 else {
      throw InvalidRGBColorException(rgbString)
    }

    let alpha = components.count > 3 ? Double(components[3]) : 1.0
    return UIColor(
      red: CGFloat(components[0]) / 255.0,
      green: CGFloat(components[1]) / 255.0,
      blue: CGFloat(components[2]) / 255.0,
      alpha: alpha)
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
    if let appContext {
      // Dynamic type is provided
      if dynamicType as? DynamicVoidType == nil, let result = try? dynamicType?.convertResult(value as Any, appContext: appContext) {
        return result
      }
      // Dynamic type can be obtained from the value
      if let value = value as? AnyArgument, let result = try? type(of: value).getDynamicType().convertResult(value as Any, appContext: appContext) {
        return result
      }
    }
    return convertFunctionResultInRuntime(value, appContext: appContext)
  }

  /**
   Converts the function result to the type that can later be converted to a JS value.
   As opposed to `convertFunctionResult`, it has no information about the dynamic type,
   so it is quite limited, e.g. it does not handle shared objects.
   Currently it is required to handle results of the promise.
   */
  static func convertFunctionResultInRuntime<ValueType>(_ value: ValueType?, appContext: AppContext? = nil) -> Any {
    if let value = value as? Record {
      return value.toDictionary(appContext: appContext)
    }
    if let value = value as? [Record] {
      return value.map { $0.toDictionary(appContext: appContext) }
    }
    if let value = value as? any Enumerable {
      return value.anyRawValue
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
   An exception thrown when the native value cannot be converted to JavaScript value.
   */
  internal final class ConversionToJSFailedException: GenericException<(kind: JavaScriptValueKind, nativeType: Any.Type)> {
    override var code: String {
      "ERR_CONVERTING_TO_JS_FAILED"
    }
    override var reason: String {
      "Conversion from native '\(param.nativeType)' to JavaScript value of type '\(param.kind.rawValue)' failed"
    }
  }

  /**
   An exception thrown when the JavaScript value cannot be converted to native value.
   */
  internal final class ConversionToNativeFailedException: GenericException<(kind: JavaScriptValueKind, nativeType: Any.Type)> {
    override var code: String {
      "ERR_CONVERTING_TO_NATIVE_FAILED"
    }
    override var reason: String {
      "Conversion from JavaScript value of type '\(param.kind.rawValue)' to native '\(param.nativeType)' failed"
    }
  }

  /**
   An exception that can be thrown by convertible types, when given value cannot be converted.
   */
  public class ConvertingException<TargetType>: GenericException<Any?> {
    public override var code: String {
      "ERR_CONVERTING_FAILED"
    }
    public override var reason: String {
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
   An exception used when the rgb color string is invalid.
   */
  internal class InvalidRGBColorException: GenericException<String> {
    override var reason: String {
      "Provided rgb color string '\(param)' is invalid"
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
