package host.exp.exponent.services

import java.security.GeneralSecurityException

class FakeSessionCipher(var failsToDecrypt: Boolean = false) : SessionCipher {
  override fun encrypt(plaintext: ByteArray): ByteArray = plaintext.reversedArray()

  override fun decrypt(ciphertext: ByteArray): ByteArray {
    if (failsToDecrypt) {
      throw GeneralSecurityException("key invalidated")
    }
    return ciphertext.reversedArray()
  }
}
