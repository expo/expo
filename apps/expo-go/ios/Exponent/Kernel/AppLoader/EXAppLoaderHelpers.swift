// Copyright 2020-present 650 Industries. All rights reserved.

import Foundation
import CryptoKit

@objc
public extension NSString {
  func hexEncodedSHA256() -> String {
    let swiftString = self as String
    guard let data = swiftString.data(using: .utf8) else {
      // this should never happen
      return ""
    }

    let digest: SHA256.Digest = SHA256.hash(data: data)
    return digest.map { String(format: "%02hhx", $0) }.joined()
  }
}
