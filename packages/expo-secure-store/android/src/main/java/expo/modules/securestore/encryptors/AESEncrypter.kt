package expo.modules.securestore.encryptors

import android.annotation.TargetApi
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import expo.modules.kotlin.Promise
import expo.modules.securestore.callbacks.AuthenticationCallback
import expo.modules.securestore.AuthenticationHelper
import expo.modules.securestore.callbacks.PostEncryptionCallback
import expo.modules.securestore.SecureStoreOptions
import org.json.JSONException
import org.json.JSONObject
import java.nio.charset.StandardCharsets
import java.security.GeneralSecurityException
import java.security.KeyStore
import java.security.UnrecoverableEntryException
import java.security.spec.AlgorithmParameterSpec
import javax.crypto.Cipher
import javax.crypto.IllegalBlockSizeException
import javax.crypto.KeyGenerator
import javax.crypto.spec.GCMParameterSpec

/**
 * An encrypter that stores a symmetric key (AES) in the Android keystore. It generates a new IV
 * each time an item is written to prevent many-time pad attacks. The IV is stored with the
 * encrypted item.
 *
 *
 * AES with GCM is supported on Android 10+ but storing an AES key in the keystore is supported
 * on only Android 23+. If you generate your own key instead of using the Android keystore (like
 * the hybrid encrypter does) you can use the encyption and decryption methods of this class.
 */
class AESEncrypter : KeyBasedEncrypter<KeyStore.SecretKeyEntry> {
  override fun getKeyStoreAlias(options: SecureStoreOptions): String {
    val baseAlias = options.keychainService ?: DEFAULT_ALIAS
    return "$AES_CIPHER:$baseAlias"
  }

  @TargetApi(23)
  @Throws(GeneralSecurityException::class)
  override fun initializeKeyStoreEntry(keyStore: KeyStore, options: SecureStoreOptions): KeyStore.SecretKeyEntry {
    val keystoreAlias = getKeyStoreAlias(options)
    val keyPurposes = KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
    val algorithmSpec: AlgorithmParameterSpec = KeyGenParameterSpec.Builder(keystoreAlias, keyPurposes)
      .setKeySize(AES_KEY_SIZE_BITS)
      .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
      .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
      .setUserAuthenticationRequired(options.requireAuthentication)
      .build()
    val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, keyStore.provider)
    keyGenerator.init(algorithmSpec)

    // KeyGenParameterSpec stores the key when it is generated
    keyGenerator.generateKey()
    return keyStore.getEntry(keystoreAlias, null) as? KeyStore.SecretKeyEntry
      ?: throw UnrecoverableEntryException("Could not retrieve the newly generated secret key entry")
  }

  @Throws(IllegalBlockSizeException::class, GeneralSecurityException::class)
  override fun createEncryptedItem(
    promise: Promise,
    plaintextValue: String,
    keyStoreEntry: KeyStore.SecretKeyEntry,
    options: SecureStoreOptions,
    authenticationCallback: AuthenticationCallback,
    postEncryptionCallback: PostEncryptionCallback?
  ) {
    val secretKey = keyStoreEntry.secretKey
    val cipher = Cipher.getInstance(AES_CIPHER)

    cipher.init(Cipher.ENCRYPT_MODE, secretKey)

    val gcmSpec = cipher.parameters.getParameterSpec(GCMParameterSpec::class.java)
    val encryptionCallback = { _promise: Promise, _cipher: Cipher, _: GCMParameterSpec, _postEncryptionCallback: PostEncryptionCallback? ->
      createEncryptedItem(_promise, plaintextValue, _cipher, gcmSpec, _postEncryptionCallback)
    }

    authenticationCallback.checkAuthentication(promise, cipher, gcmSpec, options, encryptionCallback, postEncryptionCallback)
  }

  /* package */
  @Throws(IllegalBlockSizeException::class, GeneralSecurityException::class, JSONException::class)
  fun createEncryptedItem(
    promise: Promise,
    plaintextValue: String,
    cipher: Cipher,
    gcmSpec: GCMParameterSpec,
    postEncryptionCallback: PostEncryptionCallback?
  ): JSONObject {
    val plaintextBytes = plaintextValue.toByteArray(StandardCharsets.UTF_8)
    val ciphertextBytes = cipher.doFinal(plaintextBytes)
    val ciphertext = Base64.encodeToString(ciphertextBytes, Base64.NO_WRAP)
    val ivString = Base64.encodeToString(gcmSpec.iv, Base64.NO_WRAP)
    val authenticationTagLength = gcmSpec.tLen
    val result = JSONObject()
      .put(CIPHERTEXT_PROPERTY, ciphertext)
      .put(IV_PROPERTY, ivString)
      .put(GCM_AUTHENTICATION_TAG_LENGTH_PROPERTY, authenticationTagLength)
    postEncryptionCallback?.run(promise, result)
    return result
  }

  @Throws(GeneralSecurityException::class, JSONException::class)
  override fun decryptItem(
    promise: Promise,
    encryptedItem: JSONObject,
    keyStoreEntry: KeyStore.SecretKeyEntry,
    options: SecureStoreOptions,
    callback: AuthenticationCallback
  ) {
    val ciphertext = encryptedItem.getString(CIPHERTEXT_PROPERTY)
    val ivString = encryptedItem.getString(IV_PROPERTY)
    val authenticationTagLength = encryptedItem.getInt(GCM_AUTHENTICATION_TAG_LENGTH_PROPERTY)
    val ciphertextBytes = Base64.decode(ciphertext, Base64.DEFAULT)
    val ivBytes = Base64.decode(ivString, Base64.DEFAULT)
    val gcmSpec = GCMParameterSpec(authenticationTagLength, ivBytes)
    val cipher = Cipher.getInstance(AES_CIPHER)
    val requiresAuthentication = encryptedItem.optBoolean(AuthenticationHelper.REQUIRE_AUTHENTICATION_PROPERTY)

    val encryptionCallback = { promise1: Promise, cipher1: Cipher, _: GCMParameterSpec?, _: PostEncryptionCallback? ->
      val result = String(cipher1.doFinal(ciphertextBytes), StandardCharsets.UTF_8)
      promise1.resolve(result)
      result
    }

    cipher.init(Cipher.DECRYPT_MODE, keyStoreEntry.secretKey, gcmSpec)
    callback.checkAuthentication(promise, requiresAuthentication, cipher, gcmSpec, options, encryptionCallback, null)
  }

  companion object {
    const val NAME = "aes"
    private const val DEFAULT_ALIAS = "key_v1"
    const val AES_CIPHER = "AES/GCM/NoPadding"
    const val AES_KEY_SIZE_BITS = 256
    private const val CIPHERTEXT_PROPERTY = "ct"
    const val IV_PROPERTY = "iv"
    private const val GCM_AUTHENTICATION_TAG_LENGTH_PROPERTY = "tlen"
  }
}