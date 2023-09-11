// Copyright 2022-present 650 Industries. All rights reserved.

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

public extension JavaScriptValue {
  var kind: JavaScriptValueKind {
    switch true {
    case isUndefined():
      return .undefined
    case isNull():
      return .null
    case isBool():
      return .bool
    case isNumber():
      return .number
    case isSymbol():
      return .symbol
    case isString():
      return .string
    case isFunction():
      return .function
    default:
      return .object
    }
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

  func asArray() throws -> [JavaScriptValue?] {
    if isObject() {
      return getArray()
    }
    throw JavaScriptValueConversionException((kind: kind, target: "Array"))
  }

  func asDict() throws -> [String: Any] {
    if isObject() {
      return getDictionary()
    }
    throw JavaScriptValueConversionException((kind: kind, target: "Dict"))
  }

  func asObject() throws -> JavaScriptObject {
    if isObject() {
      return getObject()
    }
    throw JavaScriptValueConversionException((kind: kind, target: "Object"))
  }

  func asTypedArray() throws -> JavaScriptTypedArray {
    if let typedArray = getTypedArray() {
      return typedArray
    }
    throw JavaScriptValueConversionException((kind: kind, target: "TypedArray"))
  }
}

internal final class JavaScriptValueConversionException: GenericException<(kind: JavaScriptValueKind, target: String)> {
  override var reason: String {
    "Cannot represent a value of kind '\(param.kind)' as \(param.target)"
  }
}
