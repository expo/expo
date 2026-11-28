package expo.modules.securestore

import io.github.expo.modules.v2.Record
import java.io.Serializable

@Record
class SecureStoreOptions(
  // Prompt can't be an empty string
  var authenticationPrompt: String = " ",
  var keychainService: String = SecureStoreModule.DEFAULT_KEYSTORE_ALIAS,
  var requireAuthentication: AuthenticationMethod = AuthenticationMethod.NONE,
  var requireConfirmation: Boolean = true
) : Serializable

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
