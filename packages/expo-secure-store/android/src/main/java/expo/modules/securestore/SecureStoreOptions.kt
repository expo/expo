package expo.modules.securestore

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
class SecureStoreOptions(
  // Prompt can't be an empty string
  @Field var authenticationPrompt: String = " ",
  @Field var keychainService: String = SecureStoreModule.DEFAULT_KEYSTORE_ALIAS,
  @Field var requireAuthentication: Boolean = false,
  @Field var requireConfirmation: Boolean = true
) : Record, Serializable

internal data class AuthenticationPromptOptions(
  val authenticationPrompt: String,
  val requireAuthentication: Boolean,
  val requireConfirmation: Boolean
)

internal fun SecureStoreOptions.toAuthenticationPromptOptions(
  requireAuthentication: Boolean = this.requireAuthentication
) = AuthenticationPromptOptions(
  authenticationPrompt = authenticationPrompt,
  requireAuthentication = requireAuthentication,
  requireConfirmation = requireConfirmation
)
