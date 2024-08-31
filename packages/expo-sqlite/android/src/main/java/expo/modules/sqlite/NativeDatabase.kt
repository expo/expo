// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import expo.modules.kotlin.sharedobjects.SharedRef
import java.util.concurrent.atomic.AtomicInteger

internal class NativeDatabase(val databasePath: String, val openOptions: OpenDatabaseOptions) : SharedRef<NativeDatabaseBinding>(NativeDatabaseBinding()) {
  var isClosed = false
  private val refCount = AtomicInteger(1)

  internal fun addRef() {
    refCount.incrementAndGet()
  }

  override fun equals(other: Any?): Boolean {
    return other is NativeDatabase && this.ref == other.ref
  }

  override fun deallocate() {
    super.deallocate()
    val shouldClose = refCount.decrementAndGet() <= 0
    if (shouldClose) {
      this.ref.close()
    }
  }
}
