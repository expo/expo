// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

// `URL` decodes from a string and encodes as its absolute string. The `Convertible` conformance decodes a
// string through `urlFromString(_:)` too.

extension URL: @retroactive JavaScriptDecodable, @retroactive JavaScriptEncodable {
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
    return try urlFromString(value.getString())
  }

  @JavaScriptActor
  public static func encode(_ value: URL, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return try String.encode(value.absoluteString, in: runtime)
  }
}

// Internal for the `Convertible` conformance, can become private when the Convertibles are removed.
internal func urlFromString(_ value: String) throws -> URL {
  // First we try to create a URL without extra encoding, as it came.
  if let url = convertToUrl(string: value) {
    return url
  }

  // File path doesn't need to be percent-encoded.
  if isFileUrlPath(value) {
    return URL(fileURLWithPath: value)
  }

  // If we get here, the string is not the file url and may require percent-encoding characters that are not URL-safe according to RFC 3986.
  if let encodedValue = percentEncodeUrlString(value), let url = convertToUrl(string: encodedValue) {
    return url
  }

  // If it still fails to create the URL object, the string possibly contains characters that must be explicitly percent-encoded beforehand.
  throw UrlContainsInvalidCharactersException()
}

internal class UrlContainsInvalidCharactersException: Exception, @unchecked Sendable {
  override var reason: String {
    return
      "Unable to create a URL object from the given string, make sure to percent-encode these characters: \(urlAllowedCharacters)"
  }
}
