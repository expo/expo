package expo.modules.securestore

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import android.preference.PreferenceManager
import android.security.keystore.KeyPermanentlyInvalidatedException
import android.text.TextUtils
import android.util.Log
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.securestore.encryptors.AESEncrypter
import expo.modules.securestore.encryptors.HybridAESEncrypter
import expo.modules.securestore.encryptors.KeyBasedEncrypter
import expo.modules.securestore.encryptors.LegacySDK20Encrypter
import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import java.security.GeneralSecurityException
import java.security.KeyStore
import java.security.KeyStoreException
import javax.crypto.IllegalBlockSizeException

class SecureStoreModule : Module() {
  private lateinit var mKeyStore: KeyStore
  private val mAESEncrypter = AESEncrypter()

  private lateinit var mHybridAESEncrypter: HybridAESEncrypter
  private lateinit var mAuthenticationHelper: AuthenticationHelper
  private val reactContext: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    // TODO: replace this with TAG or remove TAG
    Name("SecureStoreModuleKotlin")

    AsyncFunction("setValueWithKeyAsync") { value: String?, key: String?, options: SecureStoreOptions, promise: Promise ->
      try {
        setItemImpl(key, value, options, false, promise)
      } catch (e: Exception) {
        Log.e(TAG, "Caught unexpected exception when writing to SecureStore", e)
        throw e
      }
    }

    AsyncFunction("getValueWithKeyAsync") { key: String, options: SecureStoreOptions, promise: Promise ->
      try {
        getItemImpl(key, options, promise)
      } catch (e: Exception) {
        Log.e(TAG, "Caught unexpected exception when reading from SecureStore", e)
        promise.reject(ReadException(e))
      }
    }

    AsyncFunction("deleteValueWithKeyAsync") { key: String, promise: Promise ->
      try {
        deleteItemImpl(key, promise)
      } catch (e: java.lang.Exception) {
        Log.e(TAG, "Caught unexpected exception when deleting from SecureStore", e)
        promise.reject(DeleteException(null, e))
      }
    }

