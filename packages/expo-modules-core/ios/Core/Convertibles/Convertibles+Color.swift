// Copyright 2022-present 650 Industries. All rights reserved.

// The conversions live with the `JavaScriptDecodable` and `JavaScriptEncodable` conformances in
// `JavaScriptCodable+Color.swift`.

extension UIColor: Convertible {
  public static func convert(from value: Any?, appContext: AppContext) throws -> Self {
    return try convert(from: value)
  }

  public static func convert(from value: Any?) throws -> Self {
    // swiftlint:disable:next force_cast
    return try uiColorFromAny(value) as! Self
  }

  public static func convertResult(_ result: Any, appContext: AppContext) throws -> Any {
    if let value = result as? UIColor {
      return value.string
    }
    return result
  }
}

extension CGColor: Convertible {
  public static func convert(from value: Any?, appContext: AppContext) throws -> Self {
    return try convert(from: value)
  }

  public static func convert(from value: Any?) throws -> Self {
    // swiftlint:disable:next force_cast
    return try cgColorFromAny(value) as! Self
  }

  public static func convertResult(_ result: Any, appContext: AppContext) throws -> Any {
    let cgColor = result as! CGColor
    let uiColor = UIColor(cgColor: cgColor)
    return try UIColor.convertResult(uiColor, appContext: appContext)
  }
}
