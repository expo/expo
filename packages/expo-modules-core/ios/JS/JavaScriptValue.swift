// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 Enum with available kinds of values. It's almost the same as a result of "typeof"
 in JavaScript, however `null` has its own kind (typeof null == "object").
 */
public enum JavaScriptValueKind: String {
  case undefined
  case null
  case bool
  case number
  case symbol
  case string
  case function
  case object
}

/**
 A protocol that JavaScript values, objects and functions can conform to.
 */
public protocol AnyJavaScriptValue: AnyArgument, ~Copyable {
  /**
   Tries to convert a raw JavaScript value to the conforming type.
   */
  static func convert(from value: borrowing JavaScriptValue, appContext: AppContext) throws -> Self
}

//extension AnyJavaScriptValue {
//  public static func getDynamicType() -> AnyDynamicType {
//    return DynamicJavaScriptType()
//  }
//}

extension JavaScriptValue: AnyArgument {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicJavaScriptType.shared
  }

  func asBool() throws -> Bool {
    if isBool() {
      return getBool()
    }
    throw JavaScriptValueConversionException((kind: kind, target: "Bool"))
  }

  func asInt() throws -> Int {
    if isNumber() {
      return getInt()
    }
    throw JavaScriptValueConversionException((kind: kind, target: "Int"))
  }

  func asDouble() throws -> Double {
    if isNumber() {
      return getDouble()
    }
    throw JavaScriptValueConversionException((kind: kind, target: "Double"))
  }

  func asString() throws -> String {
    if isString() {
      return getString()
    }
    throw JavaScriptValueConversionException((kind: kind, target: "String"))
  }

  func asArray() throws -> /* JavaScriptArray */ Any {
//    if isObject() {
//      return getArray()
//    }
    throw JavaScriptValueConversionException((kind: kind, target: "Array"))
  }

  func asDict() throws -> [String: Any] {
//    if isObject() {
//      return getDictionary()
//    }
    throw JavaScriptValueConversionException((kind: kind, target: "Dict"))
  }

  func asObject() throws -> JavaScriptObject {
    if isObject() {
      return getObject()
    }
    throw JavaScriptValueConversionException((kind: kind, target: "Object"))
  }

  func asFunction() throws -> JavaScriptFunction {
    if isFunction() {
      return getFunction()
    }
    throw JavaScriptValueConversionException((kind: kind, target: "Function"))
  }

  func asTypedArray() throws -> JavaScriptValue /* JavaScriptTypedArray */ {
//    if let typedArray = getTypedArray() {
//      return typedArray
//    }
    throw JavaScriptValueConversionException((kind: kind, target: "TypedArray"))
  }

//  func asArrayBuffer() throws -> JavaScriptArrayBuffer {
//    if let backingBuffer = getArrayBuffer() {
//      return JavaScriptArrayBuffer(backingBuffer)
//    }
//    throw JavaScriptValueConversionException((kind: kind, target: "ArrayBuffer"))
//  }

  // MARK: - AnyJavaScriptValue

  public static func convert(from value: borrowing JavaScriptValue, appContext: AppContext) throws -> Self {
    // It's already a `JavaScriptValue` so it should always pass through.
//    if let value = value as? Self {
//      return value
//    }
    throw JavaScriptValueConversionException((kind: value.kind, target: String(describing: Self.self)))
  }
}

internal final class JavaScriptValueConversionException: GenericException<(kind: JavaScriptValue.Kind, target: String)>, @unchecked Sendable {
  override var reason: String {
    "Cannot represent a value of kind '\(param.kind)' as \(param.target)"
  }
}
