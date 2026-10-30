package expo.modules.securestore

import android.content.SharedPreferences
import android.util.Log

// Android 7 `SharedPreferencesImpl` synchronizes on itself during disk writes, so locking on the
// preferences object can deadlock. Writes are serialized on this object instead.
private val writeLock = Any()

/**
 * Commits [changes] and returns the `commit()` result. A `null` value removes the key.
 *
 * `commit()` updates the in-memory map even when the disk write fails. In that case the previous
 * values of the changed keys are put back, so a later successful write does not persist the failed
 * change and reads return what is on disk.
 */
internal fun SharedPreferences.commitOrRestore(changes: Map<String, String?>): Boolean = synchronized(writeLock) {
  val entries = all
  val previous = changes.keys.associateWith { entries[it] }

  val editor = edit()
  for ((key, value) in changes) {
    editor.putString(key, value)
  }
  if (editor.commit()) {
    return@synchronized true
  }

  val restore = edit()
  for ((key, value) in previous) {
    when (value) {
      null -> restore.remove(key)
      is String -> restore.putString(key, value)
      else -> Log.w(SecureStoreModule.TAG, "Could not restore the non-string value under $key after a failed write")
    }
  }
  restore.commit()
  false
}
