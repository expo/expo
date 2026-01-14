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

    // iOS 18.6+ CRITICAL: Check for HTTP/HTTPS URLs FIRST to prevent API misuse
    // iOS 18.6 will crash with "API MISUSE: URL(filePath:) called with an HTTP URL string"
    // if we try to use fileURLWithPath on an HTTP URL
    let lowercasedValue = value.lowercased()
    let isHttpUrl = lowercasedValue.hasPrefix("http://") || lowercasedValue.hasPrefix("https://")
    
    if isHttpUrl {
      // Try to parse as HTTP URL first
      if let url = URL(string: value) {
        return url
      }
      // If URL(string:) fails, try with URLComponents for better RFC 3986 support
      if #available(iOS 16, *) {
        if let url = URLComponents(string: value)?.url {
          return url
        }
      }
      throw UrlContainsInvalidCharactersException()
    }
    
    // First we try to create a URL without extra encoding, as it came.
    if let url = convertToUrl(string: value) {
      return url
    }

    // File path doesn't need to be percent-encoded.
    // iOS 18.6+ CRITICAL: Has stricter validation for fileURLWithPath that causes assertion failures
    // in production builds. We must validate extensively before calling it.
    // Only check for file paths if it's NOT an HTTP URL (already checked above)
    if isFileUrlPath(value) {
      // iOS 18.6+ CRITICAL: Empty paths will crash with assertion failure in production
      guard !value.isEmpty else {
        throw UrlContainsInvalidCharactersException()
      }
      
      // iOS 18.6+ requires stricter validation - check for invalid characters
      let trimmedPath = value.trimmingCharacters(in: .whitespacesAndNewlines)
      guard !trimmedPath.isEmpty else {
        throw UrlContainsInvalidCharactersException()
      }
      
      // Validate path format for iOS 18.6+ strict requirements
      // Must be absolute path (starts with /) or already a file:// URL
      // CRITICAL: Double-check it's not an HTTP URL that slipped through
      let isAbsolutePath = trimmedPath.hasPrefix("/")
      let isFileURL = trimmedPath.hasPrefix("file://")
      let trimmedLowercased = trimmedPath.lowercased()
      let isHttpUrl = trimmedLowercased.hasPrefix("http://") || trimmedLowercased.hasPrefix("https://")
      
      // iOS 18.6+ will crash if we call fileURLWithPath on an HTTP URL
      guard !isHttpUrl else {
        // Try to parse as HTTP URL instead
        if let url = URL(string: value) {
          return url
        }
        throw UrlContainsInvalidCharactersException()
      }
      
      guard isAbsolutePath || isFileURL else {
        throw UrlContainsInvalidCharactersException()
      }
      
      // Check for null characters and control characters that iOS 18.6 rejects
      if trimmedPath.contains("\0") || trimmedPath.rangeOfCharacter(from: CharacterSet.controlCharacters) != nil {
        throw UrlContainsInvalidCharactersException()
      }
      
      // Create file URL - iOS 18.6 will assert if path is still invalid
      // Note: We can't catch assertion failures, so validation above is critical
      let fileURL: URL
      if isFileURL {
        // Already a file:// URL, parse it safely
        guard let parsedURL = URL(string: trimmedPath) else {
          throw UrlContainsInvalidCharactersException()
        }
        fileURL = parsedURL
      } else {
        // Absolute path - iOS 18.6 will assert if malformed
        fileURL = URL(fileURLWithPath: trimmedPath)
      }
      
      return fileURL
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

  public static func convertResult(_ result: Any, appContext: AppContext) throws -> Any {
    if let value = result as? CGPoint {
      return ["x": value.x, "y": value.y]
    }
    return result
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

  public static func convertResult(_ result: Any, appContext: AppContext) throws -> Any {
    if let value = result as? CGSize {
      return ["width": value.width, "height": value.height]
    }
    return result
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

  public static func convertResult(_ result: Any, appContext: AppContext) throws -> Any {
    if let value = result as? CGVector {
      return ["dx": value.dx, "dy": value.dy]
    }
    return result
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

  public static func convertResult(_ result: Any, appContext: AppContext) throws -> Any {
    if let value = result as? CGRect {
      return ["x": value.minX, "y": value.minY, "width": value.width, "height": value.height]
    }
    return result
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
