package expo.modules.crypto.aes.enums

import expo.modules.kotlin.types.Enumerable

enum class KeySize(val bitSize: Int): Enumerable {
    AES128(128),
    AES192(192),
    AES256(256);

    val byteSize: Int
        get() = bitSize / 8

    companion object {
        fun fromByteLength(byteLen: Int): KeySize = requireNotNull(
            entries.find { it.byteSize == byteLen }
        ) { "EncryptionKey cannot be created from bytes of length '$byteLen'"}
    }
}