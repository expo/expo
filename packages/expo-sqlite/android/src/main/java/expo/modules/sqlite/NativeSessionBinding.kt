// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import java.io.Closeable
import java.nio.ByteBuffer

@Suppress("KotlinJniMissingFunction", "FunctionName")
@DoNotStrip
internal class NativeSessionBinding : Closeable {
  @DoNotStrip
  private val mHybridData: HybridData

  init {
    mHybridData = initHybrid()
  }

  override fun close() {
    mHybridData.resetNative()
  }

  // region sqlite3session bindings

  external fun sqlite3session_create(db: NativeDatabaseBinding, dbName: String): Int
  external fun sqlite3session_attach(tableName: String?): Int
  external fun sqlite3session_enable(enabled: Boolean): Int
  external fun sqlite3session_delete()
  external fun sqlite3session_changeset(): ByteBuffer?
  external fun sqlite3session_changeset_inverted(): ByteBuffer?
  external fun sqlite3changeset_apply(db: NativeDatabaseBinding, changeset: ByteBuffer): Int
  external fun sqlite3changeset_invert(changeset: ByteBuffer): ByteBuffer?

  // endregion

  // region internals

  private external fun initHybrid(): HybridData

  // endregion
}
