// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.locks.ReentrantLock

internal class DatabaseConnection(
  val databasePath: String,
  val openOptions: OpenDatabaseOptions
) {
  val ref = NativeDatabaseBinding()

  @Volatile
  var isClosed = false
    private set

  val closeLock = ReentrantLock()

  val statementLifecycleLock = Any()
  val statements = mutableListOf<NativeStatement>()

  /** How many times JavaScript opened this connection without closing it yet. */
  private val refCount = AtomicInteger(1)

  /** How many `NativeDatabase` objects that use this connection JavaScript still holds. */
  private var holders = 0
  private var isBindingReleased = false

  @Throws(AccessClosedResourceException::class)
  fun maybeThrowForClosed() {
    if (isClosed) {
      throw AccessClosedResourceException()
    }
  }

  fun addRef(): Int = refCount.incrementAndGet()

  fun release(): Int = refCount.decrementAndGet()

  @Synchronized
  fun addHolder() {
    holders++
  }

  /** JavaScript let go of a `NativeDatabase` that uses this connection. */
  @Synchronized
  fun removeHolder() {
    holders--
    releaseBindingIfUnused()
  }

  @Synchronized
  fun markClosed() {
    isClosed = true
    releaseBindingIfUnused()
  }

  // The binding goes once the connection is closed and nothing in JavaScript can reach it. A
  // connection JavaScript dropped while it was open stays usable, so it can still be reopened from
  // the cache, or closed when the module is destroyed.
  private fun releaseBindingIfUnused() {
    if (isClosed && holders == 0 && !isBindingReleased) {
      isBindingReleased = true
      ref.close()
    }
  }
}
