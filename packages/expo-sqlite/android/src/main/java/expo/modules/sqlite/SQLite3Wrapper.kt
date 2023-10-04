package expo.modules.sqlite

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip

private typealias UpdateListener = (tableName: String, operationType: Int, rowID: Long) -> Unit

@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class SQLite3Wrapper private constructor() {
  @DoNotStrip
  private val mHybridData: HybridData

  private var mUpdateListener: UpdateListener? = null

  init {
    mHybridData = initHybrid()
  }

  /**
   * Execute SQL commands
   */
  external fun executeSql(sql: String, args: List<Any?>, readOnly: Boolean): List<Any>

  /**
   * Enable data change notifications
   */
  fun enableUpdateHook(listener: UpdateListener) {
    sqlite3_update_hook(true)
    mUpdateListener = listener
  }

  /**
   * Disable data change notifications
   */
  fun disableUpdateHook() {
    mUpdateListener = null
    sqlite3_update_hook(false)
  }

  // region sqlite3 bindings

  external fun sqlite3_open(dbPath: String): Int
  external fun sqlite3_close(): Int

  external fun sqlite3_enable_load_extension(onoff: Int): Int
  external fun sqlite3_load_extension(libPath: String, entryProc: String): Int

  private external fun sqlite3_update_hook(enabled: Boolean)

  // endregion

  // region internals

  private external fun initHybrid(): HybridData

  @DoNotStrip
  private fun onUpdate(action: Int, dbName: String, tableName: String, rowId: Long) {
    mUpdateListener?.invoke(tableName, action, rowId)
  }

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
