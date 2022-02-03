package expo.modules.updates.db

import android.util.Log

class DatabaseHolder(private val mDatabase: UpdatesDatabase) {
  private var isInUse = false

  @get:Synchronized
  val database: UpdatesDatabase
    get() {
      while (isInUse) {
        try {
          (this as java.lang.Object).wait()
        } catch (e: InterruptedException) {
          Log.e(TAG, "Interrupted while waiting for database", e)
        }
      }
      isInUse = true
      return mDatabase
    }

  @Synchronized
  fun releaseDatabase() {
    isInUse = false
    (this as java.lang.Object).notify()
  }

  companion object {
    private val TAG = DatabaseHolder::class.java.simpleName
  }
}
