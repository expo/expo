package expo.modules.updates.db

import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Wrapper class that provides a rudimentary locking mechanism for the database. This allows us to
 * control what high-level operations involving the database can occur simultaneously. Most classes
 * should access [UpdatesDatabase] through this class.
 *
 */
class DatabaseHolder(private val mDatabase: UpdatesDatabase) {
  private val mutex = Mutex()

  // Less ideal but preserves accessing the database through a property
  val database = runBlocking {
    mutex.withLock {
      mDatabase
    }
  }

  // For non blocking access to the database inside suspend functions
  suspend fun <T> withDatabase(block: suspend (UpdatesDatabase) -> T): T {
    return mutex.withLock {
      block(mDatabase)
    }
  }

  companion object {
    private val TAG = DatabaseHolder::class.java.simpleName
  }
}
