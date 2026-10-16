package expo.modules.securestore

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.OptimizedRecord
import java.io.Serializable

@OptimizedRecord
class SecureStoreOptions(
  // Prompt can't be an empty string
  @Field var authenticationPrompt: String = " ",
  @Field var keychainService: String = SecureStoreModule.DEFAULT_KEYSTORE_ALIAS,
  @Field var requireAuthentication: Either<Boolean, String>? = null,
  @Field var requireConfirmation: Boolean = true
) : Record, Serializable {
  val authenticationRequirement: String?
    get() = requireAuthentication?.let { value ->
      if (value.`is`(Boolean::class)) {
        normalizeAuthenticationRequirement(value.get(Boolean::class))
      } else {
        normalizeAuthenticationRequirement(value.get(String::class))
      }
    }

  val isAuthenticationRequired: Boolean
    get() = authenticationRequirement != null

  val isDeviceCredentialsRequired: Boolean
    get() = authenticationRequirement == AUTHENTICATION_METHOD_DEVICE_CREDENTIALS
}

internal data class AuthenticationPromptOptions(
  val authenticationPrompt: String,
  val authenticationRequirement: String?,
  val requireConfirmation: Boolean
) {
  val isAuthenticationRequired: Boolean
    get() = authenticationRequirement != null

  val isDeviceCredentialsRequired: Boolean
    get() = authenticationRequirement == AUTHENTICATION_METHOD_DEVICE_CREDENTIALS
}

internal fun SecureStoreOptions.toAuthenticationPromptOptions(
  authenticationRequirement: String? = this.authenticationRequirement
) = AuthenticationPromptOptions(
  authenticationPrompt = authenticationPrompt,
  authenticationRequirement = authenticationRequirement,
  requireConfirmation = requireConfirmation
)
