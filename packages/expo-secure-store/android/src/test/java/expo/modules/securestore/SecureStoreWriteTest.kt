package expo.modules.securestore

import android.content.Context
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import java.io.File

@RunWith(RobolectricTestRunner::class)
class SecureStoreWriteTest {
  private val context: Context
    get() = RuntimeEnvironment.getApplication()

  private val sharedPreferencesDir: File
    get() = File(context.applicationInfo.dataDir, "shared_prefs")

  private val prefs
    get() = context.getSharedPreferences("SecureStore", Context.MODE_PRIVATE)

  @Test
  fun `throws when the encrypted item is not written to disk`() {
    prefs.edit().putString("keychain-key", "v1").commit()

    // Without write permission on the directory `SharedPreferencesImpl` cannot rename the file to
    // its backup, so `commit` returns false and the disk keeps the previous value.
    assertTrue(sharedPreferencesDir.setWritable(false))
    try {
      assertThrows(WriteException::class.java) {
        saveEncryptedItem(JSONObject().put("ciphertext", "v2"), prefs, "keychain-key", false, "keychain")
      }
      assertFalse(File(sharedPreferencesDir, "SecureStore.xml").readText().contains("v2"))
    } finally {
      sharedPreferencesDir.setWritable(true)
    }
  }

  @Test
  fun `keeps the previous value readable when the encrypted item is not written to disk`() {
    prefs.edit().putString("keychain-key", "v1").commit()

    assertTrue(sharedPreferencesDir.setWritable(false))
    try {
      assertThrows(WriteException::class.java) {
        saveEncryptedItem(JSONObject().put("ciphertext", "v2"), prefs, "keychain-key", false, "keychain")
      }
      assertEquals("v1", prefs.getString("keychain-key", null))
    } finally {
      sharedPreferencesDir.setWritable(true)
    }
  }
}
