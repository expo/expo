package expo.modules.crypto.aes

object AesConfig {
  const val DEFAULT_IV_SIZE: Int = 12
  const val DEFAULT_TAG_SIZE: Int = 16

  const val CRYPTO_KEY_ALGORITHM = "AES"
  const val CIPHER_TRANSFORMATION_NAME = "AES/GCM/NoPadding"
}