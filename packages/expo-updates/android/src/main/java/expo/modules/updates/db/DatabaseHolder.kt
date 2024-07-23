package expo.modules.updates.db

import android.util.Log

/**
 * Wrapper class that provides a rudimentary locking mechanism for the database. This allows us to
 * control what high-level operations involving the database can occur simultaneously. Most classes
 * should access [UpdatesDatabase] through this class.
 *
 * Any process that calls `getDatabase` *must* manually release the lock by calling
 * `releaseDatabase` in every possible case (success, error) as soon as it is finished.
 *
 * On iOS we use GCD queues as a more sophisticated way of achieving the same thing; we may also
 * eventually want to migrate to a coroutine-based or Handler-based system in lieu of this class.
 */
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
