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
  @Field var requireAuthentication: String? = null
) : Record, Serializable {
  val authenticationRequirement: String?
    get() = normalizeAuthenticationRequirement(requireAuthentication)

  val isAuthenticationRequired: Boolean
    get() = authenticationRequirement != null

  val isDeviceCredentialsRequired: Boolean
    get() = authenticationRequirement == AUTHENTICATION_METHOD_DEVICE_CREDENTIALS
}
