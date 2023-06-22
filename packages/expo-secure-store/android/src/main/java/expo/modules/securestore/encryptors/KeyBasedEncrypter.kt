package expo.modules.securestore.encryptors

import expo.modules.kotlin.Promise
import expo.modules.securestore.callbacks.AuthenticationCallback
import expo.modules.securestore.callbacks.PostEncryptionCallback
import expo.modules.securestore.SecureStoreOptions
import org.json.JSONException
import org.json.JSONObject
import java.security.GeneralSecurityException
import java.security.KeyStore

interface KeyBasedEncrypter<E : KeyStore.Entry> {
  fun getKeyStoreAlias(options: SecureStoreOptions): String

  @Throws(GeneralSecurityException::class)
  fun initializeKeyStoreEntry(keyStore: KeyStore, options: SecureStoreOptions): E

  @Throws(GeneralSecurityException::class, JSONException::class)
  fun createEncryptedItem(promise: Promise, plaintextValue: String, keyStoreEntry: E, options: SecureStoreOptions,
                          authenticationCallback: AuthenticationCallback, postEncryptionCallback: PostEncryptionCallback?)

  @Throws(GeneralSecurityException::class, JSONException::class)
  fun decryptItem(promise: Promise, encryptedItem: JSONObject, keyStoreEntry: E, options: SecureStoreOptions, callback: AuthenticationCallback)
}