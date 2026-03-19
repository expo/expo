// Copyright 2015-present 650 Industries. All rights reserved.

import CryptoKit
import Foundation

@objc
public class EASClientID : NSObject {
  private static let EAS_CLIENT_ID_SHARED_PREFERENCES_KEY = "expo.eas-client-id"

  @objc public static func uuid() -> UUID {
    return UUID.init(uuidString: UserDefaults.standard.computeStringIfAbsent(forKey: EAS_CLIENT_ID_SHARED_PREFERENCES_KEY) {
      UUID.init().uuidString
    })!
  }

  /// Converts a UUID to a deterministic value in [0, 1] by hashing its raw bytes
  /// with SHA-256 and interpreting the first 8 bytes as a UInt64 fraction.
  public static func uuidToInterval(_ uuid: UUID) -> Double {
    let uuidBytes = withUnsafeBytes(of: uuid.uuid) { Data($0) }
    let hash = SHA256.hash(data: uuidBytes)
    let value = hash.withUnsafeBytes { $0.load(as: UInt64.self).bigEndian }
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
