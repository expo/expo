// Copyright 2018-present 650 Industries. All rights reserved.

import CoreGraphics

// Here we extend some common iOS types to implement `Convertible` protocol and
// describe how they can be converted from primitive types received from JavaScript runtime.
// This allows these types to be used as argument types of functions callable from JavaScript.
// As an example, when the `CGPoint` type is used as an argument type, its instance can be
// created from an array of two doubles or an object with `x` and `y` fields.

// MARK: - Foundation

extension URL: Convertible {
  public static func convert(from value: Any?, appContext: AppContext) throws -> Self {
    guard let value = value as? String else {
      if let url = value as? URL {
        return url
      }
      throw Conversions.ConvertingException<URL>(value)
    }

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
}

internal class UrlContainsInvalidCharactersException: Exception {
  override var reason: String {
    return "Unable to create a URL object from the given string, make sure to percent-encode these characters: \(urlAllowedCharacters)"
  }
}

// MARK: - CoreGraphics

extension CGPoint: Convertible {
  public static func convert(from value: Any?, appContext: AppContext) throws -> CGPoint {
    if let value = value as? [Double], value.count == 2 {
      return CGPoint(x: value[0], y: value[1])
    }
    if let value = value as? [String: Any] {
      let args = try Conversions.pickValues(from: value, byKeys: ["x", "y"], as: Double.self)
      return CGPoint(x: args[0], y: args[1])
    }
    throw Conversions.ConvertingException<CGPoint>(value)
  }
}

extension CGSize: Convertible {
  public static func convert(from value: Any?, appContext: AppContext) throws -> CGSize {
    if let value = value as? [Double], value.count == 2 {
      return CGSize(width: value[0], height: value[1])
    }
    if let value = value as? [String: Any] {
      let args = try Conversions.pickValues(from: value, byKeys: ["width", "height"], as: Double.self)
      return CGSize(width: args[0], height: args[1])
    }
    if let size = value as? CGSize {
      return size
    }
    throw Conversions.ConvertingException<CGSize>(value)
  }
}

extension CGVector: Convertible {
  public static func convert(from value: Any?, appContext: AppContext) throws -> CGVector {
    if let value = value as? [Double], value.count == 2 {
      return CGVector(dx: value[0], dy: value[1])
    }
    if let value = value as? [String: Any] {
      let args = try Conversions.pickValues(from: value, byKeys: ["dx", "dy"], as: Double.self)
      return CGVector(dx: args[0], dy: args[1])
    }
    if let vector = value as? CGVector {
      return vector
    }
    throw Conversions.ConvertingException<CGVector>(value)
  }
}

extension CGRect: Convertible {
  public static func convert(from value: Any?, appContext: AppContext) throws -> CGRect {
    if let value = value as? [Double], value.count == 4 {
      return CGRect(x: value[0], y: value[1], width: value[2], height: value[3])
    }
    if let value = value as? [String: Any] {
      let args = try Conversions.pickValues(from: value, byKeys: ["x", "y", "width", "height"], as: Double.self)
      return CGRect(x: args[0], y: args[1], width: args[2], height: args[3])
    }
    if let rect = value as? CGRect {
      return rect
    }
    throw Conversions.ConvertingException<CGRect>(value)
  }
}

extension Date: Convertible {
  public static func convert(from value: Any?, appContext: AppContext) throws -> Date {
    if let value = value as? String {
      let formatter = ISO8601DateFormatter()
      formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
      guard let date = formatter.date(from: value) else {
        throw Conversions.ConvertingException<Date>(value)
      }
      return date
    }
    // For converting the value from `Date.now()`
    if let value = value as? Int {
      return Date(timeIntervalSince1970: Double(value) / 1000.0)
    }
    if let date = value as? Date {
      return date
    }
    throw Conversions.ConvertingException<Date>(value)
  }
}
