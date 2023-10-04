// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sqlite

import android.content.Context
import android.util.Log
import androidx.collection.ArrayMap
import androidx.core.os.bundleOf
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.IOException
import java.util.*

class SQLiteModule : Module() {
  private val cachedDatabase = ArrayMap<String, SQLite3Wrapper>()
  private var hasListeners = false

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoSQLite")

    Events("onDatabaseChange")

    AsyncFunction("exec") { dbName: String, queries: List<Query>, readOnly: Boolean ->
      return@AsyncFunction execute(dbName, queries, readOnly)
    }

    AsyncFunction("execRawQuery") { dbName: String, queries: List<Query>, readOnly: Boolean ->
      return@AsyncFunction execute(dbName, queries, readOnly)
    }

    AsyncFunction("close") { dbName: String ->
      cachedDatabase
        .remove(dbName)
        ?.sqlite3_close()
    }

    Function("closeSync") { dbName: String ->
      cachedDatabase
        .remove(dbName)
        ?.sqlite3_close()
    }

    AsyncFunction("deleteAsync") { dbName: String ->
      if (cachedDatabase[dbName] != null) {
        throw OpenDatabaseException(dbName)
      }
      val dbFile = File(pathForDatabaseName(dbName))
      if (!dbFile.exists()) {
        throw DatabaseNotFoundException(dbName)
      }
      if (!dbFile.delete()) {
        throw DeleteDatabaseException(dbName)
      }
    }

    OnStartObserving {
      hasListeners = true
    }

    OnStopObserving {
      hasListeners = false
    }

    OnDestroy {
      cachedDatabase.values.forEach {
        it.executeSql("SELECT crsql_finalize()", emptyList(), false)
        it.sqlite3_close()
      }
    }
  }

  @Throws(IOException::class)
  private fun pathForDatabaseName(name: String): String {
    val directory = File("${context.filesDir}${File.separator}SQLite")
    ensureDirExists(directory)
    return "$directory${File.separator}$name"
  }

  private fun openDatabase(dbName: String): SQLite3Wrapper? {
    val path: String
    try {
      path = pathForDatabaseName(dbName)
    } catch (_: IOException) {
      return null
    }

    if (File(path).exists()) {
      cachedDatabase[dbName]?.let {
        return it
      }
    }

    cachedDatabase.remove(dbName)
    val db = SQLite3Wrapper.open(path) ?: return null
    loadExtensions(db)
    addUpdateListener(db)
    cachedDatabase[dbName] = db
    return db
  }

  private fun loadExtensions(db: SQLite3Wrapper) {
    var errCode = db.sqlite3_enable_load_extension(1)
    if (errCode != SQLite3Wrapper.SQLITE_OK) {
      Log.e(TAG, "Failed to enable sqlite3 extensions - errCode[$errCode]")
      return
    }
    errCode = db.sqlite3_load_extension("libcrsqlite", "sqlite3_crsqlite_init")
    if (errCode != SQLite3Wrapper.SQLITE_OK) {
      Log.e(TAG, "Failed to load crsqlite extension - errCode[$errCode]")
    }
  }

  private fun execute(dbName: String, queries: List<Query>, readOnly: Boolean): List<Any> {
    val db = openDatabase(dbName) ?: throw OpenDatabaseException(dbName)
    return queries.map { db.executeSql(it.sql, it.args, readOnly) }
  }

  private fun addUpdateListener(db: SQLite3Wrapper) {
    db.enableUpdateHook { tableName: String, operationType: Int, rowID: Long ->
      if (!hasListeners) {
        return@enableUpdateHook
      }
      sendEvent(
        "onDatabaseChange",
        bundleOf(
          "tableName" to tableName,
          "rowId" to rowID,
          "typeId" to when (operationType) {
            9 -> SqlAction.DELETE.value
            18 -> SqlAction.INSERT.value
            23 -> SqlAction.UPDATE.value
            else -> SqlAction.UNKNOWN.value
          }
        )
      )
    }
  }

  internal class SQLitePluginResult(
    val rows: Array<Array<Any?>>,
    val columns: Array<String?>,
    val rowsAffected: Int,
    val insertId: Long,
    val error: Throwable?
  )

  companion object {
    private val TAG = SQLiteModule::class.java.simpleName
  }
}
