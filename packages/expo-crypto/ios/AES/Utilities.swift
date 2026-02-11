import CryptoKit

extension Data {
  init?(hexEncoded: String) {
    let hex = hexEncoded.replacingOccurrences(of: "0x", with: "")
    guard hex.count.isMultiple(of: 2) else {
      return nil
    }

    let chars = Array(hex)
    let bytes = stride(from: 0, to: chars.count, by: 2)
      .map { String(chars[$0]) + String(chars[$0 + 1]) }
      .compactMap { UInt8($0, radix: 16) }

    guard hex.count / bytes.count == 2 else { return nil }
    self.init(bytes)
  }

  func getEncoded(with encoding: DataEncoding) -> String {
    switch encoding {
    case .base64:
      self.base64EncodedString()
    case .hex:
      self.map { String(format: "%02hhx", $0) }.joined()
    }
  }

  func formatted(with format: DataFormat?) -> Any {
    switch format {
    case .bytes, nil:
      return self
    case .base64:
      return self.base64EncodedString()
    }
  }
}

extension AES.GCM.Nonce {
  init(ofSize size: Int) throws {
    var data = Data(count: size)
    let status = try data.withUnsafeMutableBytes { (ptr: UnsafeMutableRawBufferPointer) in
      guard let baseAddress = ptr.baseAddress else {
        throw NonceGenerationFailedException(size)
      }
      return SecRandomCopyBytes(kSecRandomDefault, size, baseAddress)
    }
    guard status == errSecSuccess else {
      throw NonceGenerationFailedException(size)
    }
    try self.init(data: data)
  }
}
