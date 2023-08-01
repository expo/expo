package expo.modules.securestore.encryptors

import android.annotation.TargetApi
import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.security.keystore.KeyProtection
import android.util.Base64
import androidx.annotation.RequiresApi
import expo.modules.securestore.AuthenticationHelper
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
import javax.crypto.SecretKey
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

  fun getExtendedKeyStoreAlias(options: SecureStoreOptions, requireAuthentication: Boolean, purpose: KeyPurpose): String {
    return "$purpose:${getExtendedKeyStoreAlias(options, requireAuthentication)}"
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

  /**
   * Function used for creating key store entries when user uses a synchronous version of `setItem`
   * function. This is necessary for saving encrypted values, which require authentication without asking for
   * biometrics on save. Instead of storing a single key entry used for both decryption and encryption
   * (which requires authentication on both encryption and decryption if authentication is enabled)
   * we generate a key pair where only the decryption key requires authentication.
   * */
  @RequiresApi(Build.VERSION_CODES.M)
  fun initializeKeyStorePair(keyStore: KeyStore, options: SecureStoreOptions): Pair<KeyStore.SecretKeyEntry, KeyStore.SecretKeyEntry> {

    val keyGen = KeyGenerator.getInstance("AES")
    val secretKey = keyGen.generateKey()
    val encryptAlias = getExtendedKeyStoreAlias(options, options.requireAuthentication, KeyPurpose.ENCRYPT)
    val decryptAlias = getExtendedKeyStoreAlias(options, options.requireAuthentication, KeyPurpose.DECRYPT)

    keyStore.setEntry(
      encryptAlias,
      KeyStore.SecretKeyEntry(secretKey),
      KeyProtection.Builder(KeyProperties.PURPOSE_ENCRYPT)
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .build()
    )

    keyStore.setEntry(
      decryptAlias,
      KeyStore.SecretKeyEntry(secretKey),
      KeyProtection.Builder(KeyProperties.PURPOSE_DECRYPT)
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .setUserAuthenticationRequired(options.requireAuthentication)
        .build()
    )

    val encryptEntry = keyStore.getEntry(encryptAlias, null) as? KeyStore.SecretKeyEntry
      ?: throw UnrecoverableEntryException("Could not retrieve the newly generated encryption secret key entry")

    val decryptEntry = keyStore.getEntry(decryptAlias, null) as? KeyStore.SecretKeyEntry
      ?: throw UnrecoverableEntryException("Could not retrieve the newly generated decryption secret key entry")

    return encryptEntry to decryptEntry
  }

  @Throws(IllegalBlockSizeException::class, GeneralSecurityException::class)
  override suspend fun createEncryptedItem(
    plaintextValue: String,
    keyStoreEntry: KeyStore.SecretKeyEntry,
    requireAuthentication: Boolean,
    authenticationPrompt: String,
    authenticationHelper: AuthenticationHelper,
  ): JSONObject {
    val secretKey = keyStoreEntry.secretKey
    val (cipher, gcmSpec) = getCipherAndGCMSpec(secretKey)
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

    cipher.init(Cipher.DECRYPT_MODE, keyStoreEntry.secretKey, gcmSpec)
    val unlockedCipher = authenticationHelper.authenticateCipher(cipher, requiresAuthentication, options.authenticationPrompt)
    return String(unlockedCipher.doFinal(ciphertextBytes), StandardCharsets.UTF_8)
  }

  private fun getCipherAndGCMSpec(secretKey: SecretKey): Pair<Cipher, GCMParameterSpec> {
    val cipher = Cipher.getInstance(AES_CIPHER)
    cipher.init(Cipher.ENCRYPT_MODE, secretKey)

    val gcmSpec = cipher.parameters.getParameterSpec(GCMParameterSpec::class.java)
    return Pair(cipher, gcmSpec)
  }

  companion object {
    const val NAME = "aes"
    const val SYNCHRONOUS_NAME = "aes_synchronous"
    const val AES_CIPHER = "AES/GCM/NoPadding"
    const val AES_KEY_SIZE_BITS = 256
    private const val CIPHERTEXT_PROPERTY = "ct"
    const val IV_PROPERTY = "iv"
    private const val GCM_AUTHENTICATION_TAG_LENGTH_PROPERTY = "tlen"
  }
}
