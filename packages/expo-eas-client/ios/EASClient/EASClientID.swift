// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public class EASClientID : NSObject {
  private static let EAS_CLIENT_ID_SHARED_PREFERENCES_KEY = "expo.eas-client-id"

  @objc public static func uuid() -> UUID {
    return UUID.init(uuidString: UserDefaults.standard.computeStringIfAbsent(forKey: EAS_CLIENT_ID_SHARED_PREFERENCES_KEY) {
      UUID.init().uuidString
    })!
  }

  /// Converts a UUID to a deterministic value in [0, 1] using the least significant
  /// 64 bits (bytes 8–15) interpreted as an unsigned integer fraction of UInt64.max.
  public static func deterministicUniformValue(_ uuid: UUID) -> Double {
    let value = withUnsafeBytes(of: uuid.uuid) {
      $0.load(fromByteOffset: 8, as: UInt64.self).bigEndian
    }
    return Double(value) / Double(UInt64.max)
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
