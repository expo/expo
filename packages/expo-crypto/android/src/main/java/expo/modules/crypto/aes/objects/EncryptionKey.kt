package expo.modules.crypto.aes.objects

import expo.modules.crypto.aes.AesConfig.CRYPTO_KEY_ALGORITHM
import expo.modules.crypto.aes.enums.KeySize
import expo.modules.kotlin.sharedobjects.SharedObject
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.SecretKeySpec

class EncryptionKey: SharedObject {
  val keySize: KeySize
  val cryptoKey: SecretKey

  constructor(size: KeySize) {
    val keygen = KeyGenerator.getInstance(CRYPTO_KEY_ALGORITHM).apply {
      init(size.bitSize)
    }

    keySize = size
    cryptoKey = keygen.generateKey()
  }

  constructor(bytes: ByteArray) {
    keySize = KeySize.fromByteLength(bytes.size)
    cryptoKey = SecretKeySpec(bytes, CRYPTO_KEY_ALGORITHM)
  }

  val bytes: ByteArray
    get() = cryptoKey.encoded

  override fun getAdditionalMemoryPressure(): Int = keySize.byteSize
}
