// Copyright 2020-present 650 Industries. All rights reserved.

import Foundation
import CommonCrypto

@objc
public extension NSString {
  @objc func hexEncodedSHA256() -> String {
    let digest = (self as String).data(using:String.Encoding.utf8)!.sha256()
    return digest.reduce("") { $0 + String(format: "%02x", $1) }
  }
}

public extension Data {
  func sha256() -> Data {
    var digest = Data(count: Int(CC_SHA256_DIGEST_LENGTH))
    withUnsafeBytes { bytes in
      digest.withUnsafeMutableBytes { mutableBytes in
        _ = CC_SHA256(bytes.baseAddress, CC_LONG(count), mutableBytes.bindMemory(to: UInt8.self).baseAddress)
      }
    }
    return digest
  }
}
