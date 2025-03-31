// Copyright 2022-present 650 Industries. All rights reserved.

import CommonCrypto
import ExpoModulesCore

public class CryptoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoCrypto")

    AsyncFunction("digestStringAsync", digestString)

    Function("digestString", digestString)

    AsyncFunction("getRandomBase64StringAsync", getRandomBase64String)

    Function("getRandomBase64String", getRandomBase64String)

    Function("getRandomValues", getRandomValues)

    Function("digest", digest)

    Function("randomUUID") {
      UUID().uuidString.lowercased()
    }
  }
}

private func getRandomBase64String(length: Int) throws -> String {
  var bytes = [UInt8](repeating: 0, count: length)
  let status = SecRandomCopyBytes(kSecRandomDefault, length, &bytes)

  guard status == errSecSuccess else {
    throw FailedGeneratingRandomBytesException(status)
  }
  return Data(bytes).base64EncodedString()
}

private func digestString(algorithm: DigestAlgorithm, str: String, options: DigestOptions) throws -> String {
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

private func getRandomValues(array: TypedArray) throws -> TypedArray {
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

private func digest(algorithm: DigestAlgorithm, output: TypedArray, data: TypedArray) {
  let outputPtr = output.rawPointer.assumingMemoryBound(to: UInt8.self)
  _ = algorithm.digest(data.rawPointer, UInt32(data.byteLength), outputPtr)
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
