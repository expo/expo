import CryptoKit
import ExpoModulesCore

enum KeySize: Int, Enumerable {
  case aes128 = 128
  case aes192 = 192
  case aes256 = 256

  func cryptoKitValue() -> CryptoKit.SymmetricKeySize {
    SymmetricKeySize(bitCount: self.rawValue)
  }

  var byteSize: Int { rawValue / 8 }

  static func isValidSize(byteLength: Int) -> Bool {
    allCases.contains(where: { $0.byteSize == byteLength })
  }
}

@SharedObject
final class EncryptionKey: SharedObject {
  private var inner: CryptoKit.SymmetricKey

  init(size: KeySize) {
    inner = CryptoKit.SymmetricKey(size: size.cryptoKitValue())
  }

  init(bytes: Data) throws {
    guard KeySize.isValidSize(byteLength: bytes.count) else {
      throw InvalidKeySizeException(bytes.count)
    }
    inner = CryptoKit.SymmetricKey(data: bytes)
  }

  convenience init(string: String, encodedWith encoding: DataEncoding) throws {
    let data =
      switch encoding {
      case .base64:
        Data(base64Encoded: string)
      case .hex:
        Data(hexEncoded: string)
      }

    guard let bytes = data else {
      throw InvalidKeyFormatException()
    }
    try self.init(bytes: bytes)
  }

  @JS
  static func generate(size: KeySize?) async -> EncryptionKey {
    return EncryptionKey(size: size ?? .aes256)
  }

  @JS("import")
  static func importKey(rawKey: BinaryInput, encoding: DataEncoding?) async throws -> EncryptionKey {
    switch rawKey {
    case .bytes(let bytes):
      return try EncryptionKey(bytes: bytes)
    case .string(let keyString):
      guard let encoding else {
        throw MissingEncodingException()
      }
      return try EncryptionKey(string: keyString, encodedWith: encoding)
    }
  }

  // `nonisolated` so `bytes` and `getAdditionalMemoryPressure()`, which aren't isolated, can read it.
  @JS("size")
  nonisolated var keySize: KeySize {
    // size is always verified when inner is created
    // swiftlint:disable:next force_unwrapping
    KeySize(rawValue: inner.bitCount)!
  }

  var bytes: Data {
    var keyBytes = Data(count: keySize.byteSize)
    _ = keyBytes.withUnsafeMutableBytes { dest in
      inner.withUnsafeBytes { src in
        src.copyBytes(to: dest)
      }
    }
    return keyBytes
  }

  @JS("bytes")
  func bytesData() async -> Data {
    return bytes
  }

  @JS
  func encoded(with encoding: DataEncoding) async -> String {
    bytes.getEncoded(with: encoding)
  }

  var cryptoKitKey: CryptoKit.SymmetricKey {
    inner
  }

  override func getAdditionalMemoryPressure() -> Int {
    self.keySize.byteSize
  }
}
