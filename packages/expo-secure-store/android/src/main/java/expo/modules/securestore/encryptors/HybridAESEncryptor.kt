package expo.modules.securestore.encryptors

import android.annotation.SuppressLint
import android.content.Context
import android.security.keystore.KeyProperties
import android.util.Base64
import expo.modules.securestore.AuthenticationHelper
import expo.modules.securestore.EncryptException
import expo.modules.securestore.KeyStoreException
import expo.modules.securestore.SecureStoreModule
import expo.modules.securestore.SecureStoreOptions
import org.json.JSONException
import org.json.JSONObject
import java.security.GeneralSecurityException
import java.security.KeyStore
import java.security.NoSuchAlgorithmException
import java.security.NoSuchProviderException
import java.security.SecureRandom
import java.util.*
import javax.crypto.Cipher
import javax.crypto.NoSuchPaddingException
import javax.crypto.SecretKey
import javax.crypto.spec.SecretKeySpec

/**
 * An AES encryptor that works with Android L (API 22) and below, which cannot store symmetric
 * keys in the keystore. We store an asymmetric key pair (RSA) in the keystore, which is used to
 * securely encrypt a symmetric key (AES) that we use to encrypt the data.
 *
 *
 * The item we store includes the ciphertext (encrypted with AES), the AES IV, and the encrypted
 * symmetric key (which requires the keystore's asymmetric private key to decrypt).
 *
 *
 * https://crypto.stackexchange.com/questions/14/how-can-i-use-asymmetric-encryption-such-as-rsa-to-encrypt-an-arbitrary-length
 *
 *
 * When we drop support for Android API 22, we can remove the write paths but need to keep the
 * read paths for phones that still have hybrid-encrypted values on disk.
 */
class HybridAESEncryptor(private var mContext: Context, private val mAESEncryptor: AESEncryptor) : KeyBasedEncryptor<KeyStore.PrivateKeyEntry> {
  private val mSecureRandom: SecureRandom = SecureRandom()
  override fun getExtendedKeyStoreAlias(options: SecureStoreOptions, requireAuthentication: Boolean): String {
    val suffix = if (requireAuthentication) {
      SecureStoreModule.AUTHENTICATED_KEYSTORE_SUFFIX
    } else {
      SecureStoreModule.UNAUTHENTICATED_KEYSTORE_SUFFIX
    }
    return "${getKeyStoreAlias(options)}:$suffix"
  }

  override fun getKeyStoreAlias(options: SecureStoreOptions): String {
    val baseAlias = options.keychainService
    return "$RSA_CIPHER:$baseAlias"
  }

  @Throws(GeneralSecurityException::class)
  override fun initializeKeyStoreEntry(keyStore: KeyStore, options: SecureStoreOptions): KeyStore.PrivateKeyEntry {
    // This should never be called after we dropped Android SDK 22 support.
    throw KeyStoreException(
      "Tried to initialize HybridAESEncryptor key store entry on Android SDK >= 23. This shouldn't happen. " +
        "If you see this message report an issue at https://github.com/expo/expo."
    )
  }

  @Throws(GeneralSecurityException::class, JSONException::class)
  override suspend fun createEncryptedItem(
    plaintextValue: String,
    keyStoreEntry: KeyStore.PrivateKeyEntry,
    requireAuthentication: Boolean,
    authenticationPrompt: String,
    authenticationHelper: AuthenticationHelper
  ): JSONObject {
    // This should never be called after we dropped Android SDK 22 support.
    throw EncryptException(
      "HybridAESEncryption should not be used on Android SDK >= 23. This shouldn't happen. " +
        "If you see this message report an issue at https://github.com/expo/expo.",
      "unknown",
      "unknown"
    )
  }

  @Throws(GeneralSecurityException::class, JSONException::class)
  override suspend fun decryptItem(
    key: String,
    encryptedItem: JSONObject,
    keyStoreEntry: KeyStore.PrivateKeyEntry,
    options: SecureStoreOptions,
    authenticationHelper: AuthenticationHelper
  ): String {
    // Decrypt the encrypted symmetric key
    val encryptedSecretKeyString = encryptedItem.getString(ENCRYPTED_SECRET_KEY_PROPERTY)
    val encryptedSecretKeyBytes = Base64.decode(encryptedSecretKeyString, Base64.DEFAULT)
    val cipher = rSACipher
    cipher.init(Cipher.DECRYPT_MODE, keyStoreEntry.privateKey)
    val secretKeyBytes = cipher.doFinal(encryptedSecretKeyBytes)
    // constant value will be copied

    @SuppressLint("InlinedApi")
    val secretKey: SecretKey = SecretKeySpec(secretKeyBytes, KeyProperties.KEY_ALGORITHM_AES)

    // Decrypt the value with the symmetric key
    val secretKeyEntry = KeyStore.SecretKeyEntry(secretKey)
    return mAESEncryptor.decryptItem(key, encryptedItem, secretKeyEntry, options, authenticationHelper)
  }

  @get:Throws(NoSuchAlgorithmException::class, NoSuchProviderException::class, NoSuchPaddingException::class)
  private val rSACipher: Cipher
    get() = Cipher.getInstance(RSA_CIPHER)

  companion object {
    const val NAME = "hybrid"
    private const val RSA_CIPHER = "RSA/None/PKCS1Padding"
    private const val ENCRYPTED_SECRET_KEY_PROPERTY = "esk"
  }
}
