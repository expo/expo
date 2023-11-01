// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import android.util.ArrayMap
import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip

internal typealias Row = ArrayMap<String, Any>

@Suppress("KotlinJniMissingFunction")
@DoNotStrip
internal class NativeStatementBinding {
  @DoNotStrip
  private val mHybridData: HybridData

  init {
    mHybridData = initHybrid()
  }

  // region sqlite3 bindings

  external fun sqlite3_bind_parameter_index(name: String): Int
  external fun sqlite3_column_count(): Int
  external fun sqlite3_column_name(index: Int): String
  external fun sqlite3_finalize(): Int
  external fun sqlite3_reset(): Int
  external fun sqlite3_step(): Int

  external fun bindStatementParam(index: Int, param: Any): Int
  external fun getRow(): Row

  // endregion

  // region internals

  private external fun initHybrid(): HybridData

  // endregion
}
