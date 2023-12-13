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

    AsyncFunction("exec") { databaseName: String, queries: List<Query>, readOnly: Boolean ->
      return@AsyncFunction execute(databaseName, queries, readOnly)
    }

    AsyncFunction("execRawQuery") { databaseName: String, queries: List<Query>, readOnly: Boolean ->
      return@AsyncFunction execute(databaseName, queries, readOnly)
    }

    AsyncFunction("close") { databaseName: String ->
      cachedDatabase
        .remove(databaseName)
        ?.sqlite3_close()
    }

    Function("closeSync") { databaseName: String ->
      cachedDatabase
        .remove(databaseName)
        ?.sqlite3_close()
    }

    AsyncFunction("deleteAsync") { databaseName: String ->
      if (cachedDatabase[databaseName] != null) {
        throw DeleteDatabaseException(databaseName)
      }
      val dbFile = File(pathForDatabaseName(databaseName))
      if (!dbFile.exists()) {
        throw DatabaseNotFoundException(databaseName)
      }
      if (!dbFile.delete()) {
        throw DeleteDatabaseFileException(databaseName)
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

  private fun openDatabase(databaseName: String): SQLite3Wrapper? {
    val path: String
    try {
      path = pathForDatabaseName(databaseName)
    } catch (_: IOException) {
      return null
    }

    if (File(path).exists()) {
      cachedDatabase[databaseName]?.let {
        return it
      }
    }

    cachedDatabase.remove(databaseName)
    val db = SQLite3Wrapper.open(path) ?: return null
    cachedDatabase[databaseName] = db
    return db
  }

  private fun execute(databaseName: String, queries: List<Query>, readOnly: Boolean): List<Any> {
    val db = openDatabase(databaseName) ?: throw OpenDatabaseException(databaseName)
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
