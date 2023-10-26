// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import android.content.Context
import android.util.Log
import androidx.core.os.bundleOf
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.IOException

@Suppress("unused")
class SQLiteModuleNext : Module() {
  private val cachedDatabases: MutableList<NativeDatabase> = mutableListOf()
  private val cachedStatements: MutableList<NativeStatement> = mutableListOf()
  private var hasListeners = false

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoSQLiteNext")

    Events("onDatabaseChange")

    OnStartObserving {
      hasListeners = true
    }

    OnStopObserving {
      hasListeners = false
    }

    OnDestroy {
      cachedStatements.forEach {
        it.ref.sqlite3_finalize()
      }
      cachedStatements.clear()
      cachedDatabases.forEach {
        closeDatabase(it)
      }
      cachedDatabases.clear()
    }

    AsyncFunction("deleteDatabaseAsync") { dbName: String ->
      deleteDatabase(dbName)
    }
    Function("deleteDatabaseSync") { dbName: String ->
      deleteDatabase(dbName)
    }

    Class(NativeDatabase::class) {
      Constructor { dbName: String, options: OpenDatabaseOptions ->
        val dbPath = pathForDatabaseName(dbName)

        // Try to find opened database for fast refresh
        for (database in cachedDatabases) {
          if (database.dbName == dbName && database.openOptions == options && !options.useNewConnection) {
            return@Constructor database
          }
        }

        val database = NativeDatabase(dbName, options)
        if (database.ref.sqlite3_open(dbPath) != NativeDatabaseBinding.SQLITE_OK) {
          throw OpenDatabaseException(dbName)
        }
        cachedDatabases.add(database)
        return@Constructor database
      }

      AsyncFunction("initAsync") { database: NativeDatabase ->
        initDb(database)
      }
      Function("initSync") { database: NativeDatabase ->
        initDb(database)
      }

      AsyncFunction("isInTransactionAsync") { database: NativeDatabase ->
        return@AsyncFunction database.ref.sqlite3_get_autocommit() == 0
      }
      Function("isInTransactionSync") { database: NativeDatabase ->
        return@Function database.ref.sqlite3_get_autocommit() == 0
      }

      AsyncFunction("closeAsync") { database: NativeDatabase ->
        closeDatabase(database)
        cachedDatabases.remove(database)
      }
      Function("closeSync") { database: NativeDatabase ->
        closeDatabase(database)
        cachedDatabases.remove(database)
      }

      AsyncFunction("execAsync") { database: NativeDatabase, source: String ->
        exec(database, source)
      }
      Function("execSync") { database: NativeDatabase, source: String ->
        exec(database, source)
      }

      AsyncFunction("prepareAsync") { database: NativeDatabase, statement: NativeStatement, source: String ->
        prepareStatement(database, statement, source)
      }
      Function("prepareSync") { database: NativeDatabase, statement: NativeStatement, source: String ->
        prepareStatement(database, statement, source)
      }
    }

