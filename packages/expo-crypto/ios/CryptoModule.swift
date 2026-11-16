// Copyright 2022-present 650 Industries. All rights reserved.

import CommonCrypto
import ExpoModulesCore

@ExpoModule("ExpoCrypto")
public class CryptoModule: Module {
  // Async `@JS` members are isolated to the JS thread by default and this one never suspends, so
  // `.concurrent` keeps the digest from blocking it.
  @JS(.concurrent)
  func digestStringAsync(
    algorithm: DigestAlgorithm,
    str: String,
    options: DigestOptions
  ) async throws -> String {
    return try digestString(algorithm: algorithm, str: str, options: options)
  }

  // `nonisolated` so the digest is reachable from `digestStringAsync` too; it only computes.
  @JS
  nonisolated func digestString(
    algorithm: DigestAlgorithm,
    str: String,
    options: DigestOptions
  ) throws -> String {
    guard let data = str.data(using: .utf8) else {
      throw LossyConversionException()
    }

    let length = Int(algorithm.digestLength)
    var digest = [UInt8](repeating: 0, count: length)

    data.withUnsafeBytes { bytes in
      let _ = algorithm.digest(bytes.baseAddress, UInt32(data.count), &digest)
    }

    switch options.encoding {
    case .hex:
      return digest.reduce("") { $0 + String(format: "%02x", $1) }
    case .base64:
      return Data(digest).base64EncodedString()
    }
  }

  @JS
  func getRandomValues(array: TypedArray) throws -> TypedArray {
    let status = SecRandomCopyBytes(
      kSecRandomDefault,
      array.byteLength,
      array.rawPointer
    )

    guard status == errSecSuccess else {
      throw FailedGeneratingRandomBytesException(status)
    }
    return array
  }

  @JS
  func digest(algorithm: DigestAlgorithm, output: TypedArray, data: TypedArray) {
    let outputPtr = output.rawPointer.assumingMemoryBound(to: UInt8.self)
    _ = algorithm.digest(data.rawPointer, UInt32(data.byteLength), outputPtr)
  }

  @JS
  func randomUUID() -> String {
    return UUID().uuidString.lowercased()
  }
}

private final class LossyConversionException: Exception {
  override var reason: String {
    "Unable to convert given string without losing some information"
  }
}

private final class FailedGeneratingRandomBytesException: GenericException<OSStatus> {
  override var reason: String {
    "Generating random bytes has failed with OSStatus code: \(param)"
  }
}
