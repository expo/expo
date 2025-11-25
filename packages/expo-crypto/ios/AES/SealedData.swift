import ExpoModulesCore
import CryptoKit

internal struct SealedDataConfig: Record {
    @Field
    var ivLength: Int = DEFAULT_IV_LENGTH
    
    @Field
    var tagLength: Int = DEFAULT_TAG_LENGTH
}

final class SealedData: SharedObject {
    private var inner: AES.GCM.SealedBox
    
    init(sealedBox: AES.GCM.SealedBox) {
        inner = sealedBox
    }
    
    init(ivLength: Int, tagLength: Int, content: Data) throws {
        // SealedBox(combined:) works only if IV length is 12
        // otherwise this needs to be done manually
        if ivLength == 12 {
            inner = try AES.GCM.SealedBox(combined: content)
        } else {
            let nonce = try AES.GCM.Nonce(data: content.prefix(ivLength))
            inner = try AES.GCM.SealedBox(nonce: nonce,
                                          ciphertext: content.dropFirst(ivLength).dropLast(tagLength),
                                          tag: content.suffix(tagLength))
        }
    }
    
    init(iv: Data, ciphertext: Data, tag: Data) throws {
        let nonce = try AES.GCM.Nonce(data: iv)
        inner = try AES.GCM.SealedBox(nonce: nonce,
                                      ciphertext: ciphertext,
                                      tag: tag)
    }
    
    convenience init(iv: Data, ciphertextWithTag: Data, tagLength: Int) throws {
        try self.init(iv: iv,
                      ciphertext: ciphertextWithTag.dropLast(tagLength),
                      tag: ciphertextWithTag.suffix(tagLength))
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
    
    var nativeValue: AES.GCM.SealedBox { inner }
    
    override func getAdditionalMemoryPressure() -> Int {
        self.combined.count
    }
}
