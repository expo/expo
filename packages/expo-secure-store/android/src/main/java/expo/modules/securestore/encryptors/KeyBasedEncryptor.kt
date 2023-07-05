package expo.modules.securestore.encryptors

import expo.modules.securestore.AuthenticationHelper
import expo.modules.securestore.SecureStoreOptions
import org.json.JSONException
import org.json.JSONObject
import java.security.GeneralSecurityException
import java.security.KeyStore

interface KeyBasedEncryptor<E : KeyStore.Entry> {
  fun getExtendedKeyStoreAlias(options: SecureStoreOptions, requireAuthentication: Boolean): String

  fun getKeyStoreAlias(options: SecureStoreOptions): String

  @Throws(GeneralSecurityException::class)
  fun initializeKeyStoreEntry(keyStore: KeyStore, options: SecureStoreOptions): E

  @Throws(GeneralSecurityException::class, JSONException::class)
  suspend fun createEncryptedItem(
    plaintextValue: String,
    keyStoreEntry: E,
    options: SecureStoreOptions,
    authenticationHelper: AuthenticationHelper,
  ): JSONObject

  @Throws(GeneralSecurityException::class, JSONException::class)
  suspend fun decryptItem(
    encryptedItem: JSONObject,
    keyStoreEntry: E,
    options: SecureStoreOptions,
    authenticationHelper: AuthenticationHelper
  ): String
}
