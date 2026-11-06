// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

// `URL` decodes from a string through the same rules as its `Convertible` conversion, and encodes as its
// absolute string.

extension URL: JavaScriptDecodable, JavaScriptEncodable {
  public static var decodableKinds: JavaScriptValueKinds {
    return .string
  }

  @JavaScriptActor
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> URL
  {
    guard value.isString() else {
      throw Conversions.ConvertingException<URL>(value.copied(in: runtime).getAny())
    }
    return try convert(fromString: value.getString())
  }

  @JavaScriptActor
  public static func encode(_ value: URL, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return try String.encode(value.absoluteString, in: runtime)
  }
}
