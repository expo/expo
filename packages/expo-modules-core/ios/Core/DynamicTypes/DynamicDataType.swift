// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A dynamic type representing Swift `Data` or Objective-C `NSData` type and backing by JavaScript `Uint8Array`.
 */
internal struct DynamicDataType: AnyDynamicType {
  static let shared = DynamicDataType()

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return InnerType.self == Data.self
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    return type is Data.Type
  }

  /**
   Converts JS typed array to its native representation.
   */
  func cast(jsValue: borrowing JavaScriptValue, appContext: AppContext) throws -> Any {
    guard let jsTypedArray = jsValue.getTypedArray(), jsTypedArray.kind == .Uint8Array else {
      throw Conversions.CastingJSValueException<Uint8Array>(jsValue.kind)
    }
    return Data(bytes: jsTypedArray.getUnsafeMutableRawPointer(), count: jsTypedArray.getProperty("byteLength").getInt())
  }

  var description: String {
    return String(describing: Data.self)
  }
}
