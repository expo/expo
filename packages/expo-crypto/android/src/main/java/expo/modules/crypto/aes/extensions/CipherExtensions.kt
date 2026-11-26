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

internal fun Cipher.decrypt(sealedData: SealedData): ByteArray {
  val inputBuf = sealedData.taggedCiphertextBuffer
  val output = ByteArray(getOutputSize(inputBuf.remaining()))
  val written = doFinal(inputBuf, ByteBuffer.wrap(output))
  return if (written == output.size) output else output.copyOf(written)
}