    Class(NativeStatement::class) {
      Constructor {
        return@Constructor NativeStatement()
      }

      AsyncFunction("arrayRunAsync") { statement: NativeStatement, database: NativeDatabase, bindParams: List<Any> ->
        return@AsyncFunction arrayRun(statement, database, bindParams)
      }
      Function("arrayRunSync") { statement: NativeStatement, database: NativeDatabase, bindParams: List<Any> ->
        return@Function arrayRun(statement, database, bindParams)
      }

      AsyncFunction("objectRunAsync") { statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any> ->
        return@AsyncFunction objectRun(statement, database, bindParams)
      }
      Function("objectRunSync") { statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any> ->
        return@Function objectRun(statement, database, bindParams)
      }

      AsyncFunction("arrayGetAsync") { statement: NativeStatement, database: NativeDatabase, bindParams: List<Any> ->
        return@AsyncFunction arrayGet(statement, database, bindParams)
      }
      Function("arrayGetSync") { statement: NativeStatement, database: NativeDatabase, bindParams: List<Any> ->
        return@Function arrayGet(statement, database, bindParams)
      }

      AsyncFunction("objectGetAsync") { statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any> ->
        return@AsyncFunction objectGet(statement, database, bindParams)
      }
      Function("objectGetSync") { statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any> ->
        return@Function objectGet(statement, database, bindParams)
      }

      AsyncFunction("arrayGetAllAsync") { statement: NativeStatement, database: NativeDatabase, bindParams: List<Any> ->
        return@AsyncFunction arrayGetAll(statement, database, bindParams)
      }
      Function("arrayGetAllSync") { statement: NativeStatement, database: NativeDatabase, bindParams: List<Any> ->
        return@Function arrayGetAll(statement, database, bindParams)
      }

      AsyncFunction("objectGetAllAsync") { statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any> ->
        return@AsyncFunction objectGetAll(statement, database, bindParams)
      }
      Function("objectGetAllSync") { statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any> ->
        return@Function objectGetAll(statement, database, bindParams)
      }

      AsyncFunction("resetAsync") { statement: NativeStatement, database: NativeDatabase ->
        return@AsyncFunction reset(statement, database)
      }
      Function("resetSync") { statement: NativeStatement, database: NativeDatabase ->
        return@Function reset(statement, database)
      }

      AsyncFunction("finalizeAsync") { statement: NativeStatement, database: NativeDatabase ->
        return@AsyncFunction finalize(statement, database)
      }
      Function("finalizeSync") { statement: NativeStatement, database: NativeDatabase ->
        return@Function finalize(statement, database)
      }
    }
  }

  @Throws(OpenDatabaseException::class)
  private fun pathForDatabaseName(name: String): String {
    try {
      val directory = File("${context.filesDir}${File.separator}SQLite")
      ensureDirExists(directory)
      return "$directory${File.separator}$name"
    } catch (_: IOException) {
      throw OpenDatabaseException(name)
    }
  }

  private fun initDb(database: NativeDatabase) {
    if (database.openOptions.enableCRSQLite) {
      loadCRSQLiteExtension(database)
    }
    if (database.openOptions.enableChangeListener) {
      addUpdateHook(database)
    }
  }

  @Throws(SQLiteErrorException::class)
  private fun exec(database: NativeDatabase, source: String) {
    database.ref.sqlite3_exec(source)
  }

  @Throws(SQLiteErrorException::class)
  private fun prepareStatement(database: NativeDatabase, statement: NativeStatement, source: String) {
    database.ref.sqlite3_prepare_v2(source, statement.ref)
    cachedStatements.add(statement)
  }

  @Throws(SQLiteErrorException::class)
  private fun arrayRun(statement: NativeStatement, database: NativeDatabase, bindParams: List<Any>): Map<String, Int> {
    for ((index, param) in bindParams.withIndex()) {
      statement.ref.bindStatementParam(index + 1, param)
    }
    val ret = statement.ref.sqlite3_step()
    if (ret != NativeDatabaseBinding.SQLITE_ROW && ret != NativeDatabaseBinding.SQLITE_DONE) {
      throw SQLiteErrorException(database.ref.convertSqlLiteErrorToString())
    }
    return mapOf(
      "lastInsertRowid" to database.ref.sqlite3_last_insert_rowid().toInt(),
      "changes" to database.ref.sqlite3_changes(),
    )
  }

  @Throws(SQLiteErrorException::class)
  private fun objectRun(statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any>): Map<String, Int> {
    for ((name, param) in bindParams) {
      val index = statement.ref.sqlite3_bind_parameter_index(name)
      if (index > 0) {
        statement.ref.bindStatementParam(index, param)
      }
    }
    val ret = statement.ref.sqlite3_step()
    if (ret != NativeDatabaseBinding.SQLITE_ROW && ret != NativeDatabaseBinding.SQLITE_DONE) {
      throw SQLiteErrorException(database.ref.convertSqlLiteErrorToString())
    }
    return mapOf(
      "lastInsertRowid" to database.ref.sqlite3_last_insert_rowid().toInt(),
      "changes" to database.ref.sqlite3_changes(),
    )
  }

  @Throws(InvalidConvertibleException::class, SQLiteErrorException::class)
  private fun arrayGet(statement: NativeStatement, database: NativeDatabase, bindParams: List<Any>): Row? {
    for ((index, param) in bindParams.withIndex()) {
      statement.ref.bindStatementParam(index + 1, param)
    }
    val ret = statement.ref.sqlite3_step()
    if (ret == NativeDatabaseBinding.SQLITE_ROW) {
      return statement.ref.getRow()
    }
    if (ret != NativeDatabaseBinding.SQLITE_DONE) {
      throw SQLiteErrorException(database.ref.convertSqlLiteErrorToString())
    }
    return null
  }

  @Throws(InvalidConvertibleException::class, SQLiteErrorException::class)
  private fun objectGet(statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any>): Row? {
    for ((name, param) in bindParams) {
      val index = statement.ref.sqlite3_bind_parameter_index(name)
      if (index > 0) {
        statement.ref.bindStatementParam(index, param)
      }
    }
    val ret = statement.ref.sqlite3_step()
    if (ret == NativeDatabaseBinding.SQLITE_ROW) {
      return statement.ref.getRow()
    }
    if (ret != NativeDatabaseBinding.SQLITE_DONE) {
      throw SQLiteErrorException(database.ref.convertSqlLiteErrorToString())
    }
    return null
  }

  @Throws(InvalidConvertibleException::class, SQLiteErrorException::class)
  private fun arrayGetAll(statement: NativeStatement, database: NativeDatabase, bindParams: List<Any>): List<Row> {
    for ((index, param) in bindParams.withIndex()) {
      statement.ref.bindStatementParam(index + 1, param)
    }
    val rows = mutableListOf<Row>()
    while (true) {
      val ret = statement.ref.sqlite3_step()
      if (ret == NativeDatabaseBinding.SQLITE_ROW) {
        rows.add(statement.ref.getRow())
        continue
      } else if (ret == NativeDatabaseBinding.SQLITE_DONE) {
        break
      }
      throw SQLiteErrorException(database.ref.convertSqlLiteErrorToString())
    }
    return rows
  }

  @Throws(InvalidConvertibleException::class, SQLiteErrorException::class)
  private fun objectGetAll(statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any>): List<Row> {
    for ((name, param) in bindParams) {
      val index = statement.ref.sqlite3_bind_parameter_index(name)
      if (index > 0) {
        statement.ref.bindStatementParam(index, param)
      }
    }
    val rows = mutableListOf<Row>()
    while (true) {
      val ret = statement.ref.sqlite3_step()
      if (ret == NativeDatabaseBinding.SQLITE_ROW) {
        rows.add(statement.ref.getRow())
        continue
      } else if (ret == NativeDatabaseBinding.SQLITE_DONE) {
        break
      }
      throw SQLiteErrorException(database.ref.convertSqlLiteErrorToString())
    }
    return rows
  }

  @Throws(SQLiteErrorException::class)
  private fun reset(statement: NativeStatement, database: NativeDatabase) {
    if (statement.ref.sqlite3_reset() != NativeDatabaseBinding.SQLITE_OK) {
      throw SQLiteErrorException(database.ref.convertSqlLiteErrorToString())
    }
  }

  @Throws(SQLiteErrorException::class)
  private fun finalize(statement: NativeStatement, database: NativeDatabase) {
    if (statement.ref.sqlite3_finalize() != NativeDatabaseBinding.SQLITE_OK) {
      throw SQLiteErrorException(database.ref.convertSqlLiteErrorToString())
    }
    cachedStatements.remove(statement)
  }

  private fun loadCRSQLiteExtension(database: NativeDatabase) {
    var errCode = database.ref.sqlite3_enable_load_extension(1)
    if (errCode != NativeDatabaseBinding.SQLITE_OK) {
      Log.e(TAG, "Failed to enable sqlite3 extensions - errCode[$errCode]")
      return
    }
    errCode = database.ref.sqlite3_load_extension("libcrsqlite", "sqlite3_crsqlite_init")
    if (errCode != NativeDatabaseBinding.SQLITE_OK) {
      Log.e(TAG, "Failed to load crsqlite extension - errCode[$errCode]")
    }
  }

  private fun addUpdateHook(database: NativeDatabase) {
    database.ref.enableUpdateHook { dbName, tableName, operationType, rowID ->
      if (!hasListeners) {
        return@enableUpdateHook
      }
      val dbFilePath = database.ref.sqlite3_db_filename(dbName)
      sendEvent(
        "onDatabaseChange",
        bundleOf(
          "dbName" to dbName,
          "dbFilePath" to dbFilePath,
          "tableName" to tableName,
          "rowId" to rowID,
          "typeId" to SQLAction.fromCode(operationType).value,
        )
      )
    }
  }

  private fun closeDatabase(database: NativeDatabase) {
    if (database.openOptions.enableCRSQLite) {
      database.ref.sqlite3_exec("SELECT crsql_finalize()")
    }
    database.ref.sqlite3_close()
  }

  private fun deleteDatabase(dbName: String) {
    cachedDatabases.find { it.dbName == dbName }?.let {
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

  companion object {
    private val TAG = SQLiteModuleNext::class.java.simpleName
  }
}
