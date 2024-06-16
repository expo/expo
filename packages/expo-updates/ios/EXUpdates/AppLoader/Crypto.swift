//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

internal enum PEMType {
  case publicKey
  case certificate

  func beginBlock() -> String {
    switch self {
    case .publicKey:
      return "-----BEGIN PUBLIC KEY-----"
    case .certificate:
      return "-----BEGIN CERTIFICATE-----"
    }
  }

  func endBlock() -> String {
    switch self {
    case .publicKey:
      return "-----END PUBLIC KEY-----"
    case .certificate:
      return "-----END CERTIFICATE-----"
    }
  }
}

internal final class Crypto {
  static func decodePEMToDER(pem: Data, pemType: PEMType) -> Data? {
    // Mostly from ASN1Decoder with the fix for disallowing multiple bodies in the PEM.

    guard let pem = String(data: pem, encoding: .ascii) else {
      return nil
    }

    if pem.components(separatedBy: pemType.beginBlock()).count - 1 != 1 {
      return nil
    }

    let lines = pem.components(separatedBy: .newlines)
    var base64Buffer = ""
    var certLine = false
    for line in lines {
      if line == pemType.endBlock() {
        certLine = false
      }
      if certLine {
        base64Buffer.append(line)
      }
      if line == pemType.beginBlock() {
        certLine = true
      }
    }
    if let derDataDecoded = Data(base64Encoded: base64Buffer) {
      return derDataDecoded
    }

    return nil
  }
}
