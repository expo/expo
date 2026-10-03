package expo.modules.securestore

import android.content.Context
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
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

  @Test
  fun `keeps the entries readable when the delete does not reach the disk`() {
    prefs.edit().putString("keychain-key", "ciphertext").putString("key", "legacy-ciphertext").commit()
    // Create the file up front so that only the SecureStore file can fail the write below.
    legacyPrefs.edit().putString("unrelated", "value").commit()

    assertTrue(sharedPreferencesDir.setWritable(false))
    try {
      assertFalse(removeItem(prefs, legacyPrefs, "key", "keychain-key"))

      // Both entries are still on the disk, so the in-memory map must still report them.
      // `getItemImpl` gates on `SharedPreferences.contains`, so a dropped entry makes a stored value
      // read as absent for the rest of the process.
      assertTrue(File(sharedPreferencesDir, "SecureStore.xml").readText().contains("ciphertext"))
      assertTrue(prefs.contains("keychain-key"))
      assertTrue(prefs.contains("key"))
      assertEquals("ciphertext", prefs.getString("keychain-key", null))
      assertEquals("legacy-ciphertext", prefs.getString("key", null))
    } finally {
      sharedPreferencesDir.setWritable(true)
    }
  }

  @Test
  fun `keeps the value on the disk when a later unrelated write succeeds`() {
    prefs.edit().putString("keychain-key", "ciphertext").commit()
    // Create the file up front so that only the SecureStore file can fail the write below.
    legacyPrefs.edit().putString("unrelated", "value").commit()

    assertTrue(sharedPreferencesDir.setWritable(false))
    try {
      assertFalse(removeItem(prefs, legacyPrefs, "key", "keychain-key"))
    } finally {
      assertTrue(sharedPreferencesDir.setWritable(true))
    }

    // `writeToFile` serializes the whole in-memory map. An unrelated write that does reach the disk
    // therefore makes a failed delete permanent if the map no longer holds the entry.
    assertTrue(prefs.edit().putString("unrelated-key", "value").commit())
    assertTrue(File(sharedPreferencesDir, "SecureStore.xml").readText().contains("ciphertext"))
  }

  @Test
  fun `keeps the entry removed when only the legacy file fails`() {
    // Device-protected storage has its own directory, so the legacy file can fail its write while
    // the SecureStore file succeeds.
    val deviceContext = context.createDeviceProtectedStorageContext()
    val deviceSharedPreferencesDir = File(deviceContext.dataDir, "shared_prefs")
    val deviceLegacyPrefs = deviceContext.getSharedPreferences("legacy", Context.MODE_PRIVATE)

    prefs.edit().putString("keychain-key", "ciphertext").commit()
    deviceLegacyPrefs.edit().putString("key", "oldest").commit()
    assertNotEquals(sharedPreferencesDir, deviceSharedPreferencesDir)

    assertTrue(deviceSharedPreferencesDir.setWritable(false))
    try {
      assertFalse(removeItem(prefs, deviceLegacyPrefs, "key", "keychain-key"))

      // The SecureStore file was rewritten, so its entry must stay removed. The combined result says
      // nothing about which of the two files failed.
      assertFalse(prefs.contains("keychain-key"))
      assertNull(prefs.getString("keychain-key", null))
    } finally {
      deviceSharedPreferencesDir.setWritable(true)
    }
  }
}
