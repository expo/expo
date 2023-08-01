package expo.modules.securestore

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
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
import expo.modules.securestore.encryptors.KeyPurpose
import kotlinx.coroutines.runBlocking
import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import java.security.GeneralSecurityException
import java.security.KeyStore
import java.security.KeyStore.SecretKeyEntry
import java.security.KeyStore.PrivateKeyEntry

class SecureStoreModule : Module() {
  private val mAESEncryptor = AESEncryptor()
  private val reactContext: Context
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

    AsyncFunction("deleteValueWithKeyAsync") { key: String, options: SecureStoreOptions ->
      try {
        deleteItemImpl(key, options)
      } catch (e: CodedException) {
        throw e
      } catch (e: Exception) {
        Log.e(TAG, "Caught unexpected exception when deleting from SecureStore", e)
        throw DeleteException(null, e)
      }
    }

    Function("setValueWithKeySync") { value: String?, key: String?, options: SecureStoreOptions ->
      key ?: throw NullKeyException()
      return@Function runBlocking {
        return@runBlocking setItemImpl(key, value, options, keyIsInvalidated = false, isRunSynchronously = true)
      }
    }

    Function("getValueWithKeySync") { key: String, options: SecureStoreOptions ->
      return@Function runBlocking {
        return@runBlocking getItemImpl(key, options, isRunSynchronously = true)
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

  private suspend fun getItemImpl(key: String, options: SecureStoreOptions, isRunSynchronously: Boolean = false): String? {
    // We use a SecureStore-specific shared preferences file, which lets us do things like enumerate
    // its entries or clear all of them
    val prefs: SharedPreferences = getSharedPreferences()
    val keychainAwareKey = createKeychainAwareKey(key, options.keychainService)
    if (prefs.contains(keychainAwareKey)) {
      return readJSONEncodedItem(key, prefs, options, isRunSynchronously)
    } else if (prefs.contains(key)) { // For backwards-compatibility try to read using the old key format
      return readJSONEncodedItem(key, prefs, options, isRunSynchronously)
    }
    return null
  }

  private suspend fun readJSONEncodedItem(key: String, prefs: SharedPreferences, options: SecureStoreOptions, isRunSynchronously: Boolean): String? {
    val keychainAwareKey = createKeychainAwareKey(key, options.keychainService)
    val encryptedItemString = prefs.getString(keychainAwareKey, null) ?: prefs.getString(key, null)

    encryptedItemString ?: return null

    val encryptedItem: JSONObject = try {
      JSONObject(encryptedItemString)
    } catch (e: JSONException) {
      Log.e(TAG, String.format("Could not parse stored value as JSON (key = %s, value = %s)", key, encryptedItemString), e)
      throw SecureStoreJSONException("Could not parse the encrypted JSON item in SecureStore", e)
    }

    val scheme = encryptedItem.optString(SCHEME_PROPERTY).takeIf { it.isNotEmpty() }
      ?: throw DecryptException("Could not find the encryption scheme used for SecureStore item", null)
    val requireAuthentication = encryptedItem.optBoolean(AUTHENTICATION_PROPERTY, false)
    val usesKeystoreSuffix = encryptedItem.optBoolean(USES_KEYSTORE_SUFFIX_PROPERTY, false)

    if (requireAuthentication && isRunSynchronously) {
      throw DecryptException("Reading values which require authentication is unsupported in synchronous calls. Use `getItemAsync()` instead", null)
    }

    try {
      when (scheme) {
        AESEncryptor.NAME -> {
          val secretKeyEntry = getPreferredKeyEntry(SecretKeyEntry::class.java, mAESEncryptor, options, requireAuthentication, usesKeystoreSuffix)
            ?: throw DecryptException("Could not find a keychain for key $key", null)
          return mAESEncryptor.decryptItem(encryptedItem, secretKeyEntry, options, authenticationHelper)
        }
        AESEncryptor.SYNCHRONOUS_NAME -> {
          val (_, decryptKeyEntry) = getKeyPair(mAESEncryptor, options, requireAuthentication)
          return mAESEncryptor.decryptItem(encryptedItem, decryptKeyEntry, options, authenticationHelper)
        }
        HybridAESEncryptor.NAME -> {
          val privateKeyEntry = getPreferredKeyEntry(PrivateKeyEntry::class.java, hybridAESEncryptor, options, requireAuthentication, usesKeystoreSuffix)
            ?: throw DecryptException("Could not  find a keychain for key $key", null)
          return hybridAESEncryptor.decryptItem(encryptedItem, privateKeyEntry, options, authenticationHelper)
        }
        else -> {
          throw DecryptException("The item for key $key in SecureStore has an unknown encoding scheme $scheme, null)", null)
        }
      }
    } catch (e: IOException) {
      throw SecureStoreIOException(e)
    } catch (e: GeneralSecurityException) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && e is KeyPermanentlyInvalidatedException) {
        Log.w(TAG, "The requested key has been permanently invalidated. Returning null")
        return null
      }
      throw (DecryptException(null, e))
    } catch (e: JSONException) {
      throw SecureStoreJSONException("Could not decode the encrypted JSON item in SecureStore", e)
    } catch (e: CodedException) {
      throw e
    } catch (e: Exception) {
      throw DecryptException("An unexpected exception appeared when trying to decode the JSON item", e)
    }
  }

