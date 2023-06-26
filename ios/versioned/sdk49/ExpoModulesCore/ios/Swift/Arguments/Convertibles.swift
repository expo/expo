// Copyright 2018-present 650 Industries. All rights reserved.

import UIKit
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
      throw Conversions.ConvertingException<URL>(value)
    }

    // Try to construct the URL object from the string as it came in.
    if let url = URL(string: value) {
      // If it has no scheme, we assume it was the file path which needs to be recreated to be recognized as the file url.
      return url.scheme != nil ? url : URL(fileURLWithPath: value)
    }

    // File path doesn't need to be percent-encoded.
    if isFileUrlPath(value) {
      return URL(fileURLWithPath: value)
    }

    // If we get here, the string is not the file url and may require percent-encoding characters that are not URL-safe according to RFC 3986.
    if let encodedValue = percentEncodeUrlString(value), let url = URL(string: encodedValue) {
      return url.scheme != nil ? url : URL(fileURLWithPath: value)
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
    throw Conversions.ConvertingException<CGRect>(value)
  }
}
