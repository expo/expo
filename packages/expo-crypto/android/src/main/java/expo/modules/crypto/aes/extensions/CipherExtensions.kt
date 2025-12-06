package expo.modules.crypto.aes.extensions

import expo.modules.crypto.aes.objects.SealedData
import java.nio.ByteBuffer
import javax.crypto.Cipher

internal fun Cipher.encrypt(plaintext: ByteBuffer): SealedData {
  val iv = this.iv
  val plaintextSize = plaintext.remaining()
  val ciphertextWithTagSize = this.getOutputSize(plaintextSize)
  val tagSize = ciphertextWithTagSize - plaintextSize

  val sealedData = SealedData(iv, plaintextSize, tagSize).also {
    this.doFinal(plaintext, it.taggedCiphertextBuffer)
  }
  return sealedData
}

internal fun Cipher.decrypt(sealedData: SealedData): ByteBuffer {
  val inputBuf = sealedData.taggedCiphertextBuffer
  val plaintextSize = this.getOutputSize(inputBuf.remaining())

  val plaintext = ByteBuffer.allocate(plaintextSize).also { outputBuf ->
    this.doFinal(inputBuf, outputBuf)
  }
  return plaintext
}
