package expo.modules.securestore.encryptors

import android.util.Base64
import expo.modules.securestore.SecureStoreOptions
import java.nio.charset.StandardCharsets
import java.security.GeneralSecurityException
import java.security.KeyStore
import javax.crypto.Cipher

/**
 * A legacy encrypter that supports only RSA decryption for values written with SDK 20's
 * implementation of SecureStore.
 *
 *
 * Consider removing this after it's likely users have migrated all legacy entries (SDK ~27).
 */
class LegacySDK20Encrypter {
  fun getKeyStoreAlias(options: SecureStoreOptions): String? {
    return if (options.keychainService != null) options.keychainService else DEFAULT_ALIAS
  }

  @Throws(GeneralSecurityException::class)
  fun decryptItem(encryptedItem: String?, privateKeyEntry: KeyStore.PrivateKeyEntry): String {
    val ciphertextBytes = Base64.decode(encryptedItem, Base64.DEFAULT)
    val cipher = Cipher.getInstance(RSA_CIPHER)
    cipher.init(Cipher.DECRYPT_MODE, privateKeyEntry.privateKey)
    val plaintextBytes = cipher.doFinal(ciphertextBytes)
    return String(plaintextBytes, StandardCharsets.UTF_8)
  }

  companion object {
    private const val RSA_CIPHER = "RSA/ECB/PKCS1Padding"
    private const val DEFAULT_ALIAS = "MY_APP"
  }
}