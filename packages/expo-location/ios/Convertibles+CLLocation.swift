// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

extension CLLocation: Convertible {
  public static func convert(from value: Any?, appContext: AppContext) throws -> Self {
    if let value = value as? [String: Any] {
      let args = try Conversions.pickValues(from: value, byKeys: ["latitude", "longitude"], as: Double.self)
      // swiftlint:disable:next force_cast
      return CLLocation(latitude: args[0], longitude: args[1]) as! Self
    }
    throw Conversions.ConvertingException<CLLocation>(value)
  }
}
