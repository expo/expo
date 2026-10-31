import CryptoKit
import ExpoModulesCore

final class InvalidKeySizeException: GenericException<Int>, @unchecked Sendable {
  override var reason: String {
    "Invalid key byte length: '\(param)'"
  }
}

final class InvalidKeyFormatException: Exception, @unchecked Sendable {
  override var reason: String {
    "Invalid key format provided"
  }
}

final class InvalidBase64Exception: Exception, @unchecked Sendable {
  override var reason: String {
    "Invalid base64 string"
  }
}

final class NonceGenerationFailedException: GenericException<Int>,
  @unchecked Sendable {
  override var reason: String {
    "Failed to generate IV of size '\(param)'"
  }
}

final class MissingEncodingException: Exception, @unchecked Sendable {
  override var reason: String {
    "Encoding argument must be provided for string inputs"
  }
}

final class EncryptionFailedException: Exception, @unchecked Sendable {
  override var reason: String {
    "Cannot encrypt the data because AES-GCM rejected the input. Check the nonce, or omit it to generate a 12-byte nonce"
  }
}

final class DecryptionFailedException: Exception, @unchecked Sendable {
  override var reason: String {
    "Cannot decrypt the sealed data because its authentication failed. Use the key and the additional data that encrypted it"
  }
}

final class InvalidSealedDataException: Exception, @unchecked Sendable {
  override var code: String {
    // The code that the web implementation throws for the same input.
    "ERR_INVALID_SEALED_DATA_CONFIG"
  }

  override var reason: String {
    "Cannot create the sealed data because the IV, the ciphertext, or the tag has an invalid length. Use the IV and tag lengths that encryption used"
  }
}

/// Runs `body` and rethrows a CryptoKit error as the given exception, with the CryptoKit error as its
/// cause, so JavaScript receives an error with a code.
func mapCryptoKitError<T>(to exception: @autoclosure () -> Exception, _ body: () throws -> T) throws -> T {
  do {
    return try body()
  } catch let error as CryptoKitError {
    throw exception().causedBy(error)
  }
}
