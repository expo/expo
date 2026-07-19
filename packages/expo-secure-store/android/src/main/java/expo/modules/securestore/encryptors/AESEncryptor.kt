package expo.modules.securestore.encryptors

import android.annotation.TargetApi
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import expo.modules.securestore.AuthenticationHelper
import expo.modules.securestore.DecryptException
import expo.modules.securestore.SecureStoreModule
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
 * An encryptor that stores a symmetric key (AES) in the Android keystore. It generates a new IV
 * each time an item is written to prevent many-time pad attacks. The IV is stored with the
 * encrypted item.
 *
 *
 * AES with GCM is supported on Android 10+ but storing an AES key in the keystore is supported
 * on only Android 23+. If you generate your own key instead of using the Android keystore (like
 * the hybrid encryptor does) you can use the encryption and decryption methods of this class.
 */
class AESEncryptor : KeyBasedEncryptor<KeyStore.SecretKeyEntry> {
  override fun getKeyStoreAlias(options: SecureStoreOptions): String {
    val baseAlias = options.keychainService
    return "$AES_CIPHER:$baseAlias"
  }

  /**
   * Two key store entries exist for every `keychainService` passed from the JS side. This is
   * because it's not possible to store unauthenticated data in authenticated key stores.
   */
  override fun getExtendedKeyStoreAlias(options: SecureStoreOptions, requireAuthentication: Boolean): String {
    // We aren't using requiresAuthentication from the options, because it's not a necessary option for read requests
    val suffix = if (requireAuthentication) {
      SecureStoreModule.AUTHENTICATED_KEYSTORE_SUFFIX
    } else {
      SecureStoreModule.UNAUTHENTICATED_KEYSTORE_SUFFIX
    }
    return "${getKeyStoreAlias(options)}:$suffix"
  }

  @TargetApi(23)
  @Throws(GeneralSecurityException::class)
  override fun initializeKeyStoreEntry(keyStore: KeyStore, options: SecureStoreOptions): KeyStore.SecretKeyEntry {
    val extendedKeystoreAlias = getExtendedKeyStoreAlias(options, options.requireAuthentication)
    val keyPurposes = KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT

    val algorithmSpec: AlgorithmParameterSpec = KeyGenParameterSpec.Builder(extendedKeystoreAlias, keyPurposes)
      .setKeySize(AES_KEY_SIZE_BITS)
      .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
      .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
      .setUserAuthenticationRequired(options.requireAuthentication)
      .build()

    val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, keyStore.provider)
    keyGenerator.init(algorithmSpec)

    // KeyGenParameterSpec stores the key when it is generated
    keyGenerator.generateKey()
    return keyStore.getEntry(extendedKeystoreAlias, null) as? KeyStore.SecretKeyEntry
      ?: throw UnrecoverableEntryException("Could not retrieve the newly generated secret key entry")
  }

  @Throws(IllegalBlockSizeException::class, GeneralSecurityException::class)
  override suspend fun createEncryptedItem(
    plaintextValue: String,
    keyStoreEntry: KeyStore.SecretKeyEntry,
    requireAuthentication: Boolean,
    authenticationPrompt: String,
    authenticationHelper: AuthenticationHelper
  ): JSONObject {
    val secretKey = keyStoreEntry.secretKey
    val cipher = Cipher.getInstance(AES_CIPHER)
    cipher.init(Cipher.ENCRYPT_MODE, secretKey)

    val gcmSpec = cipher.parameters.getParameterSpec(GCMParameterSpec::class.java)
    val authenticatedCipher = authenticationHelper.authenticateCipher(cipher, requireAuthentication, authenticationPrompt)

    return createEncryptedItemWithCipher(plaintextValue, authenticatedCipher, gcmSpec)
  }

  internal fun createEncryptedItemWithCipher(
    plaintextValue: String,
    cipher: Cipher,
    gcmSpec: GCMParameterSpec
  ): JSONObject {
    val plaintextBytes = plaintextValue.toByteArray(StandardCharsets.UTF_8)
    val ciphertextBytes = cipher.doFinal(plaintextBytes)
    val ciphertext = Base64.encodeToString(ciphertextBytes, Base64.NO_WRAP)
    val ivString = Base64.encodeToString(gcmSpec.iv, Base64.NO_WRAP)
    val authenticationTagLength = gcmSpec.tLen

    return JSONObject()
      .put(CIPHERTEXT_PROPERTY, ciphertext)
      .put(IV_PROPERTY, ivString)
      .put(GCM_AUTHENTICATION_TAG_LENGTH_PROPERTY, authenticationTagLength)
  }

  @Throws(GeneralSecurityException::class, JSONException::class)
  override suspend fun decryptItem(
    key: String,
    encryptedItem: JSONObject,
    keyStoreEntry: KeyStore.SecretKeyEntry,
    options: SecureStoreOptions,
    authenticationHelper: AuthenticationHelper
  ): String {
    val ciphertext = encryptedItem.getString(CIPHERTEXT_PROPERTY)
    val ivString = encryptedItem.getString(IV_PROPERTY)
    val authenticationTagLength = encryptedItem.getInt(GCM_AUTHENTICATION_TAG_LENGTH_PROPERTY)
    val ciphertextBytes = Base64.decode(ciphertext, Base64.DEFAULT)
    val ivBytes = Base64.decode(ivString, Base64.DEFAULT)
    val gcmSpec = GCMParameterSpec(authenticationTagLength, ivBytes)
    val cipher = Cipher.getInstance(AES_CIPHER)
    val requiresAuthentication = encryptedItem.optBoolean(AuthenticationHelper.REQUIRE_AUTHENTICATION_PROPERTY)

    if (authenticationTagLength < MIN_GCM_AUTHENTICATION_TAG_LENGTH) {
      throw DecryptException("Authentication tag length must be at least $MIN_GCM_AUTHENTICATION_TAG_LENGTH bits long", key, options.keychainService)
    }
    cipher.init(Cipher.DECRYPT_MODE, keyStoreEntry.secretKey, gcmSpec)
    val unlockedCipher = authenticationHelper.authenticateCipher(cipher, requiresAuthentication, options.authenticationPrompt)
    return String(unlockedCipher.doFinal(ciphertextBytes), StandardCharsets.UTF_8)
  }

  companion object {
    const val NAME = "aes"
    const val AES_CIPHER = "AES/GCM/NoPadding"
    const val AES_KEY_SIZE_BITS = 256
    private const val CIPHERTEXT_PROPERTY = "ct"
    const val IV_PROPERTY = "iv"
    private const val GCM_AUTHENTICATION_TAG_LENGTH_PROPERTY = "tlen"
    private const val MIN_GCM_AUTHENTICATION_TAG_LENGTH = 96
  }
}
