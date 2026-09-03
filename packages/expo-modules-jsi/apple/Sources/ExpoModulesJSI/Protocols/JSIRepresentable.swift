import CoreGraphics
internal import ExpoModulesJSI_Cxx
internal import jsi

/// A type whose values can be represented as `facebook.jsi.Value`.
internal protocol JSIRepresentable: JavaScriptRepresentable, Sendable, ~Copyable {
  /// Creates an instance of this type from the given `facebook.jsi.Value` in `facebook.jsi.IRuntime`.
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.IRuntime) -> Self
  /// Creates a JSI value representing this value in the given JSI runtime.
  func toJSIValue(in runtime: facebook.jsi.IRuntime) -> facebook.jsi.Value
}

extension JSIRepresentable {
  public static func fromJavaScriptValue(_ value: JavaScriptValue) -> Self {
    guard let jsiRuntime = value.runtime else {
      FatalError.runtimeLost()
    }
    return Self.fromJSIValue(value.pointee, in: jsiRuntime.pointee)
  }

  public func toJavaScriptValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    return JavaScriptValue(runtime, toJSIValue(in: runtime.pointee))
  }

  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.IRuntime) -> Self {
    FatalError.unimplemented()
  }

  func toJSIValue(in runtime: facebook.jsi.IRuntime) -> facebook.jsi.Value {
    FatalError.unimplemented()
  }
}

// MARK: - Implementations

extension Bool: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.IRuntime) -> Bool {
    return value.getBool()
  }

  func toJSIValue(in runtime: facebook.jsi.IRuntime) -> facebook.jsi.Value {
    return facebook.jsi.Value(self)
  }
}

internal protocol JSIRepresentableNumber: JSIRepresentable {}

extension JSIRepresentableNumber {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.IRuntime) -> Int
  where Self: FixedWidthInteger {
    return Int(value.getNumber())
  }

  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.IRuntime) -> Double
  where Self: BinaryFloatingPoint {
    return value.getNumber()
  }

  func toJSIValue(in runtime: facebook.jsi.IRuntime) -> facebook.jsi.Value where Self: FixedWidthInteger {
    return facebook.jsi.Value(Double(self))
  }

  func toJSIValue(in runtime: facebook.jsi.IRuntime) -> facebook.jsi.Value where Self: BinaryFloatingPoint {
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
#if arch(arm64) || (!os(macOS) && !targetEnvironment(macCatalyst))
extension Float16: JSIRepresentableNumber {}
#endif
extension Float32: JSIRepresentableNumber {}
extension Float64: JSIRepresentableNumber {}
extension CGFloat: JSIRepresentableNumber {}

extension String: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.IRuntime) -> String {
    return String(jsiString: value.getString(runtime), in: runtime)
  }

  func toJSIValue(in runtime: facebook.jsi.IRuntime) -> facebook.jsi.Value {
    // Hand JSI the Swift string's own UTF-8 storage instead of going through `std::string`: the engine
    // copies the bytes into its heap right away, so the intermediate `std::string` was one extra
    // allocation, copy and free per string. `withUTF8` is mutating (it makes a bridged string
    // contiguous first), hence the local copy; native strings are already contiguous and pay nothing.
    // The value is moved out through a local because `withUTF8` needs a `Copyable` closure result.
    var string = self
    var value = facebook.jsi.Value.undefined()
    string.withUTF8 { utf8 in
      guard let base = utf8.baseAddress else {
        value = facebook.jsi.Value(runtime, facebook.jsi.String.createFromAscii(runtime, "", 0))
        return
      }
      value = facebook.jsi.Value(runtime, facebook.jsi.String.createFromUtf8(runtime, base, utf8.count))
    }
    return value
  }
}

extension Optional: JSIRepresentable where Wrapped: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.IRuntime) -> Self {
    if value.isNull() || value.isUndefined() {
      return nil
    }
    return Wrapped.fromJSIValue(value, in: runtime)
  }

  func toJSIValue(in runtime: facebook.jsi.IRuntime) -> facebook.jsi.Value {
    return self?.toJSIValue(in: runtime) ?? .null()
  }
}

extension Array: JSIRepresentable where Element: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.IRuntime) -> [Element] {
    let jsiArray = value.getObject(runtime).getArray(runtime)
    let size = jsiArray.size(runtime)
    var result: Self = []

    result.reserveCapacity(size)

    for index in 0..<size {
      result.append(Element.fromJSIValue(jsiArray.getValueAtIndex(runtime, index), in: runtime))
    }
    return result
  }

  func toJSIValue(in runtime: facebook.jsi.IRuntime) -> facebook.jsi.Value {
    let jsiArray = facebook.jsi.Array(runtime, count)

    for index in 0..<count {
      expo.setValueAtIndex(runtime, jsiArray, index, self[index].toJSIValue(in: runtime))
    }
    return expo.valueFromArray(runtime, jsiArray)
  }
}

extension Dictionary: JSIRepresentable where Key == String, Value: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.IRuntime) -> [Key: Value] {
    let object = value.getObject(runtime)
    let propertyNames = object.getPropertyNames(runtime)
    let size = propertyNames.size(runtime)
    var result: Self = [:]

    for index in 0..<size {
      // Look the value up by the key string the engine handed back, so any name round-trips exactly.
      let jsiKey = propertyNames.getValueAtIndex(runtime, index).getString(runtime)
      let jsiValue = object.getProperty(runtime, jsiKey)
      result[String(jsiString: jsiKey, in: runtime)] = Value.fromJSIValue(jsiValue, in: runtime)
    }
    return result
  }

  func toJSIValue(in runtime: facebook.jsi.IRuntime) -> facebook.jsi.Value {
    let object = facebook.jsi.Object(runtime)

    for (key, value) in self {
      expo.setProperty(runtime, object, key.toJSIPropNameID(in: runtime), value.toJSIValue(in: runtime))
    }
    return facebook.jsi.Value(runtime, object)
  }
}
