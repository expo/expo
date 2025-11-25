import ExpoModulesCore
import CryptoKit
import CommonCrypto

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

internal struct CiphertextOptions: Record {
    @Field
    var includeTag: Bool = false
    
    @Field
    var outputFormat: DataFormat = .bytes
}

internal struct EncryptOptions: Record {
    @Field
    var nonce: EitherOfThree<String, Data, Int>? = nil
    
    @Field
    var additionalData: BinaryInput? = nil
}

internal struct DecryptOptions: Record {
    @Field
    var output: DataFormat = .bytes
    
    @Field
    var additionalData: BinaryInput? = nil
}

typealias BinaryInput = Either<Data, String>

extension BinaryInput {
    func intoData() throws -> Data {
        if let data: Data = self.get() {
            return data
        }
        
        let base64String = try self.as(String.self)
        guard let data = Data(base64Encoded: base64String) else {
            throw InvalidBase64Exception()
        }
        return data
    }
}

public class AesCryptoModule: Module {
  public func definition() -> ModuleDefinition {
        Name("ExpoCryptoAES")

        AsyncFunction("encryptAsync", self.encrypt)
        AsyncFunction("decryptAsync", self.decrypt)

        Class("EncryptionKey", EncryptionKey.self) {
            StaticAsyncFunction("generate", self.generateKey)
            StaticAsyncFunction("import", self.importKey)

            AsyncFunction("bytes") { (key: EncryptionKey) in key.bytes }
            AsyncFunction("encoded") {
                (key: EncryptionKey, encoding: DataEncoding) in
                key.encoded(with: encoding)
            }
            Property("size") { (key: EncryptionKey) in key.keySize }
        }

        Class("SealedData", SealedData.self) {
            StaticFunction("fromCombined") {
                (combined: BinaryInput, config: SealedDataConfig?) in
                let config = config ?? SealedDataConfig()

                return try SealedData(
                    ivLength: config.ivLength,
                    tagLength: config.tagLength,
                    content: combined.intoData()
                )
            }
            StaticFunction("fromParts") {
                (iv: BinaryInput, ciphertext: BinaryInput, tag: Either<Data, Int>?) in
                if let tagData: Data = tag?.get() {
                    return try SealedData(
                        iv: iv.intoData(),
                        ciphertext: ciphertext.intoData(),
                        tag: tagData
                    )
                }

                let tagLength: Int = tag?.get() ?? DEFAULT_TAG_LENGTH
                return try SealedData(
                    iv: iv.intoData(),
                    ciphertextWithTag: ciphertext.intoData(),
                    tagLength: tagLength
                )
            }

            Property("combinedSize") { (sealedData: SealedData) in
                sealedData.combined.count
            }
            Property("ivSize") { (sealedData: SealedData) in
                sealedData.iv.count
            }
            Property("tagSize") { (sealedData: SealedData) in
                sealedData.tag.count
            }

            AsyncFunction("iv") {
                (sealedData: SealedData, format: DataFormat?) -> Any in
                sealedData.iv.formatted(with: format)
            }
            AsyncFunction("tag") {
                (sealedData: SealedData, format: DataFormat?) -> Any in
                sealedData.tag.formatted(with: format)
            }
            AsyncFunction("combined") {
                (sealedData: SealedData, format: DataFormat?) -> Any in
                sealedData.combined.formatted(with: format)
            }
            AsyncFunction("ciphertext") {
                (sealedData: SealedData, options: CiphertextOptions?) -> Any in
                sealedData
                    .ciphertext(withTag: options?.includeTag ?? false)
                    .formatted(with: options?.outputFormat)
            }
        }
    }

    private func generateKey(size: KeySize?) -> EncryptionKey {
        EncryptionKey(size: size ?? KeySize.aes256)
    }

    private func importKey(
        rawKey: Either<Data, String>,
        encoding: DataEncoding?
    ) throws -> EncryptionKey {
        if rawKey.is(Data.self) {
            return try EncryptionKey(bytes: rawKey.as(Data.self))
        }

        guard let dataEncoding = encoding else {
            throw MissingEncodingException()
        }
        let keyString = try rawKey.as(String.self)
        return try EncryptionKey(string: keyString, encodedWith: dataEncoding)
    }

    private func encrypt(
        plaintext: BinaryInput,
        key: EncryptionKey,
        options: EncryptOptions?
    ) throws -> SealedData {
        if let bytes: Data = options?.nonce?.get() {
            log.info("Got bytes", bytes)
        } else if let size: Int = options?.nonce?.get() {
            log.info("Got size", size)
        } else if let either = options?.nonce {
            log.info("Nonce", either)
            log.info("is Data", either.is(Data.self))
            log.info("is Int", either.is(Int.self))
        }
        let iv: AES.GCM.Nonce
        if let bytes: Data = options?.nonce?.get() {
            iv = try AES.GCM.Nonce(data: bytes)
        } else if let base64: String = options?.nonce?.get() {
            guard let bytes = Data(base64Encoded: base64) else {
                throw InvalidBase64Exception()
            }
            iv = try AES.GCM.Nonce(data: bytes)
        } else if let size: Int = options?.nonce?.get() {
            iv = try AES.GCM.Nonce(ofSize: size)
        } else {
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
                try AES.GCM.seal(plaintext.intoData(), using: key.cryptoKitKey, nonce: iv)
            }

        return SealedData(sealedBox: encryptionResult)
    }

    private func decrypt(
        sealedData: SealedData,
        key: EncryptionKey,
        options: DecryptOptions?
    ) throws -> Any {
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

        if options?.output == .base64 {
            return plaintext.base64EncodedString()
        }
        return plaintext
    }
}
