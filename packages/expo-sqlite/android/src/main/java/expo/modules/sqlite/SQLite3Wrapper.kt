package expo.modules.sqlite

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip

@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class SQLite3Wrapper private constructor() {
  @DoNotStrip
  private val mHybridData: HybridData

  init {
    mHybridData = initHybrid()
  }

  /**
   * Execute SQL commands
   */
  external fun executeSql(sql: String, args: List<Any?>, readOnly: Boolean): List<Any>

  // region sqlite3 bindings

  external fun sqlite3_open(dbPath: String): Int
  external fun sqlite3_close(): Int

  // endregion

  // region internals

  private external fun initHybrid(): HybridData

  // endregion

  companion object {
    init {
      System.loadLibrary("expo-sqlite")
    }

    @JvmStatic
    fun open(dbPath: String): SQLite3Wrapper? {
      val instance = SQLite3Wrapper()
      if (instance.sqlite3_open(dbPath) != SQLITE_OK) {
        return null
      }
      return instance
    }

    // These error code should be synced with sqlite3.h
    const val SQLITE_OK = 0
  }
}
