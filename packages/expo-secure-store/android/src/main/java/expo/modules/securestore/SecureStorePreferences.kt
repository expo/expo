package expo.modules.securestore

import android.content.SharedPreferences

private val writeLock = Any()

/**
 * `commit()` updates the in-memory map even when the disk write fails. This restores the previous
 * values of `keys` in that case, so reads keep returning what is on disk.
 */
internal fun SharedPreferences.commitOrRestore(keys: List<String>, changes: SharedPreferences.Editor.() -> Unit): Boolean = synchronized(writeLock) {
  val entries = all
  val previous = keys.associateWith { entries[it] }
  val editor = edit()
  editor.changes()
  if (editor.commit()) {
    return@synchronized true
  }

  val restore = edit()
  for ((key, value) in previous) {
    when (value) {
      null -> restore.remove(key)
      is String -> restore.putString(key, value)
    }
  }
  restore.commit()
  false
}

internal fun SharedPreferences.applyLocked(changes: SharedPreferences.Editor.() -> Unit) = synchronized(writeLock) {
  val editor = edit()
  editor.changes()
  editor.apply()
}