  private suspend fun setItemImpl(key: String, value: String?, options: SecureStoreOptions, keyIsInvalidated: Boolean, isRunSynchronously: Boolean = false) {
    val keychainAwareKey = createKeychainAwareKey(key, options.keychainService)
    val prefs: SharedPreferences = getSharedPreferences()

    if (value == null) {
      val success = prefs.edit().putString(keychainAwareKey, null).commit()
      if (!success) {
        throw WriteException("Could not write a null value to SecureStore", null)
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
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        if (isRunSynchronously) {
          val (encryptKeyEntry, _) = getKeyPair(mAESEncryptor, options, options.requireAuthentication)
          // In synchronous calls we always encrypt with a key that doesn't require authentication
          val encryptedItem = mAESEncryptor.createEncryptedItem(value, encryptKeyEntry, false, options.authenticationPrompt, authenticationHelper)
          encryptedItem.put(SCHEME_PROPERTY, AESEncryptor.SYNCHRONOUS_NAME)
          saveEncryptedItem(encryptedItem, prefs, keychainAwareKey, options.requireAuthentication, options.keychainService)
        } else {
          val secretKeyEntry: SecretKeyEntry = getKeyEntry(SecretKeyEntry::class.java, mAESEncryptor, options, options.requireAuthentication)
          val encryptedItem = mAESEncryptor.createEncryptedItem(value, secretKeyEntry, options.requireAuthentication, options.authenticationPrompt, authenticationHelper)
          encryptedItem.put(SCHEME_PROPERTY, AESEncryptor.NAME)
          saveEncryptedItem(encryptedItem, prefs, keychainAwareKey, options.requireAuthentication, options.keychainService)
        }
      } else {
        val privateKeyEntry: PrivateKeyEntry = getKeyEntry(PrivateKeyEntry::class.java, hybridAESEncryptor, options, options.requireAuthentication)
        val encryptedItem = hybridAESEncryptor.createEncryptedItem(value, privateKeyEntry, options.requireAuthentication, options.authenticationPrompt, authenticationHelper)
        encryptedItem.put(SCHEME_PROPERTY, HybridAESEncryptor.NAME)
        saveEncryptedItem(encryptedItem, prefs, keychainAwareKey, options.requireAuthentication, options.keychainService)
      }
    } catch (e: IOException) {
      throw SecureStoreIOException(e)
    } catch (e: GeneralSecurityException) {
      val isInvalidationException = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && e is KeyPermanentlyInvalidatedException

      if (isInvalidationException && !keyIsInvalidated) {
        // If the key has been invalidated by the OS we try to reinitialize it in the save retry.
        Log.w(TAG, "Key has been invalidated, retrying with the key deleted")
        setItemImpl(key, value, options, true)
      } else if (isInvalidationException) {
        // If reinitialization of the key fails, reject the promise
        throw EncryptException("Encryption Failed. The key has been permanently invalidated and cannot be reinitialized", e)
      } else {
        throw EncryptException(null, e)
      }
    } catch (e: JSONException) {
      throw SecureStoreJSONException("Could not create an encrypted JSON item for SecureStore", e)
    } catch (e: CodedException) {
      throw e
    } catch (e: Exception) {
      throw WriteException("Caught unexpected exception when writing to SecureStore", e)
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

      if (keychainService == entryKeychainService) {
        sharedPreferences.edit().remove(key).apply()
        Log.w(TAG, "Removing entry: $key due to the encryption key being deleted")
      }
    }
  }

