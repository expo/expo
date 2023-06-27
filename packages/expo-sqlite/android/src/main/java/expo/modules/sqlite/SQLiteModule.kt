// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sqlite

import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.IOException
import java.util.*

private val EMPTY_ROWS = emptyArray<Array<Any?>>()
private val EMPTY_COLUMNS = emptyArray<String?>()
private val EMPTY_RESULT = SQLiteModule.SQLitePluginResult(EMPTY_ROWS, EMPTY_COLUMNS, 0, 0, null)
private val DATABASES: MutableMap<String, SQLiteDatabase?> = HashMap()

class SQLiteModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoSQLite")

    AsyncFunction("exec") { dbName: String, queries: List<Query>, readOnly: Boolean ->
      val db = getDatabase(dbName)
      val results = queries.map { sqlQuery ->
        val sql = sqlQuery.sql
        val bindArgs = convertParamsToStringArray(sqlQuery.args)
        try {
          if (isSelect(sql)) {
            doSelectInBackgroundAndPossiblyThrow(sql, bindArgs, db)
          } else { // update/insert/delete
            if (readOnly) {
              SQLitePluginResult(EMPTY_ROWS, EMPTY_COLUMNS, 0, 0, ReadOnlyException())
            } else {
              doUpdateInBackgroundAndPossiblyThrow(sql, bindArgs, db)
            }
          }
        } catch (e: Throwable) {
          SQLitePluginResult(EMPTY_ROWS, EMPTY_COLUMNS, 0, 0, e)
        }
      }
      return@AsyncFunction pluginResultsToPrimitiveData(results)
    }

    AsyncFunction("close") { dbName: String ->
      DATABASES
        .remove(dbName)
        ?.close()
    }

    AsyncFunction("deleteAsync") { dbName: String ->
      if (DATABASES.containsKey(dbName)) {
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
  }

  // do a update/delete/insert operation
  private fun doUpdateInBackgroundAndPossiblyThrow(
    sql: String,
    bindArgs: Array<String?>?,
    db: SQLiteDatabase
  ): SQLitePluginResult {
    return db.compileStatement(sql).use { statement ->
      if (bindArgs != null) {
        for (i in bindArgs.size downTo 1) {
          if (bindArgs[i - 1] == null) {
            statement.bindNull(i)
          } else {
            statement.bindString(i, bindArgs[i - 1])
          }
        }
      }
      if (isInsert(sql)) {
        val insertId = statement.executeInsert()
        val rowsAffected = if (insertId >= 0) 1 else 0
        SQLitePluginResult(EMPTY_ROWS, EMPTY_COLUMNS, rowsAffected, insertId, null)
      } else if (isDelete(sql) || isUpdate(sql)) {
        val rowsAffected = statement.executeUpdateDelete()
        SQLitePluginResult(EMPTY_ROWS, EMPTY_COLUMNS, rowsAffected, 0, null)
      } else {
        // in this case, we don't need rowsAffected or insertId, so we can have a slight
        // perf boost by just executing the query
        statement.execute()
        EMPTY_RESULT
      }
    }
  }

  // do a select operation
  private fun doSelectInBackgroundAndPossiblyThrow(
    sql: String,
    bindArgs: Array<String?>,
    db: SQLiteDatabase
  ): SQLitePluginResult {
    return db.rawQuery(sql, bindArgs).use { cursor ->
      val numRows = cursor.count
      if (numRows == 0) {
        return EMPTY_RESULT
      }
      val numColumns = cursor.columnCount
      val columnNames = cursor.columnNames
      val rows: Array<Array<Any?>> = Array(numRows) { arrayOfNulls(numColumns) }
      var i = 0
      while (cursor.moveToNext()) {
        val row = rows[i]
        for (j in 0 until numColumns) {
          row[j] = getValueFromCursor(cursor, j, cursor.getType(j))
        }
        rows[i] = row
        i++
      }
      SQLitePluginResult(rows, columnNames, 0, 0, null)
    }
  }

  private fun getValueFromCursor(cursor: Cursor, index: Int, columnType: Int): Any? {
    return when (columnType) {
      Cursor.FIELD_TYPE_FLOAT -> cursor.getDouble(index)
      Cursor.FIELD_TYPE_INTEGER -> cursor.getLong(index)
      Cursor.FIELD_TYPE_BLOB ->
        // convert byte[] to binary string; it's good enough, because
        // WebSQL doesn't support blobs anyway
        String(cursor.getBlob(index))

      Cursor.FIELD_TYPE_STRING -> cursor.getString(index)
      else -> null
    }
  }

  @Throws(IOException::class)
  private fun pathForDatabaseName(name: String): String {
    val directory = File("${context.filesDir}${File.separator}SQLite")
    ensureDirExists(directory)
    return "$directory${File.separator}$name"
  }

  @Throws(IOException::class)
  private fun getDatabase(name: String): SQLiteDatabase {
    var database: SQLiteDatabase? = null
    val path = pathForDatabaseName(name)
    if (File(path).exists()) {
      database = DATABASES[name]
    }
    if (database == null) {
      DATABASES.remove(name)
      database = SQLiteDatabase.openOrCreateDatabase(path, null)
      DATABASES[name] = database
    }
    return database!!
  }

  internal class SQLitePluginResult(
    val rows: Array<Array<Any?>>,
    val columns: Array<String?>,
    val rowsAffected: Int,
    val insertId: Long,
    val error: Throwable?
  )

  private class ReadOnlyException : Exception("could not prepare statement (23 not authorized)")
}
