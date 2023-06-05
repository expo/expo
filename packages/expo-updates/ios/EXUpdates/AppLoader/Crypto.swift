//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable legacy_objc_type

import Foundation
import ASN1Decoder
import CommonCrypto

internal typealias VerifySignatureSuccessBlock = (_ success: Bool) -> Void
internal typealias VerifySignatureErrorBlock = (_ error: Error) -> Void

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

private let ErrorDomain = "EXUpdatesCrypto"
private enum CryptoErrorCode: Int {
  case PublicKeyDownloadError = 1049
}

/**
 * Methods for legacy signature verification of manifests.
 */
internal final class Crypto {
  // this always succeeds since it is hardcoded
  // swiftlint:disable:next force_unwrapping
  private static let PublicKeyUrl = URL(string: "https://exp.host/--/manifest-public-key")!

  private static let PublicKeyTag = "exp.host.publickey"
  private static let PublicKeyFilename = "manifestPublicKey.pem"

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

  static func verifySignature(
    withData data: String,
    signature: String,
    config: UpdatesConfig,
    successBlock: @escaping VerifySignatureSuccessBlock,
    errorBlock: @escaping VerifySignatureErrorBlock
  ) {
    guard !data.isEmpty && !signature.isEmpty else {
      errorBlock(NSError(
        domain: "EXUpdatesCrypto",
        code: 1001,
        userInfo: [NSLocalizedDescriptionKey: "Cannot verify the manifest because it is empty or has no signature."]
      ))
      return
    }

    func fetchRemotelyBlock() {
      fetchAndVerifySignature(withData: data, signature: signature, config: config, successBlock: successBlock, errorBlock: errorBlock)
    }

    let configuration = URLSessionConfiguration.default
    configuration.requestCachePolicy = .returnCacheDataDontLoad
    let fileDownloader = FileDownloader(config: config, urlSessionConfiguration: configuration)
    fileDownloader.downloadData(
      fromURL: PublicKeyUrl,
      extraHeaders: [:]
    ) { publicKeyData, _ in
      guard let publicKeyData = publicKeyData else {
        fetchRemotelyBlock()
        return
      }

      verify(withPublicKey: publicKeyData, signature: signature, signedString: data) { isValid in
        if isValid {
          successBlock(isValid)
        } else {
          fetchRemotelyBlock()
        }
      }
    } errorBlock: { _ in
      fetchRemotelyBlock()
    }
  }

  private static func fetchAndVerifySignature(
    withData data: String,
    signature: String,
    config: UpdatesConfig,
    successBlock: @escaping VerifySignatureSuccessBlock,
    errorBlock: @escaping VerifySignatureErrorBlock
  ) {
    let configuration = URLSessionConfiguration.default
    configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
    let fileDownloader = FileDownloader(config: config, urlSessionConfiguration: configuration)
    fileDownloader.downloadData(
      fromURL: PublicKeyUrl,
      extraHeaders: [:]
    ) { publicKeyData, _ in
      guard let publicKeyData = publicKeyData else {
        errorBlock(NSError(
          domain: ErrorDomain,
          code: CryptoErrorCode.PublicKeyDownloadError.rawValue,
          userInfo: [NSLocalizedDescriptionKey: "Public key response body empty"]
        ))
        return
      }
      verify(withPublicKey: publicKeyData, signature: signature, signedString: data, callback: successBlock)
    } errorBlock: { error in
      errorBlock(error)
    }
  }

  private static func verify(
    withPublicKey publicKeyData: Data,
    signature: String,
    signedString: String,
    callback: @escaping VerifySignatureSuccessBlock
  ) {
    guard !publicKeyData.isEmpty else {
      callback(false)
      return
    }

    DispatchQueue.main.async {
      if let publicKey = keyRefFromPEMData(publicKeyData),
        let signatureData = NSData(base64Encoded: signature) as? Data,
        let signedData = signedString.data(using: .utf8) {
        callback(verifyRSASHA256SignedData(signedData, signatureData: signatureData, publicKey: publicKey))
      } else {
        callback(false)
      }
    }
  }

  private static func keyRefFromPEMData(_ pemData: Data) -> SecKey? {
    guard let publicKey = decodePEMToDER(pem: pemData, pemType: .publicKey) else {
      return nil
    }

    let sizeInBits = publicKey.count * 8
    let keyDict: [CFString: Any] = [
      kSecAttrKeyType: kSecAttrKeyTypeRSA,
      kSecAttrKeyClass: kSecAttrKeyClassPublic,
      kSecAttrKeySizeInBits: NSNumber(value: sizeInBits),
      kSecReturnPersistentRef: true
    ]
    var error: Unmanaged<CFError>?
    if let key = SecKeyCreateWithData(publicKey as CFData, keyDict as CFDictionary, &error) {
      return key
    } else {
      return nil
    }
  }

  private static func verifyRSASHA256SignedData(_ signedData: Data, signatureData: Data, publicKey: SecKey) -> Bool {
    var hashBytes = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
    signedData.withUnsafeBytes { bytes in
      _ = CC_SHA256(bytes.baseAddress, CC_LONG(signedData.count), &hashBytes)
    }
    let hashData = Data(hashBytes)
    var error: Unmanaged<CFError>?
    return SecKeyVerifySignature(publicKey, .rsaSignatureDigestPKCS1v15SHA256, hashData as CFData, signatureData as CFData, &error)
  }
}
