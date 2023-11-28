// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import expo.modules.kotlin.sharedobjects.SharedRef

internal class NativeDatabase(val dbName: String, val openOptions: OpenDatabaseOptions) : SharedRef<NativeDatabaseBinding>(NativeDatabaseBinding()) {
  override fun equals(other: Any?): Boolean {
    return other is NativeDatabase && this.ref == other.ref
  }
}
