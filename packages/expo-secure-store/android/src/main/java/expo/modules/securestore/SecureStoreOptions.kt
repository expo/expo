package expo.modules.securestore

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class SecureStoreOptions(
  // Prompt cannot be empty
  @Field var authenticationPrompt: String = " ",
  @Field var keychainService: String? = null,
  @Field var requireAuthentication: Boolean = false
) : Record, Serializable