    OnCreate {
      mAuthenticationHelper = AuthenticationHelper(reactContext, appContext.legacyModuleRegistry)
      mHybridAESEncrypter = HybridAESEncrypter(reactContext, mAESEncrypter)

      val keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER)
      keyStore.load(null)
      mKeyStore = keyStore
    }
  }

  private fun getItemImpl(key: String, options: SecureStoreOptions, promise: Promise) {
    // We use a SecureStore-specific shared preferences file, which lets us do things like enumerate
    // its entries or clear all of them

    // We use a SecureStore-specific shared preferences file, which lets us do things like enumerate
    // its entries or clear all of them
    val prefs: SharedPreferences = getSharedPreferences()
    if (prefs.contains(key)) {
      readJSONEncodedItem(key, prefs, options, promise)
    } else {
      readLegacySDK20Item(key, options, promise)
    }
  }

  private fun readJSONEncodedItem(key: String, prefs: SharedPreferences, options: SecureStoreOptions, promise: Promise) {
    val encryptedItemString = prefs.getString(key, null)

    encryptedItemString ?: run {
      promise.reject(SecureStoreJSONException("Couldn't find any stored value under the key: $key", null))
      return@readJSONEncodedItem
    }

    val encryptedItem: JSONObject = try {
      JSONObject(encryptedItemString)
    } catch (e: JSONException) {
      Log.e(TAG, String.format("Could not parse stored value as JSON (key = %s, value = %s)", key, encryptedItemString), e)
      promise.reject(SecureStoreJSONException("Could not parse the encrypted JSON item in SecureStore", e))
      return
    }

    val scheme = encryptedItem.optString(SCHEME_PROPERTY)

    if (scheme.isNullOrEmpty()) {
      Log.e(TAG, String.format("Stored JSON object is missing a scheme (key = %s, value = %s)", key, encryptedItemString))
      promise.reject(DecryptException("Could not find the encryption scheme used for SecureStore item", null))
      return
    }
    try {
      when (scheme) {
        AESEncrypter.NAME -> {
          val secretKeyEntry = getKeyEntry(KeyStore.SecretKeyEntry::class.java, mAESEncrypter, options)
          mAESEncrypter.decryptItem(promise, encryptedItem, secretKeyEntry, options, mAuthenticationHelper.defaultCallback)
        }
        HybridAESEncrypter.NAME -> {
          val privateKeyEntry = getKeyEntry(KeyStore.PrivateKeyEntry::class.java, mHybridAESEncrypter, options)
          mHybridAESEncrypter.decryptItem(promise, encryptedItem, privateKeyEntry, options, mAuthenticationHelper.defaultCallback)
        }
        else -> {
          val message = String.format("The item for key \"%s\" in SecureStore has an unknown encoding scheme (%s)", key, scheme)
          Log.e(TAG, message)
          promise.reject(DecryptException(message, null))
        }
      }
    } catch (e: IOException) {
      Log.w(TAG, e)
      promise.reject(SecureStoreIOException(e))
    } catch (e: GeneralSecurityException) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && e is KeyPermanentlyInvalidatedException) {
        Log.w(TAG, "The requested key has been permanently invalidated. Returning null")
        promise.resolve(null)
        return
      }
      Log.w(TAG, e)
      promise.reject(DecryptException(null, e))
    } catch (e: JSONException) {
      Log.w(TAG, e)
      promise.reject(SecureStoreJSONException("Could not decode the encrypted JSON item in SecureStore", e))
    }
  }

  private fun readLegacySDK20Item(key: String, options: SecureStoreOptions, promise: Promise) {
    val prefs = PreferenceManager.getDefaultSharedPreferences(reactContext)
    val encryptedItem = prefs.getString(key, null)

    // In the SDK20 scheme, we stored null and empty strings directly so we want to decode them the
    // same way, but we also want to return null if we didn't find any value at all; the developer
    // might be retrieving a value for a non-existent key.
    if (TextUtils.isEmpty(encryptedItem)) {
      promise.resolve(null)
      return
    }
    val value: String
    val encrypter = LegacySDK20Encrypter()
    value = try {
      val keyStore: KeyStore = mKeyStore
      val keystoreAlias = encrypter.getKeyStoreAlias(options)
      if (!keyStore.containsAlias(keystoreAlias)) {
        promise.reject(DecryptException("Could not find the keystore entry to decrypt the legacy item in SecureStore", null))
        return
      }
      val keyStoreEntry = keyStore.getEntry(keystoreAlias, null)
      if (keyStoreEntry !is KeyStore.PrivateKeyEntry) {
        promise.reject(DecryptException("The keystore entry for the legacy item is not a private key entry", null))
        return
      }
      encrypter.decryptItem(encryptedItem, keyStoreEntry)
    } catch (e: IOException) {
      Log.w(TAG, e)
      promise.reject(SecureStoreIOException(e))
      return
    } catch (e: GeneralSecurityException) {
      Log.w(TAG, e)
      promise.reject(DecryptException(null, e))
      return
    }
    promise.resolve(value)
  }

  private fun setItemImpl(key: String?, value: String?, options: SecureStoreOptions, keyIsInvalidated: Boolean, promise: Promise) {
    val prefs: SharedPreferences = getSharedPreferences()

    key ?: throw NullKeyException()
    if (value == null) {
      val success = prefs.edit().putString(key, null).commit()
      success.takeIf { it }
        ?: throw WriteException("Could not write a null value to SecureStore", null)
      return
    }

    try {
      val keyStore: KeyStore = mKeyStore

      // Android API 23+ supports storing symmetric keys in the keystore and on older Android
      // versions we store an asymmetric key pair and use hybrid encryption. We store the scheme we
      // use in the encrypted JSON item so that we know how to decode and decrypt it when reading
      // back a value.
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        if (keyIsInvalidated) {
          val alias = mAESEncrypter.getKeyStoreAlias(options)
          keyStore.deleteEntry(alias)
        }

        val secretKeyEntry: KeyStore.SecretKeyEntry = getKeyEntry(KeyStore.SecretKeyEntry::class.java, mAESEncrypter, options)
        mAESEncrypter.createEncryptedItem(promise, value, secretKeyEntry, options, mAuthenticationHelper.defaultCallback) { innerPromise: Promise, result: Any ->
          val obj = result as JSONObject
          obj.put(SCHEME_PROPERTY, AESEncrypter.NAME)
          saveEncryptedItem(innerPromise, obj, prefs, key)
        }
      } else {
        val privateKeyEntry: KeyStore.PrivateKeyEntry = getKeyEntry(KeyStore.PrivateKeyEntry::class.java, mHybridAESEncrypter, options)
        mHybridAESEncrypter.createEncryptedItem(promise, value, privateKeyEntry, options, mAuthenticationHelper.defaultCallback) { innerPromise: Promise, result: Any ->
          val obj = result as JSONObject
          obj.put(SCHEME_PROPERTY, HybridAESEncrypter.NAME)
          saveEncryptedItem(innerPromise, obj, prefs, key)
        }
      }
    } catch (e: IOException) {
      Log.w(TAG, e)
      promise.reject(SecureStoreIOException(e))
    } catch (e: IllegalBlockSizeException) {
      // Sometimes, android throws IllegalBlockSizeException when the fingerprint has been changed.
      // https://github.com/expo/expo/issues/22312. It should be handled the same way as KeyPermanentlyInvalidatedException
      val isInvalidationException = e.cause != null && e.cause?.message != null && e.cause!!.message!!.contains("Key user not authenticated")

      if (isInvalidationException && !keyIsInvalidated) {
        setItemImpl(key, value, options, true, promise)
        Log.w(TAG, "IllegalBlockSizeException, retrying with the key deleted")
        return
      }
      // If the issue persists after deleting the key it is likely not related to invalidation
      promise.reject(EncryptException(null, e))
      Log.w(TAG, e)
    } catch (e: GeneralSecurityException) {
      val isInvalidationException = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && e is KeyPermanentlyInvalidatedException

      if (isInvalidationException && !keyIsInvalidated) {
        // If the key has been invalidated by the OS we try to reinitialize it.
        Log.w(TAG, "Key has been invalidated, retrying with the key deleted")
        setItemImpl(key, value, options, true, promise)
      } else if (isInvalidationException) {
        Log.w(TAG, e)
        // If reinitialization of the key fails, reject the promise
        promise.reject(EncryptException("Encryption Failed. The key has been permanently invalidated and cannot be reinitialized", e))
      } else {
        Log.w(TAG, e)
        promise.reject(EncryptException(null, e))
      }
    } catch (e: JSONException) {
      Log.w(TAG, e)
      promise.reject(SecureStoreJSONException("Could not create an encrypted JSON item for SecureStore", e))
    }
  }

  private fun saveEncryptedItem(promise: Promise, encryptedItem: JSONObject, prefs: SharedPreferences, key: String) {
    val encryptedItemString = encryptedItem.toString()
    if (encryptedItemString.isNullOrEmpty()) { // lint warning suppressed, JSONObject#toString() may return null
      promise.reject(SecureStoreJSONException("Could not JSON-encode the encrypted item for SecureStore", null))
      return
    }

    val success = prefs.edit().putString(key, encryptedItemString).commit()
    if (success) {
      promise.resolve(null)
    } else {
      promise.reject(WriteException("Could not write encrypted JSON to SecureStore", null))
    }
  }

  private fun deleteItemImpl(key: String, promise: Promise) {
    var success = true
    val prefs = getSharedPreferences()

    if (prefs.contains(key)) {
      success = prefs.edit().remove(key).commit()
    }
    val legacyPrefs = PreferenceManager.getDefaultSharedPreferences(reactContext)

    if (legacyPrefs.contains(key)) {
      success = legacyPrefs.edit().remove(key).commit() && success
    }

    if (success) {
      promise.resolve(null)
    } else {
      promise.reject(DeleteException("Could not delete the item from SecureStore", null))
    }
  }

  @Throws(IOException::class, GeneralSecurityException::class)
  private fun <E : KeyStore.Entry> getKeyEntry(keyStoreEntryClass: Class<E>,
                                               encryptor: KeyBasedEncrypter<E>,
                                               options: SecureStoreOptions): E {
    val keyStore = mKeyStore
    val keystoreAlias = encryptor.getKeyStoreAlias(options)
    val keyStoreEntry: E = if (!keyStore.containsAlias(keystoreAlias)) {
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

  private fun getSharedPreferences(): SharedPreferences {
    return reactContext.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE)
  }

  companion object {
    const val TAG = "ExpoSecureStore"
    private const val SHARED_PREFERENCES_NAME = "SecureStore"
    private const val KEYSTORE_PROVIDER = "AndroidKeyStore"
    private const val SCHEME_PROPERTY = "scheme"
  }
}
