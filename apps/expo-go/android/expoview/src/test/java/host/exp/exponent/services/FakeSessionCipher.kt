package host.exp.exponent.services

import java.security.GeneralSecurityException

class FakeSessionCipher(var failsToDecrypt: Boolean = false, var failsToEncrypt: Boolean = false) : SessionCipher {
  override fun encrypt(plaintext: ByteArray): ByteArray {
    if (failsToEncrypt) {
      throw GeneralSecurityException("keystore unavailable")
    }
    return plaintext.reversedArray()
  }

  override fun decrypt(ciphertext: ByteArray): ByteArray {
    if (failsToDecrypt) {
      throw GeneralSecurityException("key invalidated")
    }
    return ciphertext.reversedArray()
  }
}
