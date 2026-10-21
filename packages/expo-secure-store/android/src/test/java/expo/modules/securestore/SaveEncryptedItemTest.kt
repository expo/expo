package expo.modules.securestore

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
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
 *
 * [commit] applies the mutations to the delegate before reporting failure, mirroring
 * `SharedPreferencesImpl`, which updates the in-memory map first and only then attempts the disk
 * write. That ordering is what makes a rejected write observable to later reads, so the fake has to
 * reproduce it for the rollback to be worth testing.
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

  override fun commit(): Boolean {
    delegate.commit()
    return false
  }

  override fun apply() = Unit
}

/**
 * A [SharedPreferences] that models AOSP's *other* reason for a `false` from `commit()`: the write
 * reached disk, but `writtenToDiskLatch.await()` threw because the calling thread's interrupt flag
 * was already set. `SharedPreferencesImpl.commit()` returns `false` from that `catch` even though
 * the inline disk write ran, and fsynced, before the `await()`.
 *
 * It reports failure only while the flag is set, so it is the fake that distinguishes clearing the
 * flag from guessing at the cause: with the flag cleared for the duration of the write, `commit()`
 * reports the real result instead.
 */
private class InterruptSensitivePreferences(
  private val delegate: SharedPreferences
) : SharedPreferences by delegate {
  override fun edit(): SharedPreferences.Editor = InterruptSensitiveEditor(delegate.edit())
}

private class InterruptSensitiveEditor(
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

  override fun commit(): Boolean {
    delegate.commit()
    // The disk write has landed either way; only the reported result depends on the flag.
    return !Thread.currentThread().isInterrupted
  }

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

  @Test
  fun `keeps the previously stored value readable when the write does not reach disk`() {
    val prefs = NonCommittingPreferences(preferences())

    // The first write goes through the delegate, so "existing-key" starts out persisted.
    saveEncryptedItem(
      encryptedItem = JSONObject().put("ciphertext", "v1"),
      prefs = preferences(),
      key = "existing-key",
      requireAuthentication = false,
      keychainService = "keychain"
    )
    val persisted = preferences().getString("existing-key", null)

    assertThrows(WriteException::class.java) {
      saveEncryptedItem(
        encryptedItem = JSONObject().put("ciphertext", "v2"),
        prefs = prefs,
        key = "existing-key",
        requireAuthentication = false,
        keychainService = "keychain"
      )
    }

    // Without the rollback the rejected "v2" would stay in the in-memory map and be handed to
    // every read for the rest of the process. This fake writes through to a healthy delegate and
    // only reports failure, so "v2" is on disk here; what the assertion pins down is the
    // in-memory read-back after a rejection, which is the state the report was about.
    val readBack = prefs.getString("existing-key", null)
    assertEquals(persisted, readBack)
    assertEquals("v1", JSONObject(readBack!!).getString("ciphertext"))
  }

  @Test
  fun `leaves a key that was never stored absent when the write does not reach disk`() {
    val prefs = NonCommittingPreferences(preferences())

    assertThrows(WriteException::class.java) {
      saveEncryptedItem(
        encryptedItem = JSONObject().put("ciphertext", "value"),
        prefs = prefs,
        key = "new-key",
        requireAuthentication = false,
        keychainService = "keychain"
      )
    }

    assertFalse(prefs.contains("new-key"))
    assertNull(prefs.getString("new-key", null))
  }

  @Test
  fun `keeps a write that reached disk when the calling thread was already interrupted`() {
    val prefs = InterruptSensitivePreferences(preferences())

    saveEncryptedItem(
      encryptedItem = JSONObject().put("ciphertext", "v1"),
      prefs = preferences(),
      key = "existing-key",
      requireAuthentication = false,
      keychainService = "keychain"
    )

    Thread.currentThread().interrupt()
    try {
      // `commit()` reports `false` here for a write that landed. Rolling back on that would
      // overwrite a persisted secret with the previous one, so the write has to be kept.
      saveEncryptedItem(
        encryptedItem = JSONObject().put("ciphertext", "v2"),
        prefs = prefs,
        key = "existing-key",
        requireAuthentication = false,
        keychainService = "keychain"
      )

      assertEquals("v2", JSONObject(prefs.getString("existing-key", null)!!).getString("ciphertext"))
      // The interrupt belongs to the caller, so it is handed back rather than swallowed.
      assertTrue(Thread.currentThread().isInterrupted)
    } finally {
      // Clear the flag so it cannot leak into another test on the same thread.
      Thread.interrupted()
    }
  }

  @Test
  fun `still rejects a write that did not reach disk when the thread was interrupted`() {
    val prefs = NonCommittingPreferences(preferences())

    Thread.currentThread().interrupt()
    try {
      assertThrows(WriteException::class.java) {
        saveEncryptedItem(
          encryptedItem = JSONObject().put("ciphertext", "value"),
          prefs = prefs,
          key = "new-key",
          requireAuthentication = false,
          keychainService = "keychain"
        )
      }

      // A genuinely failed write is still rejected and still rolled back; clearing the flag only
      // removes the interrupt as a *cause* of `false`, it does not suppress a real failure.
      assertFalse(prefs.contains("new-key"))
      assertTrue(Thread.currentThread().isInterrupted)
    } finally {
      Thread.interrupted()
    }
  }
}
