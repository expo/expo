// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public class EASClientID : NSObject {
  private static let EAS_CLIENT_ID_SHARED_PREFERENCES_KEY = "expo.eas-client-id"

  private static let MAX_52BIT: Double = 0xFFFFFFFFFFFFF // 4503599627370495

  @objc public static func uuid() -> UUID {
    return UUID.init(uuidString: UserDefaults.standard.computeStringIfAbsent(forKey: EAS_CLIENT_ID_SHARED_PREFERENCES_KEY) {
      UUID.init().uuidString
    })!
  }

  /// Converts a UUID to a deterministic value in [0, 1] by interpreting
  /// the first 52 bits (13 hex chars) as a fraction of the 52-bit max.
  /// 52 bits is the maximum that fits exactly in a Double's mantissa.
  public static func uuidToInterval(_ uuid: UUID) -> Double {
    let hex = uuid.uuidString.replacingOccurrences(of: "-", with: "")
    let first13 = String(hex.prefix(13))
    return Double(UInt64(first13, radix: 16)!) / MAX_52BIT
  }
}

extension UserDefaults {
  func computeStringIfAbsent(forKey: String, _ compute: () throws -> String) rethrows -> String {
    if let storedValue = string(forKey: forKey) {
      return storedValue
    }
    let computedValue = try compute()
    set(computedValue, forKey: forKey)
    return computedValue
  }
}
