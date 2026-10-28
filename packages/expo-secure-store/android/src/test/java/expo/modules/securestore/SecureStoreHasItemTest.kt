package expo.modules.securestore

import android.content.Context
import android.security.keystore.KeyPermanentlyInvalidatedException
import android.security.keystore.UserNotAuthenticatedException
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class SecureStoreHasItemTest {
  private val context: Context
    get() = RuntimeEnvironment.getApplication()

  private val prefs
    get() = context.getSharedPreferences("SecureStore", Context.MODE_PRIVATE)

  @Test
  fun `reports no value when neither key format is stored`() {
    assertFalse(hasStoredEncryptedItem(prefs, "key", "keychain-key"))
  }

  @Test
  fun `finds a value stored under the current key format`() {
    prefs.edit().putString("keychain-key", "ciphertext").commit()

    assertTrue(hasStoredEncryptedItem(prefs, "key", "keychain-key"))
  }

  @Test
  fun `finds a value stored under the legacy key format`() {
    prefs.edit().putString("key", "ciphertext").commit()

    assertTrue(hasStoredEncryptedItem(prefs, "key", "keychain-key"))
  }

  @Test
  fun `treats a successful key probe as present`() {
    assertTrue(isKeyUsableWithoutPrompt { })
  }

  @Test
  fun `treats a permanently invalidated key as missing`() {
    assertFalse(
      isKeyUsableWithoutPrompt {
        throw KeyPermanentlyInvalidatedException("invalidated")
      }
    )
  }

  @Test
  fun `treats a key that still needs authentication as present`() {
    assertTrue(
      isKeyUsableWithoutPrompt {
        throw UserNotAuthenticatedException("authenticate")
      }
    )
  }

  @Test(expected = IllegalStateException::class)
  fun `rethrows unexpected probe failures`() {
    isKeyUsableWithoutPrompt {
      throw IllegalStateException("unexpected")
    }
  }
}
