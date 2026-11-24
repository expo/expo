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
  val output = ByteBuffer.allocate(getOutputSize(inputBuf.remaining()))
  val written = doFinal(inputBuf, output)

  // The caller reads the backing array. Its size must equal the number of bytes written.
  return if (written == output.capacity()) {
    output
  } else {
    ByteBuffer.wrap(output.array().copyOf(written))
  }
}
