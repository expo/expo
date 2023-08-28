package expo.modules.securestore.encryptors

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.security.KeyPairGeneratorSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import android.util.Log
import expo.modules.securestore.AuthenticationHelper
import expo.modules.securestore.SecureStoreModule
import expo.modules.securestore.SecureStoreOptions
import org.json.JSONException
import org.json.JSONObject
import java.math.BigInteger
import java.security.GeneralSecurityException
import java.security.InvalidAlgorithmParameterException
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.NoSuchAlgorithmException
import java.security.NoSuchProviderException
import java.security.SecureRandom
import java.security.UnrecoverableEntryException
import java.security.spec.AlgorithmParameterSpec
import java.security.spec.InvalidParameterSpecException
import java.util.*
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.NoSuchPaddingException
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import javax.security.auth.x500.X500Principal

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
    val keystoreAlias = getExtendedKeyStoreAlias(options, options.requireAuthentication)
    // See https://tools.ietf.org/html/rfc1779#section-2.3 for the DN grammar
    val escapedCommonName = '"'.toString() + keystoreAlias.replace("\\", "\\\\").replace("\"", "\\\"") + '"'

    @Suppress("DEPRECATION") // This will only be called on API level < 23
    val algorithmSpec: AlgorithmParameterSpec = KeyPairGeneratorSpec.Builder(mContext)
      .setAlias(keystoreAlias)
      .setSubject(X500Principal("CN=$escapedCommonName, OU=SecureStore"))
      .setSerialNumber(BigInteger(X509_SERIAL_NUMBER_LENGTH_BITS, mSecureRandom))
      .setStartDate(Date(0))
      .setEndDate(Date(Long.MAX_VALUE))
      .build()

    @SuppressLint("InlinedApi") // constant value will be copied
    val keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, keyStore.provider)

    keyPairGenerator.initialize(algorithmSpec)
    keyPairGenerator.generateKeyPair()
    return keyStore.getEntry(keystoreAlias, null) as? KeyStore.PrivateKeyEntry
      ?: throw UnrecoverableEntryException("Could not retrieve the newly generated private key entry")
  }

  @Throws(GeneralSecurityException::class, JSONException::class)
  override suspend fun createEncryptedItem(
    plaintextValue: String,
    keyStoreEntry: KeyStore.PrivateKeyEntry,
    requireAuthentication: Boolean,
    authenticationPrompt: String,
    authenticationHelper: AuthenticationHelper
  ): JSONObject {
    // Generate the IV and symmetric key with which we encrypt the value
    val ivBytes = ByteArray(GCM_IV_LENGTH_BYTES)
    mSecureRandom.nextBytes(ivBytes)

    // constant value will be copied
    @SuppressLint("InlinedApi") val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES)
    keyGenerator.init(AESEncryptor.AES_KEY_SIZE_BITS)
    val secretKey = keyGenerator.generateKey()

    // Encrypt the value with the symmetric key. We need to specify the GCM parameters since the
    // our secret key isn't tied to the keystore and the cipher can't use the secret key to
    // generate the parameters.
    val gcmSpec = GCMParameterSpec(GCM_AUTHENTICATION_TAG_LENGTH_BITS, ivBytes)
    val aesCipher = Cipher.getInstance(AESEncryptor.AES_CIPHER)

    aesCipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec)
    val chosenSpec = try {
      aesCipher.parameters.getParameterSpec(GCMParameterSpec::class.java)
    } catch (e: InvalidParameterSpecException) {
      // BouncyCastle tried to instantiate GCMParameterSpec using invalid constructor
      // https://github.com/bcgit/bc-java/commit/507c3917c0c469d10b9f033ad641c1da195e2039#diff-c90a59e823805b6c0dcfeaf7bae65f53

      // Let's do some sanity checks and use the spec we've initialized the cipher with.
      if ("GCM" != aesCipher.parameters.algorithm) {
        throw InvalidAlgorithmParameterException("Algorithm chosen by the cipher (" + aesCipher.parameters.algorithm + ") doesn't match requested (GCM).")
      }
      gcmSpec
    }

    val authenticatedCipher = authenticationHelper.authenticateCipher(aesCipher, requireAuthentication, authenticationPrompt)

    val aesResult = mAESEncryptor.createEncryptedItemWithCipher(plaintextValue, authenticatedCipher, chosenSpec)

    // Ensure the IV in the encrypted item matches our generated IV
    val ivString = aesResult.getString(AESEncryptor.IV_PROPERTY)
    val expectedIVString = Base64.encodeToString(ivBytes, Base64.NO_WRAP)
    if (ivString != expectedIVString) {
      Log.e(SecureStoreModule.TAG, String.format("HybridAESEncrypter generated two different IVs: %s and %s", expectedIVString, ivString))
      throw IllegalStateException("HybridAESEncryptor must store the same IV as the one used to parameterize the secret key")
    }

    // Encrypt the symmetric key with the asymmetric public key
    val secretKeyBytes = secretKey.encoded
    val cipher: Cipher = rSACipher
    cipher.init(Cipher.ENCRYPT_MODE, keyStoreEntry.certificate)
    val encryptedSecretKeyBytes = cipher.doFinal(secretKeyBytes)
    val encryptedSecretKeyString = Base64.encodeToString(encryptedSecretKeyBytes, Base64.NO_WRAP)
    aesResult.put(ENCRYPTED_SECRET_KEY_PROPERTY, encryptedSecretKeyString)

    return aesResult
  }

  @Throws(GeneralSecurityException::class, JSONException::class)
  override suspend fun decryptItem(encryptedItem: JSONObject, keyStoreEntry: KeyStore.PrivateKeyEntry, options: SecureStoreOptions, authenticationHelper: AuthenticationHelper): String {
    // Decrypt the encrypted symmetric key
    val encryptedSecretKeyString = encryptedItem.getString(ENCRYPTED_SECRET_KEY_PROPERTY)
    val encryptedSecretKeyBytes = Base64.decode(encryptedSecretKeyString, Base64.DEFAULT)
    val cipher = rSACipher
    cipher.init(Cipher.DECRYPT_MODE, keyStoreEntry.privateKey)
    val secretKeyBytes = cipher.doFinal(encryptedSecretKeyBytes)
    // constant value will be copied
    @SuppressLint("InlinedApi") val secretKey: SecretKey = SecretKeySpec(secretKeyBytes, KeyProperties.KEY_ALGORITHM_AES)

    // Decrypt the value with the symmetric key
    val secretKeyEntry = KeyStore.SecretKeyEntry(secretKey)
    return mAESEncryptor.decryptItem(encryptedItem, secretKeyEntry, options, authenticationHelper)
  }

  @get:Throws(NoSuchAlgorithmException::class, NoSuchProviderException::class, NoSuchPaddingException::class)
  private val rSACipher: Cipher
    get() = if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) Cipher.getInstance(RSA_CIPHER, RSA_CIPHER_LEGACY_PROVIDER) else Cipher.getInstance(RSA_CIPHER)

  companion object {
    const val NAME = "hybrid"
    private const val RSA_CIPHER = "RSA/None/PKCS1Padding"
    private const val RSA_CIPHER_LEGACY_PROVIDER = "AndroidOpenSSL"
    private const val X509_SERIAL_NUMBER_LENGTH_BITS = 20 * 8
    private const val GCM_IV_LENGTH_BYTES = 12
    private const val GCM_AUTHENTICATION_TAG_LENGTH_BITS = 128
    private const val ENCRYPTED_SECRET_KEY_PROPERTY = "esk"
  }
}
