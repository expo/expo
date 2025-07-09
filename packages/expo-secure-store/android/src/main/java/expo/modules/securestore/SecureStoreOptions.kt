package expo.modules.securestore

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class SecureStoreOptions(
  // Prompt can't be an empty string
  @Field var authenticationPrompt: String = " ",
  @Field var keychainService: String = SecureStoreModule.DEFAULT_KEYSTORE_ALIAS,
  @Field var requireAuthentication: Boolean = false
) : Record, Serializable
