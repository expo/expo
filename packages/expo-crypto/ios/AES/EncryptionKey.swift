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
        let data = switch encoding {
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
    
    var keySize: KeySize {
        KeySize(rawValue: inner.bitCount)!
    }

    var bytes: Data {
            var keyBytes = Data(count: keySize.byteSize)
            let _ = keyBytes.withUnsafeMutableBytes { dest in
                inner.withUnsafeBytes { src in
                    src.copyBytes(to: dest)
                }
            }
        return keyBytes
    }
    
    func encoded(with encoding: DataEncoding) -> String {
        bytes.getEncoded(with: encoding)
    }
    
    var cryptoKitKey: CryptoKit.SymmetricKey {
        inner
    }
    
    override func getAdditionalMemoryPressure() -> Int {
        self.keySize.byteSize
    }
}

