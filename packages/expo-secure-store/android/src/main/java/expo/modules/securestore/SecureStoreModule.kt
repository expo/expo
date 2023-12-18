package expo.modules.securestore

import android.content.Context
import android.content.SharedPreferences
import android.preference.PreferenceManager
import android.security.keystore.KeyPermanentlyInvalidatedException
import android.util.Log
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.securestore.encryptors.AESEncryptor
import expo.modules.securestore.encryptors.HybridAESEncryptor
import expo.modules.securestore.encryptors.KeyBasedEncryptor
import kotlinx.coroutines.runBlocking
import org.json.JSONException
import org.json.JSONObject
import java.security.GeneralSecurityException
import java.security.KeyStore
import java.security.KeyStore.PrivateKeyEntry
import java.security.KeyStore.SecretKeyEntry
import javax.crypto.BadPaddingException

open class SecureStoreModule : Module() {
  private val mAESEncryptor = AESEncryptor()
  open val reactContext: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private lateinit var keyStore: KeyStore
  private lateinit var hybridAESEncryptor: HybridAESEncryptor
  private lateinit var authenticationHelper: AuthenticationHelper

  override fun definition() = ModuleDefinition {
    Name("ExpoSecureStore")

    AsyncFunction("setValueWithKeyAsync") Coroutine { value: String?, key: String?, options: SecureStoreOptions ->
      key ?: throw NullKeyException()
      return@Coroutine setItemImpl(key, value, options, false)
    }

    AsyncFunction("getValueWithKeyAsync") Coroutine { key: String, options: SecureStoreOptions ->
      return@Coroutine getItemImpl(key, options)
    }

    Function("setValueWithKeySync") { value: String?, key: String?, options: SecureStoreOptions ->
      key ?: throw NullKeyException()
      return@Function runBlocking {
        return@runBlocking setItemImpl(key, value, options, keyIsInvalidated = false)
      }
    }

    Function("getValueWithKeySync") { key: String, options: SecureStoreOptions ->
      return@Function runBlocking {
        return@runBlocking getItemImpl(key, options)
      }
    }

    AsyncFunction("deleteValueWithKeyAsync") { key: String, options: SecureStoreOptions ->
      try {
        deleteItemImpl(key, options)
      } catch (e: CodedException) {
        throw e
      } catch (e: Exception) {
        throw DeleteException(e.message, key, options.keychainService, e)
      }
    }

    OnCreate {
      authenticationHelper = AuthenticationHelper(reactContext, appContext.legacyModuleRegistry)
      hybridAESEncryptor = HybridAESEncryptor(reactContext, mAESEncryptor)

      val keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER)
      keyStore.load(null)
      this@SecureStoreModule.keyStore = keyStore
    }
  }

  private suspend fun getItemImpl(key: String, options: SecureStoreOptions): String? {
    // We use a SecureStore-specific shared preferences file, which lets us do things like enumerate
    // its entries or clear all of them
    val prefs: SharedPreferences = getSharedPreferences()
    val keychainAwareKey = createKeychainAwareKey(key, options.keychainService)
    if (prefs.contains(keychainAwareKey)) {
      return readJSONEncodedItem(key, prefs, options)
    } else if (prefs.contains(key)) { // For backwards-compatibility try to read using the old key format
      return readJSONEncodedItem(key, prefs, options)
    }
    return null
  }

  private suspend fun readJSONEncodedItem(key: String, prefs: SharedPreferences, options: SecureStoreOptions): String? {
    val keychainAwareKey = createKeychainAwareKey(key, options.keychainService)

    val legacyEncryptedItemString = prefs.getString(key, null)
    val currentEncryptedItemString = prefs.getString(keychainAwareKey, null)
    val encryptedItemString = currentEncryptedItemString ?: legacyEncryptedItemString

    // It's not possible to efficiently remove all values from older versions of secure-store when an invalidated keychain is deleted.
    // In some edge cases it will lead to read errors until the value is removed from the shared preferences
    val legacyReadFailedWarning = if (currentEncryptedItemString == null) {
      ". This exception occurred when trying to read a value saved with an " +
        "older version of `expo-secure-store`. It usually means that the keychain you provided is incorrect, " +
        "but it might be raised because the keychain used to decrypt this key has been invalidated and deleted." +
        " If you are confident that the keychain you provided is correct and want to avoid this error in the " +
        "future you should save a new value under this key or use `deleteItemImpl()` and remove the existing one."
    } else {
      ""
    }

    encryptedItemString ?: return null

    val encryptedItem: JSONObject = try {
      JSONObject(encryptedItemString)
    } catch (e: JSONException) {
      throw DecryptException("Could not parse the encrypted JSON item in SecureStore: ${e.message}", key, options.keychainService, e)
    }

    val scheme = encryptedItem.optString(SCHEME_PROPERTY).takeIf { it.isNotEmpty() }
      ?: throw DecryptException("Could not find the encryption scheme used for key: $key", key, options.keychainService)
    val requireAuthentication = encryptedItem.optBoolean(AuthenticationHelper.REQUIRE_AUTHENTICATION_PROPERTY, false)
    val usesKeystoreSuffix = encryptedItem.optBoolean(USES_KEYSTORE_SUFFIX_PROPERTY, false)

    try {
      when (scheme) {
        AESEncryptor.NAME -> {
          val secretKeyEntry = getPreferredKeyEntry(SecretKeyEntry::class.java, mAESEncryptor, options, requireAuthentication, usesKeystoreSuffix)
            ?: throw DecryptException("Could not find a keychain for key $key$legacyReadFailedWarning", key, options.keychainService)
          return mAESEncryptor.decryptItem(key, encryptedItem, secretKeyEntry, options, authenticationHelper)
        }
        HybridAESEncryptor.NAME -> {
          val privateKeyEntry = getPreferredKeyEntry(PrivateKeyEntry::class.java, hybridAESEncryptor, options, requireAuthentication, usesKeystoreSuffix)
            ?: throw DecryptException("Could not find a keychain for key $key$legacyReadFailedWarning", key, options.keychainService)
          return hybridAESEncryptor.decryptItem(key, encryptedItem, privateKeyEntry, options, authenticationHelper)
        }
        else -> {
          throw DecryptException("The item for key $key in SecureStore has an unknown encoding scheme $scheme)", key, options.keychainService)
        }
      }
    } catch (e: KeyPermanentlyInvalidatedException) {
      Log.w(TAG, "The requested key has been permanently invalidated. Returning null")
      return null
    } catch (e: BadPaddingException) {
      throw (DecryptException("Could not decrypt the value with provided keychain $legacyReadFailedWarning", key, options.keychainService, e))
    } catch (e: GeneralSecurityException) {
      throw (DecryptException(e.message, key, options.keychainService, e))
    } catch (e: CodedException) {
      throw e
    } catch (e: Exception) {
      throw (DecryptException(e.message, key, options.keychainService, e))
    }
  }

  private suspend fun setItemImpl(key: String, value: String?, options: SecureStoreOptions, keyIsInvalidated: Boolean) {
    val keychainAwareKey = createKeychainAwareKey(key, options.keychainService)
    val prefs: SharedPreferences = getSharedPreferences()

    if (value == null) {
      val success = prefs.edit().putString(keychainAwareKey, null).commit()
      if (!success) {
        throw WriteException("Could not write a null value to SecureStore", key, options.keychainService)
      }
      return
    }

    try {
      if (keyIsInvalidated) {
        // Invalidated keys will block writing even though it's not possible to re-validate them
        // so we remove them before saving.
        val alias = mAESEncryptor.getExtendedKeyStoreAlias(options, options.requireAuthentication)
        removeKeyFromKeystore(alias, options.keychainService)
      }

      /* Android API 23+ supports storing symmetric keys in the keystore and on older Android
       versions we store an asymmetric key pair and use hybrid encryption. We store the scheme we
       use in the encrypted JSON item so that we know how to decode and decrypt it when reading
       back a value.
       */
      val secretKeyEntry: SecretKeyEntry = getKeyEntry(SecretKeyEntry::class.java, mAESEncryptor, options, options.requireAuthentication)
      val encryptedItem = mAESEncryptor.createEncryptedItem(value, secretKeyEntry, options.requireAuthentication, options.authenticationPrompt, authenticationHelper)
      encryptedItem.put(SCHEME_PROPERTY, AESEncryptor.NAME)
      saveEncryptedItem(encryptedItem, prefs, keychainAwareKey, options.requireAuthentication, options.keychainService)

      // If a legacy value exists under this key we remove it to avoid unexpected errors in the future
      if (prefs.contains(key)) {
        prefs.edit().remove(key).apply()
      }
    } catch (e: KeyPermanentlyInvalidatedException) {
      if (!keyIsInvalidated) {
        Log.w(TAG, "Key has been invalidated, retrying with the key deleted")
        return setItemImpl(key, value, options, true)
      }
      throw EncryptException("Encryption Failed. The key $key has been permanently invalidated and cannot be reinitialized", key, options.keychainService, e)
    } catch (e: GeneralSecurityException) {
      throw EncryptException(e.message, key, options.keychainService, e)
    } catch (e: CodedException) {
      throw e
    } catch (e: Exception) {
      throw WriteException(e.message, key, options.keychainService, e)
    }
  }

  private fun saveEncryptedItem(encryptedItem: JSONObject, prefs: SharedPreferences, key: String, requireAuthentication: Boolean, keychainService: String): Boolean {
    // We need a way to recognize entries that have been saved under an alias created with getExtendedKeychain
    encryptedItem.put(USES_KEYSTORE_SUFFIX_PROPERTY, true)
    // In order to be able to have the same keys under different keychains
    // we need a way to recognize what is the keychain of the item when we read it
    encryptedItem.put(KEYSTORE_ALIAS_PROPERTY, keychainService)
    encryptedItem.put(AuthenticationHelper.REQUIRE_AUTHENTICATION_PROPERTY, requireAuthentication)

    val encryptedItemString = encryptedItem.toString()
    if (encryptedItemString.isNullOrEmpty()) { // JSONObject#toString() may return null
      throw WriteException("Could not JSON-encode the encrypted item for SecureStore - the string $encryptedItemString is null or empty", key, keychainService)
    }

    return prefs.edit().putString(key, encryptedItemString).commit()
  }

  private fun deleteItemImpl(key: String, options: SecureStoreOptions) {
    var success = true
    val prefs = getSharedPreferences()
    val keychainAwareKey = createKeychainAwareKey(key, options.keychainService)
    val legacyPrefs = PreferenceManager.getDefaultSharedPreferences(reactContext)

    if (prefs.contains(keychainAwareKey)) {
      success = prefs.edit().remove(keychainAwareKey).commit()
    }

    if (prefs.contains(key)) {
      success = prefs.edit().remove(key).commit() && success
    }

    if (legacyPrefs.contains(key)) {
      success = legacyPrefs.edit().remove(key).commit() && success
    }

    if (!success) {
      throw DeleteException("Could not delete the item from SecureStore", key, options.keychainService)
    }
  }

  private fun removeKeyFromKeystore(keyStoreAlias: String, keychainService: String) {
    val sharedPreferences = getSharedPreferences()
    val allEntries: Map<String, *> = sharedPreferences.all

    keyStore.deleteEntry(keyStoreAlias)

    // In order to avoid decryption failures we need to remove all entries that are using the deleted encryption key
    for ((key: String, value) in allEntries) {
      val valueString = value as? String ?: continue
      val jsonEntry = try {
        JSONObject(valueString)
      } catch (e: JSONException) {
        continue
      }

      val entryKeychainService = jsonEntry.optString(KEYSTORE_ALIAS_PROPERTY) ?: continue
      val requireAuthentication = jsonEntry.optBoolean(AuthenticationHelper.REQUIRE_AUTHENTICATION_PROPERTY, false)

      // Entries which don't require authentication use separate keychains which can't be invalidated,
      // so we shouldn't delete them.
      if (requireAuthentication && keychainService == entryKeychainService) {
        sharedPreferences.edit().remove(key).apply()
        Log.w(TAG, "Removing entry: $key due to the encryption key being deleted")
      }
    }
  }

  /**
   * Each key is stored under a keychain service that requires authentication, or one that doesn't
   * Keys used to be stored under a single keychain, which led to different behaviour on iOS and Android.
   * Because of that we need to check if there are any keys stored with the old secure-store key format.
   */
  private fun <E : KeyStore.Entry> getLegacyKeyEntry(
    keyStoreEntryClass: Class<E>,
    encryptor: KeyBasedEncryptor<E>,
    options: SecureStoreOptions
  ): E? {
    val keystoreAlias = encryptor.getKeyStoreAlias(options)
    if (!keyStore.containsAlias(encryptor.getKeyStoreAlias(options))) {
      return null
    }

    val entry = keyStore.getEntry(keystoreAlias, null)
    if (!keyStoreEntryClass.isInstance(entry)) {
      return null
    }
    return keyStoreEntryClass.cast(entry)
  }

  private fun <E : KeyStore.Entry> getKeyEntry(
    keyStoreEntryClass: Class<E>,
    encryptor: KeyBasedEncryptor<E>,
    options: SecureStoreOptions,
    requireAuthentication: Boolean
  ): E {
    val keystoreAlias = encryptor.getExtendedKeyStoreAlias(options, requireAuthentication)
    val keyStoreEntry = if (!keyStore.containsAlias(keystoreAlias)) {
      // Android won't allow us to generate the keys if the device doesn't support biometrics or no biometrics are enrolled
      if (requireAuthentication) {
        authenticationHelper.assertBiometricsSupport()
      }
      encryptor.initializeKeyStoreEntry(keyStore, options)
    } else {
      val entry = keyStore.getEntry(keystoreAlias, null)
      if (!keyStoreEntryClass.isInstance(entry)) {
        throw KeyStoreException("The entry for the keystore alias \"$keystoreAlias\" is not a ${keyStoreEntryClass.simpleName}")
      }
      keyStoreEntryClass.cast(entry)
        ?: throw KeyStoreException("The entry for the keystore alias \"$keystoreAlias\" couldn't be cast to correct class")
    }
    return keyStoreEntry
  }

  private fun <E : KeyStore.Entry> getPreferredKeyEntry(
    keyStoreEntryClass: Class<E>,
    encryptor: KeyBasedEncryptor<E>,
    options: SecureStoreOptions,
    requireAuthentication: Boolean,
    usesKeystoreSuffix: Boolean
  ): E? {
    return if (usesKeystoreSuffix) {
      getKeyEntry(keyStoreEntryClass, encryptor, options, requireAuthentication)
    } else {
      getLegacyKeyEntry(keyStoreEntryClass, encryptor, options)
    }
  }

  fun getSharedPreferences(): SharedPreferences {
    return reactContext.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE)
  }

  /**
   * Adds the keychain service as a prefix to the key in order to avoid conflicts in shared preferences
   * when there are two identical keys but saved with different keychains.
   */
  private fun createKeychainAwareKey(key: String, keychainService: String): String {
    return "$keychainService-$key"
  }

  companion object {
    const val TAG = "ExpoSecureStore"
    private const val SHARED_PREFERENCES_NAME = "SecureStore"
    private const val KEYSTORE_PROVIDER = "AndroidKeyStore"
    private const val SCHEME_PROPERTY = "scheme"
    private const val KEYSTORE_ALIAS_PROPERTY = "keystoreAlias"
    const val USES_KEYSTORE_SUFFIX_PROPERTY = "usesKeystoreSuffix"
    const val DEFAULT_KEYSTORE_ALIAS = "key_v1"
    const val AUTHENTICATED_KEYSTORE_SUFFIX = "keystoreAuthenticated"
    const val UNAUTHENTICATED_KEYSTORE_SUFFIX = "keystoreUnauthenticated"
  }
}
