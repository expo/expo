// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import expo.modules.kotlin.jni.ArrayBuffer
import expo.modules.kotlin.sharedobjects.SharedRef
import java.nio.ByteBuffer

internal class NativeStatement : SharedRef<NativeStatementBinding>(NativeStatementBinding()) {
  var isFinalized = false
  var isPrepared = false
  var releasedByJavaScript = false

  override fun sharedObjectDidRelease() {
    super.sharedObjectDidRelease()
    synchronized(this) {
      if (isFinalized || !isPrepared) {
        ref.close()
      } else {
        releasedByJavaScript = true
      }
    }
  }

  override fun equals(other: Any?): Boolean {
    return other is NativeStatement && this.ref == other.ref
  }

  override fun hashCode(): Int {
    return ref.hashCode()
  }

  fun getTransformedColumnValues(): SQLiteColumnValues {
    val columnValueList = ref.getColumnValues().map {
      when (it) {
        is ByteBuffer -> ArrayBuffer(it)
        else -> it
      }
    }
    return ArrayList(columnValueList)
  }
}
