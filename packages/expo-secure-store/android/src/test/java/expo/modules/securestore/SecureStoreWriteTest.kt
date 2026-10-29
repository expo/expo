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
  fun `throws and keeps the previous value when the encrypted item is not written to disk`() {
    prefs.edit().putString("keychain-key", "v1").commit()

    // Without write permission on the directory `SharedPreferencesImpl` cannot rename the file to
    // its backup, so `commit` returns false and the disk keeps the previous value.
    assertTrue(sharedPreferencesDir.setWritable(false))
    try {
      assertThrows(WriteException::class.java) {
        saveEncryptedItem(JSONObject().put("ciphertext", "v2"), prefs, "keychain-key", "key", false, "keychain")
      }
      assertEquals("v1", prefs.getString("keychain-key", null))
    } finally {
      sharedPreferencesDir.setWritable(true)
    }

    // A later successful write persists the whole in-memory map, so it must not carry the failed change.
    assertTrue(prefs.edit().putString("unrelated", "value").commit())
    val onDisk = File(sharedPreferencesDir, "SecureStore.xml").readText()
    assertTrue(onDisk.contains("v1"))
    assertFalse(onDisk.contains("v2"))
  }
}
