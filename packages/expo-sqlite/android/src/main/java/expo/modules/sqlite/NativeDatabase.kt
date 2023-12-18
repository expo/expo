// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import expo.modules.kotlin.sharedobjects.SharedRef

internal class NativeDatabase(val databaseName: String, val openOptions: OpenDatabaseOptions) : SharedRef<NativeDatabaseBinding>(NativeDatabaseBinding()) {
  var isClosed = false

  override fun equals(other: Any?): Boolean {
    return other is NativeDatabase && this.ref == other.ref
  }

  override fun deallocate() {
    super.deallocate()
    this.ref.close()
  }
}
