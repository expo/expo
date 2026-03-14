package expo.modules.securestore

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class SecureStoreOptions(
  // Prompt can't be an empty string
  @Field var authenticationPrompt: String = " ",
  @Field var keychainService: String = SecureStoreModule.DEFAULT_KEYSTORE_ALIAS,
  @Field var requireAuthentication: String? = null
) : Record, Serializable {
  val isAuthenticationRequired: Boolean
    get() = requireAuthentication != null

  val isUserPresenceRequired: Boolean
    get() = requireAuthentication == "userPresence"
}
