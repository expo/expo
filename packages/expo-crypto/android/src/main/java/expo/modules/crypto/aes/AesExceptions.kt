package expo.modules.crypto.aes

import expo.modules.core.errors.CodedException

class MissingStringEncodingException :
  CodedException("'encoding' argument must be provided for string input")

class InvalidKeyLengthException(byteLength: Int) :
  CodedException("EncryptionKey cannot be created from bytes of length '$byteLength'")

class InvalidSealedDataConfigException :
  CodedException("Invalid SealedData config")

class EncryptionFailed(cause: Throwable) :
  CodedException("AES encryption failed: ${cause.message}", cause)

class DecryptionFailed(cause: Throwable) :
  CodedException("AES decryption failed: ${cause.message}", cause)
