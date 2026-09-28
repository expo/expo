package expo.modules.securestore

import android.content.Context
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import java.io.File

@RunWith(RobolectricTestRunner::class)
class SecureStoreDeleteTest {
  private val context: Context
    get() = RuntimeEnvironment.getApplication()

  private val sharedPreferencesDir: File
    get() = File(context.applicationInfo.dataDir, "shared_prefs")

  private val prefs
    get() = context.getSharedPreferences("SecureStore", Context.MODE_PRIVATE)

  private val legacyPrefs
    get() = context.getSharedPreferences("legacy", Context.MODE_PRIVATE)

  @Test
  fun `removes both the current and the legacy key format`() {
    prefs.edit().putString("keychain-key", "current").putString("key", "legacy").commit()
    legacyPrefs.edit().putString("key", "oldest").commit()

    assertTrue(removeItem(prefs, legacyPrefs, "key", "keychain-key"))

    assertNull(prefs.getString("keychain-key", null))
    assertNull(prefs.getString("key", null))
    assertNull(legacyPrefs.getString("key", null))
  }

  @Test
  fun `reports failure when a delete is retried after a failed commit`() {
    prefs.edit().putString("keychain-key", "ciphertext").commit()
    // Create the file up front so that only the SecureStore file can fail the write below.
    legacyPrefs.edit().putString("unrelated", "value").commit()

    // Without write permission on the directory `SharedPreferencesImpl` cannot rename the file to
    // its backup, so `commit` returns false and leaves the entry on the disk. It still removes the
    // key from its in-memory map, which is what defeats a `contains` check on the retry.
    assertTrue(sharedPreferencesDir.setWritable(false))
    try {
      assertFalse(removeItem(prefs, legacyPrefs, "key", "keychain-key"))
      assertFalse(removeItem(prefs, legacyPrefs, "key", "keychain-key"))
      assertTrue(File(sharedPreferencesDir, "SecureStore.xml").readText().contains("ciphertext"))
    } finally {
      sharedPreferencesDir.setWritable(true)
    }
  }
}
