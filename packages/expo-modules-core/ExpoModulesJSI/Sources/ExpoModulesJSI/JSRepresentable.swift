// Copyright 2025-present 650 Industries. All rights reserved.

import CoreGraphics

internal import jsi
internal import ExpoModulesJSI_Cxx

// MARK: - JSRepresentable

/**
 A type whose values can be represented in the JS runtime.
 */
public protocol JSRepresentable: Sendable, ~Copyable {
  /**
   Creates an instance of this type from the given JS value.
   */
  static func fromJSValue(_ value: borrowing JavaScriptValue) -> Self
  /**
   Creates a JS value representing this value in the given runtime.
   */
  func toJSValue(in runtime: JavaScriptRuntime) -> JavaScriptValue
}

public extension JSRepresentable {
  static func fromJSValue(_ value: borrowing JavaScriptValue) -> Self {
    guard let jsiRuntime = value.runtime else {
      JS.runtimeLostFatalError()
    }
    if let JSIRepresentableType = Self.self as? JSIRepresentable.Type {
      return JSIRepresentableType.fromJSIValue(value.pointee, in: jsiRuntime.pointee) as! Self
    }
    fatalError("Unimplemented")
  }

  func toJSValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    if let self = self as? JSIRepresentable {
      return JavaScriptValue(runtime, self.toJSIValue(in: runtime.pointee))
    }
    fatalError("Unimplemented")
  }
}

// MARK: - JSIRepresentable

/**
 A type whose values can be represented as `facebook.jsi.Value`.
 */
internal protocol JSIRepresentable: JSRepresentable, Sendable, ~Copyable {
  /**
   Creates an instance of this type from the given `facebook.jsi.Value` in `facebook.jsi.Runtime`.
   */
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.Runtime) -> Self
  /**
   Creates a JSI value representing this value in the given JSI runtime.
   */
  func toJSIValue(in runtime: facebook.jsi.Runtime) -> facebook.jsi.Value
}

internal extension JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.Runtime) -> Self {
    fatalError("Unimplemented")
  }

  func toJSIValue(in runtime: facebook.jsi.Runtime) -> facebook.jsi.Value {
    fatalError("Unimplemented")
  }
}

// MARK: - Implementations

extension Bool: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.Runtime) -> Bool {
    return value.getBool()
  }

  func toJSIValue(in runtime: facebook.jsi.Runtime) -> facebook.jsi.Value {
    return facebook.jsi.Value(self)
  }
}

internal protocol JSIRepresentableNumber: JSIRepresentable {}

extension JSIRepresentableNumber {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.Runtime) -> Int where Self: FixedWidthInteger {
    return Int(value.getNumber())
  }

  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.Runtime) -> Double where Self: BinaryFloatingPoint {
    return value.getNumber()
  }

  func toJSIValue(in runtime: facebook.jsi.Runtime) -> facebook.jsi.Value where Self: FixedWidthInteger {
    return facebook.jsi.Value(Double(self))
  }

  func toJSIValue(in runtime: facebook.jsi.Runtime) -> facebook.jsi.Value where Self: BinaryFloatingPoint {
    return facebook.jsi.Value(Double(self))
  }
}

extension Int: JSIRepresentableNumber {}
extension Int8: JSIRepresentableNumber {}
extension Int16: JSIRepresentableNumber {}
extension Int32: JSIRepresentableNumber {}
extension Int64: JSIRepresentableNumber {}
extension UInt: JSIRepresentableNumber {}
extension UInt8: JSIRepresentableNumber {}
extension UInt16: JSIRepresentableNumber {}
extension UInt32: JSIRepresentableNumber {}
extension UInt64: JSIRepresentableNumber {}
extension Float16: JSIRepresentableNumber {}
extension Float32: JSIRepresentableNumber {}
extension Float64: JSIRepresentableNumber {}
extension CGFloat: JSIRepresentableNumber {}

extension String: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.Runtime) -> String {
    return String(value.getString(runtime).utf8(runtime))
  }

  func toJSIValue(in runtime: facebook.jsi.Runtime) -> facebook.jsi.Value {
    return facebook.jsi.Value(runtime, facebook.jsi.String.createFromUtf8(runtime, std.string(self)))
  }
}

extension Optional: JSRepresentable where Wrapped: JSRepresentable {}
extension Optional: JSIRepresentable where Wrapped: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.Runtime) -> Self {
    if value.isNull() || value.isUndefined() {
      return nil
    }
    return Wrapped.fromJSIValue(value, in: runtime)
  }

  func toJSIValue(in runtime: facebook.jsi.Runtime) -> facebook.jsi.Value {
    return self?.toJSIValue(in: runtime) ?? .null()
  }
}

extension Dictionary: JSRepresentable where Key == String, Value: JSRepresentable {}
extension Dictionary: JSIRepresentable where Key == String, Value: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.Runtime) -> Dictionary<Key, Value> {
    let object = value.getObject(runtime)
    let propertyNames = object.getPropertyNames(runtime)
    let size = propertyNames.size(runtime)
    var result: Self = [:]

    for index in 0..<size {
      let jsiKey = propertyNames.getValueAtIndex(runtime, index)
      let key = String.fromJSIValue(jsiKey, in: runtime)
      let jsiValue = object.getProperty(runtime, jsiKey)

      result[key] = Value.fromJSIValue(jsiValue, in: runtime)
    }
    return result
  }

  func toJSIValue(in runtime: facebook.jsi.Runtime) -> facebook.jsi.Value {
    let object = facebook.jsi.Object(runtime)

    for (key, value) in self {
      let keyString = String(describing: key)
      expo.setProperty(runtime, object, keyString, value.toJSIValue(in: runtime))
    }
    return facebook.jsi.Value(runtime, object)
  }
}

extension Array: JSRepresentable where Element: JSRepresentable {}
extension Array: JSIRepresentable where Element: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.Runtime) -> Array<Element> {
    let jsiArray = value.getObject(runtime).getArray(runtime)
    let size = jsiArray.size(runtime)
    var result: Self = []

    result.reserveCapacity(size)

    for index in 0..<size {
      result.append(Element.fromJSIValue(jsiArray.getValueAtIndex(runtime, index), in: runtime))
    }
    return result
  }

  func toJSIValue(in runtime: facebook.jsi.Runtime) -> facebook.jsi.Value {
    let jsiArray = facebook.jsi.Array(runtime, count)

    for index in 0..<count {
      expo.setValueAtIndex(runtime, jsiArray, index, self[index].toJSIValue(in: runtime))
    }
    return expo.valueFromArray(runtime, jsiArray)
  }
}
