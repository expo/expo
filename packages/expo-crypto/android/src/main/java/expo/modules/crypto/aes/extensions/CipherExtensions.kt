package expo.modules.crypto.aes.extensions

import expo.modules.crypto.aes.objects.SealedData
import java.nio.ByteBuffer
import javax.crypto.Cipher

internal fun Cipher.encrypt(plaintext: ByteBuffer): SealedData {
  val plaintextSize = plaintext.remaining()
  val ciphertextWithTagSize = getOutputSize(plaintextSize)
  val tagSize = ciphertextWithTagSize - plaintextSize

  return SealedData(iv, plaintextSize, tagSize).also {
    doFinal(plaintext, it.taggedCiphertextBuffer)
  }
}

internal fun Cipher.decrypt(sealedData: SealedData): ByteBuffer {
  val inputBuf = sealedData.taggedCiphertextBuffer
  val plaintextSize = getOutputSize(inputBuf.remaining())

  return ByteBuffer.allocate(plaintextSize).also { outputBuf ->
    doFinal(inputBuf, outputBuf)
  }
}
