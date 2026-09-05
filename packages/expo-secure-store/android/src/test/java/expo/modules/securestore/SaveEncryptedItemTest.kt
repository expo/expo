package expo.modules.securestore

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/**
 * A [SharedPreferences] whose writes never reach disk. AOSP's `SharedPreferencesImpl` behaves this
 * way when it can't rename the backing file (for example when the `shared_prefs` directory is not
 * writable): the in-memory map is updated, but `commit()` reports failure.
 */
private class NonCommittingPreferences(
  private val delegate: SharedPreferences
) : SharedPreferences by delegate {
  override fun edit(): SharedPreferences.Editor = NonCommittingEditor(delegate.edit())
}

/**
 * Every builder method returns `this` rather than the delegate's editor, so a chained
 * `edit().putString(...).commit()` still lands on this editor's [commit].
 */
private class NonCommittingEditor(
  private val delegate: SharedPreferences.Editor
) : SharedPreferences.Editor {
  override fun putString(key: String?, value: String?) = apply { delegate.putString(key, value) }
  override fun putStringSet(key: String?, values: MutableSet<String>?) = apply { delegate.putStringSet(key, values) }
  override fun putInt(key: String?, value: Int) = apply { delegate.putInt(key, value) }
  override fun putLong(key: String?, value: Long) = apply { delegate.putLong(key, value) }
  override fun putFloat(key: String?, value: Float) = apply { delegate.putFloat(key, value) }
  override fun putBoolean(key: String?, value: Boolean) = apply { delegate.putBoolean(key, value) }
  override fun remove(key: String?) = apply { delegate.remove(key) }
  override fun clear() = apply { delegate.clear() }

  override fun commit(): Boolean = false
  override fun apply() = Unit
}

@RunWith(RobolectricTestRunner::class)
class SaveEncryptedItemTest {
  private val context: Context
    get() = RuntimeEnvironment.getApplication()

  private fun preferences(): SharedPreferences =
    context.getSharedPreferences("SecureStoreTest", Context.MODE_PRIVATE)

  @Test
  fun `writes the encrypted item under the given key`() {
    val prefs = preferences()

    saveEncryptedItem(
      encryptedItem = JSONObject().put("ciphertext", "value"),
      prefs = prefs,
      key = "key",
      requireAuthentication = false,
      keychainService = "keychain"
    )

    val stored = JSONObject(prefs.getString("key", null)!!)
    assertEquals("value", stored.getString("ciphertext"))
    assertEquals("keychain", stored.getString(SecureStoreModule.KEYSTORE_ALIAS_PROPERTY))
    assertTrue(stored.getBoolean(SecureStoreModule.USES_KEYSTORE_SUFFIX_PROPERTY))
  }

  @Test
  fun `throws when the write does not reach disk`() {
    val prefs = NonCommittingPreferences(preferences())

    assertThrows(WriteException::class.java) {
      saveEncryptedItem(
        encryptedItem = JSONObject().put("ciphertext", "value"),
        prefs = prefs,
        key = "key",
        requireAuthentication = false,
        keychainService = "keychain"
      )
    }
  }
}
