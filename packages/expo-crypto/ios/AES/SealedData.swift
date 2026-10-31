import CryptoKit
import ExpoModulesCore

@Record
internal struct SealedDataConfig {
  var ivLength: Int = DEFAULT_IV_LENGTH
  var tagLength: Int = DEFAULT_TAG_LENGTH
}

@Union
enum TagInput {
  case bytes(Data)
  case length(Int)
}

@SharedObject
final class SealedData: SharedObject {
  private var inner: AES.GCM.SealedBox

  init(sealedBox: AES.GCM.SealedBox) {
    inner = sealedBox
  }

  init(ivLength: Int, tagLength: Int, content: Data) throws {
    // SealedBox(combined:) works only if IV length is 12 (default)
    // otherwise this needs to be done manually
    if ivLength == DEFAULT_IV_LENGTH {
      inner = try AES.GCM.SealedBox(combined: content)
    } else {
      let nonce = try AES.GCM.Nonce(data: content.prefix(ivLength))
      inner = try AES.GCM.SealedBox(
        nonce: nonce,
        ciphertext: content.dropFirst(ivLength).dropLast(tagLength),
        tag: content.suffix(tagLength)
      )
    }
  }

  init(iv: Data, ciphertext: Data, tag: Data) throws {
    let nonce = try AES.GCM.Nonce(data: iv)
    inner = try AES.GCM.SealedBox(
      nonce: nonce,
      ciphertext: ciphertext,
      tag: tag
    )
  }

  convenience init(iv: Data, ciphertextWithTag: Data, tagLength: Int) throws {
    try self.init(
      iv: iv,
      ciphertext: ciphertextWithTag.dropLast(tagLength),
      tag: ciphertextWithTag.suffix(tagLength)
    )
  }

  @JS
  static func fromCombined(combined: BinaryInput, config: SealedDataConfig?) throws -> SealedData {
    let config = config ?? SealedDataConfig()

    return try mapCryptoKitError(to: InvalidSealedDataException()) {
      return try SealedData(
        ivLength: config.ivLength,
        tagLength: config.tagLength,
        content: combined.intoData()
      )
    }
  }

  @JS
  static func fromParts(iv: BinaryInput, ciphertext: BinaryInput, tag: TagInput?) throws -> SealedData {
    return try mapCryptoKitError(to: InvalidSealedDataException()) {
      switch tag ?? .length(DEFAULT_TAG_LENGTH) {
      case .bytes(let tagData):
        return try SealedData(
          iv: iv.intoData(),
          ciphertext: ciphertext.intoData(),
          tag: tagData
        )
      case .length(let tagLength):
        return try SealedData(
          iv: iv.intoData(),
          ciphertextWithTag: ciphertext.intoData(),
          tagLength: tagLength
        )
      }
    }
  }

  var combined: Data {
    // combined works only if IV length is 12 bytes
    if let combined = inner.combined {
      return combined
    }

    return self.iv + inner.ciphertext + self.tag
  }

  var iv: Data {
    Data(inner.nonce)
  }

  var tag: Data {
    inner.tag
  }

  func ciphertext(withTag: Bool) -> Data {
    if withTag {
      return inner.ciphertext + inner.tag
    }
    return inner.ciphertext
  }

  @JS
  var combinedSize: Int {
    return combined.count
  }

  @JS
  var ivSize: Int {
    return iv.count
  }

  @JS
  var tagSize: Int {
    return tag.count
  }

  @JS
  func iv(format: DataFormat?) async -> BinaryOutput {
    return iv.formatted(with: format)
  }

  @JS
  func tag(format: DataFormat?) async -> BinaryOutput {
    return tag.formatted(with: format)
  }

  @JS
  func combined(format: DataFormat?) async -> BinaryOutput {
    return combined.formatted(with: format)
  }

  @JS
  func ciphertext(options: CiphertextOptions?) async -> BinaryOutput {
    return ciphertext(withTag: options?.includeTag ?? false)
      .formatted(with: options?.outputFormat)
  }

  var nativeValue: AES.GCM.SealedBox { inner }

  override func getAdditionalMemoryPressure() -> Int {
    self.combined.count
  }
}
