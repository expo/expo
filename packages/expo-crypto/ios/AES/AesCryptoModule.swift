import CommonCrypto
import CryptoKit
import ExpoModulesCore

internal let DEFAULT_IV_LENGTH = 12
internal let DEFAULT_TAG_LENGTH = 16

enum DataEncoding: String, Enumerable {
  case base64
  case hex
}

enum DataFormat: String, Enumerable {
  case bytes
  case base64
}

@Record
internal struct CiphertextOptions {
  var includeTag: Bool = false
  var outputFormat: DataFormat = .bytes
}

@Record
internal struct EncryptOptions {
  var nonce: NonceInput?
  var additionalData: BinaryInput?
}

@Record
internal struct DecryptOptions {
  var output: DataFormat = .bytes
  var additionalData: BinaryInput?
}

@Union
enum BinaryInput {
  case bytes(Data)
  case string(String)

  func intoData() throws -> Data {
    switch self {
    case .bytes(let data):
      return data
    case .string(let base64String):
      guard let data = Data(base64Encoded: base64String) else {
        throw InvalidBase64Exception()
      }
      return data
    }
  }
}

@Union
enum NonceInput {
  case base64(String)
  case bytes(Data)
  case length(Int)
}

@Union
enum BinaryOutput {
  case bytes(Data)
  case base64(String)
}

@ExpoModule("ExpoCryptoAES", classes: [EncryptionKey.self, SealedData.self])
public class AesCryptoModule: Module {
  @JS(.concurrent)
  func encryptAsync(
    plaintext: BinaryInput,
    key: EncryptionKey,
    options: EncryptOptions?
  ) async throws -> SealedData {
    return try mapCryptoKitError(to: EncryptionFailedException()) {
      return try encrypt(plaintext: plaintext, key: key, options: options)
    }
  }

  @JS(.concurrent)
  func decryptAsync(
    sealedData: SealedData,
    key: EncryptionKey,
    options: DecryptOptions?
  ) async throws -> BinaryOutput {
    return try mapCryptoKitError(to: DecryptionFailedException()) {
      return try decrypt(sealedData: sealedData, key: key, options: options)
    }
  }

  private func encrypt(
    plaintext: BinaryInput,
    key: EncryptionKey,
    options: EncryptOptions?
  ) throws -> SealedData {
    let iv: AES.GCM.Nonce
    switch options?.nonce {
    case .base64(let base64):
      guard let bytes = Data(base64Encoded: base64) else {
        throw InvalidBase64Exception()
      }
      iv = try AES.GCM.Nonce(data: bytes)
    case .bytes(let bytes):
      iv = try AES.GCM.Nonce(data: bytes)
    case .length(let size):
      iv = try AES.GCM.Nonce(ofSize: size)
    case nil:
      iv = AES.GCM.Nonce()  // defaults to 12-byte nonce
    }

    let encryptionResult =
      if let aad = options?.additionalData {
        try AES.GCM.seal(
          plaintext.intoData(),
          using: key.cryptoKitKey,
          nonce: iv,
          authenticating: aad.intoData()
        )
      } else {
        try AES.GCM.seal(
          plaintext.intoData(),
          using: key.cryptoKitKey,
          nonce: iv
        )
      }

    return SealedData(sealedBox: encryptionResult)
  }

  private func decrypt(
    sealedData: SealedData,
    key: EncryptionKey,
    options: DecryptOptions?
  ) throws -> BinaryOutput {
    let plaintext: Data =
      if let aad = options?.additionalData {
        try AES.GCM.open(
          sealedData.nativeValue,
          using: key.cryptoKitKey,
          authenticating: aad.intoData()
        )
      } else {
        try AES.GCM.open(
          sealedData.nativeValue,
          using: key.cryptoKitKey
        )
      }

    return plaintext.formatted(with: options?.output)
  }
}
