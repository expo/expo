package expo.modules.securestore

import expo.modules.core.errors.CodedException

internal class NullKeyException :
  CodedException("SecureStore keys must not be null")

internal class WriteException(message: String?, cause: Throwable?) :
  CodedException(message ?: "An unexpected error occurred when writing to SecureStore", cause)

internal class ReadException(cause: Throwable?) :
  CodedException("An unexpected error occurred when reading from SecureStore", cause)

internal class SecureStoreIOException(cause: Throwable?) :
  CodedException("There was an I/O error loading the keystore for SecureStore", cause)

internal class EncryptException(message: String?, cause: Throwable?) :
  CodedException(message ?: "Could not encrypt the value for SecureStore", cause)

internal class DecryptException(message: String?, cause: Throwable?) :
  CodedException(message ?: "Could not decrypt the value for SecureStore", cause)

internal class SecureStoreJSONException(message: String?, cause: Throwable?) :
  CodedException(message, cause)

internal class DeleteException(message: String?, cause: Throwable?) :
  CodedException(message ?: "An unexpected error occurred when deleting from SecureStore", cause)
