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

private const val MEMORY_DB_NAME = ":memory:"

@Suppress("unused")
class SQLiteModuleNext : Module() {
  private val cachedDatabases: MutableList<NativeDatabase> = mutableListOf()
  private val cachedStatements: MutableMap<NativeDatabase, MutableList<NativeStatement>> = mutableMapOf()
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
      try {
        removeAllCachedDatabases().forEach {
          closeDatabase(it)
        }
      } catch (_: Throwable) {}
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
        findCachedDatabase { it.dbName == dbName && it.openOptions == options && !options.useNewConnection }?.let {
          return@Constructor it
        }

        val database = NativeDatabase(dbName, options)
        if (database.ref.sqlite3_open(dbPath) != NativeDatabaseBinding.SQLITE_OK) {
          throw OpenDatabaseException(dbName)
        }
        addCachedDatabase(database)
        return@Constructor database
      }

      AsyncFunction("initAsync") { database: NativeDatabase ->
        initDb(database)
      }
      Function("initSync") { database: NativeDatabase ->
        initDb(database)
      }

      AsyncFunction("isInTransactionAsync") { database: NativeDatabase ->
        maybeThrowForClosedDatabase(database)
        return@AsyncFunction database.ref.sqlite3_get_autocommit() == 0
      }
      Function("isInTransactionSync") { database: NativeDatabase ->
        maybeThrowForClosedDatabase(database)
        return@Function database.ref.sqlite3_get_autocommit() == 0
      }

      AsyncFunction("closeAsync") { database: NativeDatabase ->
        removeCachedDatabase(database)
        closeDatabase(database)
      }
      Function("closeSync") { database: NativeDatabase ->
        removeCachedDatabase(database)
        closeDatabase(database)
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

      AsyncFunction("runAsync") { statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any>, bindBlobParams: Map<String, ByteArray>, shouldPassAsArray: Boolean ->
        return@AsyncFunction run(statement, database, bindParams, bindBlobParams, shouldPassAsArray)
      }
      Function("runSync") { statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any>, bindBlobParams: Map<String, ByteArray>, shouldPassAsArray: Boolean ->
        return@Function run(statement, database, bindParams, bindBlobParams, shouldPassAsArray)
      }

      AsyncFunction("getAsync") { statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any>, bindBlobParams: Map<String, ByteArray>, shouldPassAsArray: Boolean ->
        return@AsyncFunction get(statement, database, bindParams, bindBlobParams, shouldPassAsArray)
      }
      Function("getSync") { statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any>, bindBlobParams: Map<String, ByteArray>, shouldPassAsArray: Boolean ->
        return@Function get(statement, database, bindParams, bindBlobParams, shouldPassAsArray)
      }

      AsyncFunction("getAllAsync") { statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any>, bindBlobParams: Map<String, ByteArray>, shouldPassAsArray: Boolean ->
        return@AsyncFunction getAll(statement, database, bindParams, bindBlobParams, shouldPassAsArray)
      }
      Function("getAllSync") { statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any>, bindBlobParams: Map<String, ByteArray>, shouldPassAsArray: Boolean ->
        return@Function getAll(statement, database, bindParams, bindBlobParams, shouldPassAsArray)
      }

      AsyncFunction("getColumnNamesAsync") { statement: NativeStatement ->
        maybeThrowForFinalizedStatement(statement)
        return@AsyncFunction statement.ref.getColumnNames()
      }
      Function("getColumnNamesSync") { statement: NativeStatement ->
        maybeThrowForFinalizedStatement(statement)
        return@Function statement.ref.getColumnNames()
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
    if (name == MEMORY_DB_NAME) {
      return name
    }
    try {
      val directory = File("${context.filesDir}${File.separator}SQLite")
      ensureDirExists(directory)
      return "$directory${File.separator}$name"
    } catch (_: IOException) {
      throw OpenDatabaseException(name)
    }
  }

  @Throws(AccessClosedResourceException::class)
  private fun initDb(database: NativeDatabase) {
    maybeThrowForClosedDatabase(database)
    if (database.openOptions.enableCRSQLite) {
      loadCRSQLiteExtension(database)
    }
    if (database.openOptions.enableChangeListener) {
      addUpdateHook(database)
    }
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun exec(database: NativeDatabase, source: String) {
    maybeThrowForClosedDatabase(database)
    database.ref.sqlite3_exec(source)
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun prepareStatement(database: NativeDatabase, statement: NativeStatement, source: String) {
    maybeThrowForClosedDatabase(database)
    maybeThrowForFinalizedStatement(statement)
    database.ref.sqlite3_prepare_v2(source, statement.ref)
    maybeAddCachedStatement(database, statement)
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun run(statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any>, bindBlobParams: Map<String, ByteArray>, shouldPassAsArray: Boolean): Map<String, Int> {
    maybeThrowForClosedDatabase(database)
    maybeThrowForFinalizedStatement(statement)
    for ((key, param) in bindParams) {
      val index = getBindParamIndex(statement, key, shouldPassAsArray)
      if (index > 0) {
        statement.ref.bindStatementParam(index, param)
      }
    }
    for ((key, param) in bindBlobParams) {
      val index = getBindParamIndex(statement, key, shouldPassAsArray)
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

  @Throws(AccessClosedResourceException::class, InvalidConvertibleException::class, SQLiteErrorException::class)
  private fun get(statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any>, bindBlobParams: Map<String, ByteArray>, shouldPassAsArray: Boolean): ColumnValues? {
    maybeThrowForClosedDatabase(database)
    maybeThrowForFinalizedStatement(statement)
    for ((key, param) in bindParams) {
      val index = getBindParamIndex(statement, key, shouldPassAsArray)
      if (index > 0) {
        statement.ref.bindStatementParam(index, param)
      }
    }
    for ((key, param) in bindBlobParams) {
      val index = getBindParamIndex(statement, key, shouldPassAsArray)
      if (index > 0) {
        statement.ref.bindStatementParam(index, param)
      }
    }

    val ret = statement.ref.sqlite3_step()
    if (ret == NativeDatabaseBinding.SQLITE_ROW) {
      return statement.ref.getColumnValues()
    }
    if (ret != NativeDatabaseBinding.SQLITE_DONE) {
      throw SQLiteErrorException(database.ref.convertSqlLiteErrorToString())
    }
    return null
  }

  @Throws(AccessClosedResourceException::class, InvalidConvertibleException::class, SQLiteErrorException::class)
  private fun getAll(statement: NativeStatement, database: NativeDatabase, bindParams: Map<String, Any>, bindBlobParams: Map<String, ByteArray>, shouldPassAsArray: Boolean): List<ColumnValues> {
    maybeThrowForClosedDatabase(database)
    maybeThrowForFinalizedStatement(statement)
    for ((key, param) in bindParams) {
      val index = getBindParamIndex(statement, key, shouldPassAsArray)
      if (index > 0) {
        statement.ref.bindStatementParam(index, param)
      }
    }
    for ((key, param) in bindBlobParams) {
      val index = getBindParamIndex(statement, key, shouldPassAsArray)
      if (index > 0) {
        statement.ref.bindStatementParam(index, param)
      }
    }

    val columnValuesList = mutableListOf<ColumnValues>()
    while (true) {
      val ret = statement.ref.sqlite3_step()
      if (ret == NativeDatabaseBinding.SQLITE_ROW) {
        columnValuesList.add(statement.ref.getColumnValues())
        continue
      } else if (ret == NativeDatabaseBinding.SQLITE_DONE) {
        break
      }
      throw SQLiteErrorException(database.ref.convertSqlLiteErrorToString())
    }
    return columnValuesList
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun reset(statement: NativeStatement, database: NativeDatabase) {
    maybeThrowForClosedDatabase(database)
    maybeThrowForFinalizedStatement(statement)
    if (statement.ref.sqlite3_reset() != NativeDatabaseBinding.SQLITE_OK) {
      throw SQLiteErrorException(database.ref.convertSqlLiteErrorToString())
    }
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun finalize(statement: NativeStatement, database: NativeDatabase) {
    maybeThrowForClosedDatabase(database)
    maybeThrowForFinalizedStatement(statement)
    maybeRemoveCachedStatement(database, statement)
    if (statement.ref.sqlite3_finalize() != NativeDatabaseBinding.SQLITE_OK) {
      throw SQLiteErrorException(database.ref.convertSqlLiteErrorToString())
    }
    statement.isFinalized = true
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

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun closeDatabase(database: NativeDatabase) {
    maybeThrowForClosedDatabase(database)
    maybeRemoveAllCachedStatements(database).forEach {
      it.ref.sqlite3_finalize()
    }
    if (database.openOptions.enableCRSQLite) {
      database.ref.sqlite3_exec("SELECT crsql_finalize()")
    }
    val ret = database.ref.sqlite3_close()
    if (ret != NativeDatabaseBinding.SQLITE_OK) {
      throw SQLiteErrorException(database.ref.convertSqlLiteErrorToString())
    }
    database.isClosed = true
  }

  private fun deleteDatabase(dbName: String) {
    findCachedDatabase { it.dbName == dbName }?.let {
      throw DeleteDatabaseException(dbName)
    }

    if (dbName == MEMORY_DB_NAME) {
      return
    }
    val dbFile = File(pathForDatabaseName(dbName))
    if (!dbFile.exists()) {
      throw DatabaseNotFoundException(dbName)
    }
    if (!dbFile.delete()) {
      throw DeleteDatabaseFileException(dbName)
    }
  }

  @Throws(AccessClosedResourceException::class)
  private fun maybeThrowForClosedDatabase(database: NativeDatabase) {
    if (database.isClosed) {
      throw AccessClosedResourceException()
    }
  }

  @Throws(AccessClosedResourceException::class)
  private fun maybeThrowForFinalizedStatement(statement: NativeStatement) {
    if (statement.isFinalized) {
      throw AccessClosedResourceException()
    }
  }

  @Throws(InvalidBindParameterException::class)
  private fun getBindParamIndex(statement: NativeStatement, key: String, shouldPassAsArray: Boolean): Int =
    if (shouldPassAsArray) {
      (key.toIntOrNull() ?: throw InvalidBindParameterException()) + 1
    } else {
      statement.ref.sqlite3_bind_parameter_index(key)
    }

  // region cachedDatabases managements

  @Synchronized
  private fun addCachedDatabase(database: NativeDatabase) {
    cachedDatabases.add(database)
  }

  @Synchronized
  private fun removeCachedDatabase(database: NativeDatabase): NativeDatabase? {
    return if (cachedDatabases.remove(database)) {
      database
    } else {
      null
    }
  }

  @Synchronized
  private fun findCachedDatabase(predicate: (NativeDatabase) -> Boolean): NativeDatabase? {
    return cachedDatabases.find(predicate)
  }

  @Synchronized
  private fun removeAllCachedDatabases(): List<NativeDatabase> {
    val databases = cachedDatabases
    cachedDatabases.clear()
    return databases
  }

  // endregion

  // region cachedStatements managements

  @Synchronized
  private fun maybeAddCachedStatement(database: NativeDatabase, statement: NativeStatement) {
    if (!database.openOptions.finalizeUnusedStatementsBeforeClosing) {
      return
    }
    val statements = cachedStatements[database]
    if (statements != null) {
      statements.add(statement)
    } else {
      cachedStatements[database] = mutableListOf(statement)
    }
  }

  @Synchronized
  private fun maybeRemoveCachedStatement(database: NativeDatabase, statement: NativeStatement) {
    if (!database.openOptions.finalizeUnusedStatementsBeforeClosing) {
      return
    }
    cachedStatements[database]?.remove(statement)
  }

  @Synchronized
  private fun maybeRemoveAllCachedStatements(database: NativeDatabase): List<NativeStatement> {
    if (!database.openOptions.finalizeUnusedStatementsBeforeClosing) {
      return emptyList()
    }
    return cachedStatements.remove(database) ?: emptyList()
  }

  // endregion

  companion object {
    private val TAG = SQLiteModuleNext::class.java.simpleName
  }
}