  private fun saveEncryptedItem(encryptedItem: JSONObject, prefs: SharedPreferences, key: String, requireAuthentication: Boolean, keychainService: String): Boolean {
    // We need a way to recognize entries that have been saved after adding suffixes to the keychains
    encryptedItem.put(USES_KEYSTORE_SUFFIX_PROPERTY, true)
    // In order to be able to have the same keys under different keychains
    // we need a way to recognize what is the keychain of the item when we read it
    encryptedItem.put(KEYSTORE_ALIAS_PROPERTY, keychainService)
    encryptedItem.put(AuthenticationHelper.REQUIRE_AUTHENTICATION_PROPERTY, requireAuthentication)

    val encryptedItemString = encryptedItem.toString()
    if (encryptedItemString.isNullOrEmpty()) { // JSONObject#toString() may return null
      throw SecureStoreJSONException("Could not JSON-encode the encrypted item for SecureStore", null)
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
      throw DeleteException("Could not delete the item from SecureStore", null)
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

  private fun getKeyPair(
    encryptor: AESEncryptor,
    options: SecureStoreOptions,
    requireAuthentication: Boolean
  ): Pair<SecretKeyEntry, SecretKeyEntry> {
    val encryptAlias = encryptor.getExtendedKeyStoreAlias(options, requireAuthentication, KeyPurpose.ENCRYPT)
    val decryptAlias = encryptor.getExtendedKeyStoreAlias(options, requireAuthentication, KeyPurpose.DECRYPT)

    return if (!keyStore.containsAlias(decryptAlias)) {
      if (requireAuthentication) {
        authenticationHelper.assertBiometricsSupport()
      }

      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        throw KeyStoreException("Tried accessing SDK23+ key store functionality on Android API < 23")
      }

      encryptor.initializeKeyStorePair(keyStore, options)
    } else {
      val (encryptEntry, decryptEntry) = listOf(encryptAlias, decryptAlias).map { alias ->
        val entry = keyStore.getEntry(alias, null)

        if (!SecretKeyEntry::class.java.isInstance(entry)) {
          throw KeyStoreException("The entry for the keystore alias \"$alias\" is not a ${SecretKeyEntry::class.java.simpleName}")
        }
        SecretKeyEntry::class.java.cast(entry)
          ?: throw KeyStoreException("The entry for the keystore alias \"$alias\" couldn't be cast to correct class")
      }
      Pair(encryptEntry, decryptEntry)
    }
  }

  private fun getSharedPreferences(): SharedPreferences {
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
    private const val AUTHENTICATION_PROPERTY = "requireAuthentication"
    private const val KEYSTORE_ALIAS_PROPERTY = "keystoreAlias"
    const val USES_KEYSTORE_SUFFIX_PROPERTY = "usesKeystoreSuffix"
    const val DEFAULT_KEYSTORE_ALIAS = "key_v1"
    const val AUTHENTICATED_KEYSTORE_SUFFIX = "keystoreAuthenticated"
    const val UNAUTHENTICATED_KEYSTORE_SUFFIX = "keystoreUnauthenticated"
  }
}
