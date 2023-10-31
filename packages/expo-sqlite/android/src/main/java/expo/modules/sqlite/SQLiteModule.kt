// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sqlite

import android.content.Context
import androidx.collection.ArrayMap
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.IOException
import java.util.*

class SQLiteModule : Module() {
  private val cachedDatabase = ArrayMap<String, SQLite3Wrapper>()

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoSQLite")

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
        throw DeleteDatabaseException(dbName)
      }
      val dbFile = File(pathForDatabaseName(dbName))
      if (!dbFile.exists()) {
        throw DatabaseNotFoundException(dbName)
      }
      if (!dbFile.delete()) {
        throw DeleteDatabaseFileException(dbName)
      }
    }

    OnDestroy {
      cachedDatabase.values.forEach {
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
    cachedDatabase[dbName] = db
    return db
  }

  private fun execute(dbName: String, queries: List<Query>, readOnly: Boolean): List<Any> {
    val db = openDatabase(dbName) ?: throw OpenDatabaseException(dbName)
    return queries.map { db.executeSql(it.sql, it.args, readOnly) }
  }

  internal class SQLitePluginResult(
    val rows: Array<Array<Any?>>,
    val columns: Array<String?>,
    val rowsAffected: Int,
    val insertId: Long,
    val error: Throwable?
  )
}
