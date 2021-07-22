// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sqlite

import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteStatement
import org.unimodules.core.ExportedModule
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod
import java.io.File
import java.io.IOException
import java.util.*

class SQLiteModule(private val mContext: Context) : ExportedModule(mContext) {
  companion object {
    private const val DEBUG_MODE = false
    private val TAG = SQLiteModule::class.java.simpleName
    private val EMPTY_ROWS = arrayOf<Array<Any?>>()
    private val EMPTY_COLUMNS = arrayOf<String?>()
    private val EMPTY_RESULT = SQLitePluginResult(EMPTY_ROWS, EMPTY_COLUMNS, 0, 0, null)
    private val DATABASES: MutableMap<String, SQLiteDatabase?> = HashMap()
  }

  override fun getName(): String {
    return "ExponentSQLite"
  }

  @ExpoMethod
  fun exec(dbName: String, queries: ArrayList<ArrayList<Any>>, readOnly: Boolean, promise: Promise) {
    try {
      val numQueries = queries.size
      val results = arrayOfNulls<SQLitePluginResult>(numQueries)
      val db = getDatabase(dbName)
      for (i in 0 until numQueries) {
        val sqlQuery = queries[i]
        val sql = sqlQuery[0] as String
        val bindArgs = convertParamsToStringArray(sqlQuery[1])
        try {
          if (isSelect(sql)) {
            results[i] = doSelectInBackgroundAndPossiblyThrow(sql, bindArgs, db)
          } else { // update/insert/delete
            if (readOnly) {
              results[i] = SQLitePluginResult(EMPTY_ROWS, EMPTY_COLUMNS, 0, 0, ReadOnlyException())
            } else {
              results[i] = doUpdateInBackgroundAndPossiblyThrow(sql, bindArgs, db)
            }
          }
        } catch (e: Throwable) {
          if (DEBUG_MODE) {
            e.printStackTrace()
          }
          results[i] = SQLitePluginResult(EMPTY_ROWS, EMPTY_COLUMNS, 0, 0, e)
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
    DATABASES[dbName]!!.close()
    DATABASES.remove(dbName)
    promise.resolve(null)
  }

  // do a update/delete/insert operation
  private fun doUpdateInBackgroundAndPossiblyThrow(
    sql: String,
    bindArgs: Array<String?>?,
    db: SQLiteDatabase?
  ): SQLitePluginResult {
    var statement: SQLiteStatement? = null
    return try {
      statement = db!!.compileStatement(sql)
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
    } finally {
      statement?.close()
    }
  }

  // do a select operation
  private fun doSelectInBackgroundAndPossiblyThrow(
    sql: String,
    bindArgs: Array<String?>,
    db: SQLiteDatabase?
  ): SQLitePluginResult {
    var cursor: Cursor? = null
    return try {
      cursor = db!!.rawQuery(sql, bindArgs)
      val numRows = cursor.count
      if (numRows == 0) {
        return EMPTY_RESULT
      }
      val numColumns = cursor.columnCount
      val rows: Array<Array<Any?>?> = arrayOfNulls(numRows)
      val columnNames = cursor.columnNames
      var i = 0
      while (cursor.moveToNext()) {
        val row = arrayOfNulls<Any>(numColumns)
        for (j in 0 until numColumns) {
          row[j] = getValueFromCursor(cursor, j, cursor.getType(j))
        }
        rows[i] = row
        i++
      }
      SQLitePluginResult(rows, columnNames, 0, 0, null)
    } finally {
      cursor?.close()
    }
  }

  private fun getValueFromCursor(cursor: Cursor?, index: Int, columnType: Int): Any? {
    when (columnType) {
      Cursor.FIELD_TYPE_FLOAT -> return cursor!!.getDouble(index)
      Cursor.FIELD_TYPE_INTEGER -> return cursor!!.getLong(index)
      Cursor.FIELD_TYPE_BLOB ->
        // convert byte[] to binary string; it's good enough, because
        // WebSQL doesn't support blobs anyway
        return String(cursor!!.getBlob(index))
      Cursor.FIELD_TYPE_STRING -> return cursor!!.getString(index)
    }
    return null
  }

  @Throws(IOException::class)
  private fun pathForDatabaseName(name: String): String {
    val directory = File(mContext.filesDir.toString() + File.separator + "SQLite")
    ensureDirExists(directory)
    return directory.toString() + File.separator + name
  }

  @Throws(IOException::class)
  private fun getDatabase(name: String): SQLiteDatabase? {
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
    return database
  }

  private class SQLitePluginResult(
    val rows: Array<Array<Any?>?>,
    val columns: Array<String?>,
    val rowsAffected: Int,
    val insertId: Long,
    val error: Throwable?
  )

  private class ReadOnlyException : Exception("could not prepare statement (23 not authorized)")
}
