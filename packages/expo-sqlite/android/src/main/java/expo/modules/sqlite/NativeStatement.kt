// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import expo.modules.kotlin.jni.NativeArrayBuffer
import expo.modules.kotlin.sharedobjects.SharedRef
import java.nio.ByteBuffer

internal class NativeStatement : SharedRef<NativeStatementBinding>(NativeStatementBinding()) {
  var isFinalized = false

  override fun sharedObjectDidRelease() {
    super.sharedObjectDidRelease()
    this.ref.close()
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
        is ByteBuffer -> NativeArrayBuffer(it)
        else -> it
      }
    }
    return ArrayList(columnValueList)
  }
}
