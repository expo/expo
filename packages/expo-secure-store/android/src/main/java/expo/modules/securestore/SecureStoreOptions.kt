package expo.modules.securestore

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import java.io.Serializable

@OptimizedRecord
class SecureStoreOptions(
  // Prompt can't be an empty string
  @Field var authenticationPrompt: String = " ",
  @Field var keychainService: String = SecureStoreModule.DEFAULT_KEYSTORE_ALIAS,
  @Field var requireAuthentication: AuthenticationMethod = AuthenticationMethod.NONE,
  @Field var requireConfirmation: Boolean = true
) : Record, Serializable

internal data class AuthenticationPromptOptions(
  val authenticationPrompt: String,
  val authenticationMethod: AuthenticationMethod,
  val requireConfirmation: Boolean
)

internal fun SecureStoreOptions.toAuthenticationPromptOptions(
  authenticationMethod: AuthenticationMethod = requireAuthentication
) = AuthenticationPromptOptions(
  authenticationPrompt = authenticationPrompt,
  authenticationMethod = authenticationMethod,
  requireConfirmation = requireConfirmation
)
