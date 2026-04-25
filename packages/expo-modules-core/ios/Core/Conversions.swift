import ExpoModulesJSI

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
    _ value: ValueType,
    appContext: AppContext? = nil,
    dynamicType: AnyDynamicType? = nil
  ) -> Any {
    if let appContext {
      // Dynamic type is provided
      if let result = try? dynamicType?.convertResult(value, appContext: appContext) {
        return result
      }
      // Dynamic type can be obtained from the value
      if let argument = value as? AnyArgument, let result = try? type(of: argument).getDynamicType().convertResult(value, appContext: appContext) {
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
  static func convertFunctionResultInRuntime<ValueType>(_ value: ValueType, appContext: AppContext? = nil) -> Any {
    if let value = value as? Record {
      return value.toDictionary(appContext: appContext)
    }
    if let value = value as? [Record] {
      return value.map { $0.toDictionary(appContext: appContext) }
    }
    if let value = value as? any Enumerable {
      return value.anyRawValue
    }
    return value
  }

  // MARK: - Any to JavaScript

  /**
   Converts an arbitrary native value to a `JavaScriptValue`.
   Handles Swift primitives, strings, arrays, and dictionaries with `Any` values
   that can't be statically matched to `JavaScriptRepresentable`.
   */
  static func anyToJavaScriptValue(_ value: Any, runtime: JavaScriptRuntime) throws -> JavaScriptValue {
    if let value = value as? JavaScriptRepresentable {
      return .representing(value: value, in: runtime)
    }
    switch value {
    case is Void:
      return .undefined
    case is NSNull:
      return .null
    case let number as NSNumber:
      // NSNumber wrapping a boolean is also a valid NSNumber, so check for bool first.
      if number === kCFBooleanTrue {
        return .true()
      }
      if number === kCFBooleanFalse {
        return .false()
      }
      return .number(number.doubleValue)
    case let string as NSString:
      return .representing(value: string as String, in: runtime)
    case let data as Data:
      return try dataToUint8Array(data, runtime: runtime)
    case let array as NSArray:
      let jsArray = runtime.createArray(length: array.count)
      for (index, element) in array.enumerated() {
        try jsArray.set(value: anyToJavaScriptValue(element, runtime: runtime), at: index)
      }
      return jsArray.asValue()
    case let dict as NSDictionary:
      let jsObject = runtime.createObject()
      for (key, element) in dict {
        guard let key = key as? String else { continue }
        jsObject.setProperty(key, value: try anyToJavaScriptValue(element, runtime: runtime))
      }
      return jsObject.asValue()
    default:
      log.warn("anyToJavaScriptValue: unsupported native type '\(type(of: value))', returning undefined")
      return .undefined
    }
  }

  /**
   Copies the given `Data` into a new JS `ArrayBuffer` and wraps it in a `Uint8Array`.
   */
  private static func dataToUint8Array(_ data: Data, runtime: JavaScriptRuntime) throws -> JavaScriptValue {
    let arrayBuffer = runtime.createArrayBuffer(size: data.count)
    data.withUnsafeBytes { rawBuffer in
      if let baseAddress = rawBuffer.baseAddress, data.count > 0 {
        memcpy(arrayBuffer.data(), baseAddress, data.count)
      }
    }
    let uint8ArrayCtor = runtime.global().getPropertyAsFunction("Uint8Array")
    return try uint8ArrayCtor.callAsConstructor(arrayBuffer.asValue())
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
  internal final class ConversionToJSFailedException: GenericException<(kind: JavaScriptValue.Kind, nativeType: Any.Type)> {
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
  internal final class ConversionToNativeFailedException: GenericException<(kind: JavaScriptValue.Kind, nativeType: Any.Type)> {
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

  internal class CastingJSValueException<TargetType>: GenericException<JavaScriptValue.Kind>, @unchecked Sendable {
    override var code: String {
      "ERR_CASTING_JS_VALUE_FAILED"
    }
    override var reason: String {
      "Cannot cast from JavaScript value of kind '\(param)' to \(TargetType.self)"
    }
  }

  internal class UnexpectedValueType: GenericException<(received: JavaScriptValue.Kind, expected: JavaScriptValue.Kind)>, @unchecked Sendable {
    override var code: String {
      "ERR_UNEXPECTED_VALUE_TYPE"
    }
    override var reason: String {
      "Received JavaScript value of type '\(param.received)', but expected '\(param.expected)'"
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

}
