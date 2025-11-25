package expo.modules.crypto.aes.objects

import expo.modules.crypto.aes.extensions.copiedArray
import expo.modules.crypto.aes.extensions.init
import expo.modules.crypto.aes.records.SealedDataConfig
import expo.modules.kotlin.sharedobjects.SharedObject
import java.nio.ByteBuffer

class SealedData(
  private val config: SealedDataConfig,
  private val content: ByteArray,
) : SharedObject() {
  init {
    assert(content.size > ivSize + tagSize) {
      "Invalid SealedData size"
    }
  }

  constructor(iv: ByteArray, ciphertextLength: Int, tagLength: Int) : this(
    config = SealedDataConfig(ivLength = iv.size, tagLength = tagLength),
    content = ByteArray(iv.size + ciphertextLength + tagLength).init {
      put(iv)
    }
  )

  constructor(iv: ByteArray, ciphertextWithTag: ByteArray, tagLength: Int) : this(
    config = SealedDataConfig(ivLength = iv.size, tagLength = tagLength),
    content = iv + ciphertextWithTag
  )

  private val ivBuffer: ByteBuffer
    get() = ByteBuffer.wrap(content, 0, ivSize)
  private val tagBuffer: ByteBuffer
    get() = ByteBuffer.wrap(content, content.size - tagSize, tagSize)
  private val combinedBuffer: ByteBuffer
    get() = ByteBuffer.wrap(content)
  private val ciphertextBuffer: ByteBuffer
    get() = ByteBuffer.wrap(content, ivSize, ciphertextSize)

  internal val taggedCiphertextBuffer: ByteBuffer
    get() = ByteBuffer.wrap(content, ivSize, ciphertextSize + tagSize)

  val combinedSize: Int
    get() = content.size
  val ivSize: Int
    get() = config.ivLength
  val tagSize: Int
    get() = config.tagLength
  val ciphertextSize: Int
    get() = combinedSize - ivSize - tagSize

  val ivBytes: ByteArray
    get() = ivBuffer.copiedArray()
  val tagBytes: ByteArray
    get() = tagBuffer.copiedArray()
  val combinedArray: ByteArray
    get() = combinedBuffer.array()

  fun ciphertextBytes(withTag: Boolean): ByteArray =
    if (withTag) {
      taggedCiphertextBuffer
    } else {
      ciphertextBuffer
    }.copiedArray()

  override fun getAdditionalMemoryPressure(): Int = content.size
}