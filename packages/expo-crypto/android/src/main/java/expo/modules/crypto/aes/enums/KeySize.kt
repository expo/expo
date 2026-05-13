package expo.modules.crypto.aes.enums

import expo.modules.crypto.aes.InvalidKeyLengthException
import expo.modules.kotlin.types.Enumerable

enum class KeySize(val bitSize: Int) : Enumerable {
  AES128(128),
  AES192(192),
  AES256(256);

  val byteSize: Int
    get() = bitSize / 8

  companion object {
    fun fromByteLength(byteLen: Int): KeySize =
      entries.find { it.byteSize == byteLen }
        ?: throw InvalidKeyLengthException(byteLen)
  }
}
