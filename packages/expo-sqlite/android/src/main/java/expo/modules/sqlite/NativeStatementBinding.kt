// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import java.io.Closeable

internal typealias SQLiteColumnNames = ArrayList<String>
internal typealias SQLiteColumnValues = ArrayList<Any>

@Suppress("KotlinJniMissingFunction", "FunctionName")
@DoNotStrip
internal class NativeStatementBinding : Closeable {
  @DoNotStrip
  private val mHybridData: HybridData

  init {
    mHybridData = initHybrid()
  }

  override fun close() {
    mHybridData.resetNative()
  }

  // region sqlite3 bindings

  external fun sqlite3_bind_parameter_index(name: String): Int
  external fun sqlite3_clear_bindings(): Int
  external fun sqlite3_column_count(): Int
  external fun sqlite3_column_name(index: Int): String
  external fun sqlite3_finalize(): Int
  external fun sqlite3_reset(): Int
  external fun sqlite3_step(): Int

  external fun bindStatementParam(index: Int, param: Any): Int
  external fun getColumnNames(): SQLiteColumnNames
  external fun getColumnValues(): SQLiteColumnValues

  // endregion

  // region internals

  private external fun initHybrid(): HybridData

  // endregion
}
