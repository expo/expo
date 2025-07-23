// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import expo.modules.kotlin.sharedobjects.SharedRef
import java.util.concurrent.atomic.AtomicInteger

internal class NativeDatabase(val databasePath: String, val openOptions: OpenDatabaseOptions) : SharedRef<NativeDatabaseBinding>(NativeDatabaseBinding()) {
  var isClosed = false
  private val refCount = AtomicInteger(1)

  internal fun addRef(): Int {
    return refCount.incrementAndGet()
  }

  internal fun release(): Int {
    return refCount.decrementAndGet()
  }

  override fun equals(other: Any?): Boolean {
    return other is NativeDatabase && this.ref == other.ref
  }

  override fun hashCode(): Int {
    return ref.hashCode()
  }

  override fun sharedObjectDidRelease() {
    super.sharedObjectDidRelease()
    this.ref.close()
  }
}
