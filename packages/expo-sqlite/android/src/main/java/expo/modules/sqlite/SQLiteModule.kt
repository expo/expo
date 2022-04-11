// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sqlite

import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import expo.modules.core.ExportedModule
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod
import java.io.File
import java.io.IOException
import java.util.*

private val TAG = SQLiteModule::class.java.simpleName
private val EMPTY_ROWS = arrayOf<Array<Any?>>()
private val EMPTY_COLUMNS = arrayOf<String?>()
private val EMPTY_RESULT = SQLiteModule.SQLitePluginResult(EMPTY_ROWS, EMPTY_COLUMNS, 0, 0, null)
private val DATABASES: MutableMap<String, SQLiteDatabase?> = HashMap()

class SQLiteModule(private val mContext: Context) : ExportedModule(mContext) {
  override fun getName(): String {
    return "ExponentSQLite"
  }

  @ExpoMethod
  fun exec(dbName: String, queries: ArrayList<ArrayList<Any>>, readOnly: Boolean, promise: Promise) {
    try {
      val db = getDatabase(dbName)
      val results = queries.map { sqlQuery ->
        val sql = sqlQuery[0] as String
        val bindArgs = convertParamsToStringArray(sqlQuery[1] as ArrayList<Any?>)
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
      val data = pluginResultsToPrimitiveData(results)
      promise.resolve(data)
    } catch (e: Exception) {
      promise.reject("SQLiteError", e)
    }
  }

  @ExpoMethod
  fun close(dbName: String, promise: Promise) {
    DATABASES
      .remove(dbName)
      ?.close()
    promise.resolve(null)
  }

  @ExpoMethod
  fun deleteAsync(dbName: String, promise: Promise) {
    val errorCode = "SQLiteError"
    if (DATABASES.containsKey(dbName)) {
      promise.reject(errorCode, "Unable to delete database '$dbName' that is currently open. Close it prior to deletion.")
    }
    val dbFile = File(pathForDatabaseName(dbName))
    if (!dbFile.exists()) {
      promise.reject(errorCode, "Database '$dbName' not found")
      return
    }
    if (!dbFile.delete()) {
      promise.reject(errorCode, "Unable to delete the database file for '$dbName' database")
      return
    }
    promise.resolve(null)
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
    val directory = File("${mContext.filesDir}${File.separator}SQLite")
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
