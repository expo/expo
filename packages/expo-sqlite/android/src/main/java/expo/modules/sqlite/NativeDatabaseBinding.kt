// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import java.io.Closeable

private typealias UpdateListener = (databaseName: String, tableName: String, operationType: Int, rowID: Long) -> Unit

@Suppress("KotlinJniMissingFunction", "FunctionName")
@DoNotStrip
internal class NativeDatabaseBinding : Closeable {
  @DoNotStrip
  private val mHybridData: HybridData

  private var mUpdateListener: UpdateListener? = null

  init {
    mHybridData = initHybrid()
  }

  override fun close() {
    mHybridData.resetNative()
  }

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
  @Suppress("unused")
  fun disableUpdateHook() {
    mUpdateListener = null
    sqlite3_update_hook(false)
  }

  // region sqlite3 bindings

  external fun sqlite3_changes(): Int
  external fun sqlite3_finalize_all_statement()
  external fun sqlite3_close(): Int
  external fun sqlite3_db_filename(databaseName: String): String
  external fun sqlite3_enable_load_extension(onoff: Int): Int
  external fun sqlite3_exec(source: String): Int
  external fun sqlite3_get_autocommit(): Int
  external fun sqlite3_last_insert_rowid(): Long
  external fun sqlite3_load_extension(libPath: String, entryPoint: String): Int
  external fun sqlite3_open(dbPath: String): Int
  external fun sqlite3_prepare_v2(source: String, statement: NativeStatementBinding): Int
  external fun sqlite3_serialize(databaseName: String): ByteArray
  external fun sqlite3_deserialize(databaseName: String, serializedData: ByteArray): Int
  private external fun sqlite3_update_hook(enabled: Boolean) // Keeps it private internally and uses `enableUpdateHook` publicly

  external fun libsql_open_remote(url: String, authToken: String): Int
  external fun libsql_open(dbPath: String, url: String, authToken: String): Int
  external fun libsql_sync(): Int

  external fun convertSqlLiteErrorToString(): String

  // endregion

  // region internals

  private external fun initHybrid(): HybridData

  @Suppress("unused")
  @DoNotStrip
  private fun onUpdate(action: Int, databaseName: String, tableName: String, rowId: Long) {
    mUpdateListener?.invoke(databaseName, tableName, action, rowId)
  }

  // endregion

  companion object {
    init {
      System.loadLibrary("expo-sqlite")
    }

    @JvmStatic
    external fun sqlite3_backup(
      destDatabase: NativeDatabaseBinding,
      destDatabaseName: String,
      sourceDatabase: NativeDatabaseBinding,
      sourceDatabaseName: String
    ): Int

    // These error code should be synced with sqlite3.h
    const val SQLITE_OK = 0

    const val SQLITE_ROW = 100
    const val SQLITE_DONE = 101
  }
}
