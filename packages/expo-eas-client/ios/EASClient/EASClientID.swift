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

  /// Converts a UUID to a deterministic value in [0, 1).
  public static func deterministicUniformValue(_ uuid: UUID) -> Double {
    // Byte 8 is the RFC 4122 variant octet, pinned to `10`, and it is the high byte of the low
    // half, so that half alone only spans [0.5, 0.75]. splitmix64 over both halves moves the
    // fixed bits off the high end; 2^53 is the widest exact Double range.
    let (high, low) = withUnsafeBytes(of: uuid.uuid) {
      (
        $0.load(fromByteOffset: 0, as: UInt64.self).bigEndian,
        $0.load(fromByteOffset: 8, as: UInt64.self).bigEndian
      )
    }
    var z = high ^ low
    z = (z ^ (z >> 30)) &* 0xbf58_476d_1ce4_e5b9
    z = (z ^ (z >> 27)) &* 0x94d0_49bb_1331_11eb
    z = z ^ (z >> 31)
    return Double(z >> 11) / Double(1 << 53)
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
