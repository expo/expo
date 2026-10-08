// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import androidx.core.net.toFile
import androidx.core.net.toUri
import io.github.expo.modules.v2.Constant
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import java.io.File
import java.io.IOException
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

private const val MEMORY_DB_NAME = ":memory:"

@ExpoModule(
  name = "ExpoSQLite",
  classes = [NativeDatabase::class, NativeStatement::class, NativeSession::class]
)
class SQLiteModule : Module() {
  private val cachedDatabases: MutableList<DatabaseConnection> = mutableListOf()

  @Volatile
  private var hasListeners = false

  // The update hook runs inside SQLite, which must not be called back from there, and an emit on
  // the JS thread reaches the listeners at once. One background thread delivers the changes later
  // and in order instead.
  private val changeEvents: ExecutorService = Executors.newSingleThreadExecutor { runnable ->
    Thread(runnable, "expo-sqlite-change-events")
  }

  @JS
  @Constant
  val defaultDatabaseDirectory: String
    get() = androidContext.filesDir.canonicalPath + File.separator + "SQLite"

  @JS
  @Constant
  val bundledExtensions: Map<String, Map<String, String>>
    get() = buildMap {
      if (BuildConfig.WITH_SQLITE_VEC) {
        put(
          "sqlite-vec",
          mapOf(
            "libPath" to "vec",
            "entryPoint" to "sqlite3_vec_init"
          )
        )
      }
    }

  @Event(name = "onDatabaseChange")
  private val onDatabaseChange = event<DatabaseChangeEvent>(
    onStartObserving = { hasListeners = true },
    onStopObserving = { hasListeners = false }
  )

  override fun onDestroy() {
    for (connection in removeAllCachedDatabases()) {
      try {
        closeDatabase(connection)
      } catch (_: Throwable) {
      }
    }
    changeEvents.shutdown()
  }

  // region JavaScript members

  @JS
  suspend fun deleteDatabaseAsync(databasePath: String): Unit = io { deleteDatabase(databasePath) }

  @JS
  fun deleteDatabaseSync(databasePath: String): Unit = deleteDatabase(databasePath)

  @JS
  suspend fun importAssetDatabaseAsync(
    databasePath: String,
    assetDatabasePath: String,
    forceOverwrite: Boolean
  ) {
    io {
      val dbFile = File(ensureDatabasePathExists(databasePath))
      if (dbFile.exists() && !forceOverwrite) {
        return@io
      }
      val assetFile = assetDatabasePath.toUri().toFile()
      if (!assetFile.isFile) {
        throw OpenDatabaseException(assetDatabasePath)
      }
      assetFile.copyTo(dbFile, forceOverwrite)
    }
  }

  @JS
  suspend fun ensureDatabasePathExistsAsync(databasePath: String): Unit =
    io { ensureDatabasePathExists(databasePath) }

  @JS
  fun ensureDatabasePathExistsSync(databasePath: String) {
    ensureDatabasePathExists(databasePath)
  }

  @JS
  private suspend fun backupDatabaseAsync(
    destDatabase: NativeDatabase,
    destDatabaseName: String,
    sourceDatabase: NativeDatabase,
    sourceDatabaseName: String
  ): Unit = io {
    backupDatabase(
      destDatabase.connection,
      destDatabaseName,
      sourceDatabase.connection,
      sourceDatabaseName
    )
  }

  @JS
  private fun backupDatabaseSync(
    destDatabase: NativeDatabase,
    destDatabaseName: String,
    sourceDatabase: NativeDatabase,
    sourceDatabaseName: String
  ): Unit =
    backupDatabase(
      destDatabase.connection,
      destDatabaseName,
      sourceDatabase.connection,
      sourceDatabaseName
    )

  // endregion

  /**
   * The connection a new `NativeDatabase` uses: a cached one that is still open, so a fast refresh
   * keeps an in-memory database, or a new one.
   */
  internal fun openConnection(
    databasePath: String,
    options: OpenDatabaseOptions,
    serializedData: ByteArray?
  ): DatabaseConnection {
    val connection: DatabaseConnection
    if (serializedData != null) {
      connection = deserializeDatabase(serializedData, options)
    } else {
      // Try to find opened database for fast refresh
      findCachedDatabase { it.databasePath == databasePath && it.openOptions == options && !options.useNewConnection }?.let {
        it.addRef()
        return it
      }

      val dbPath = ensureDatabasePathExists(databasePath)
      connection = DatabaseConnection(databasePath, options)
      if (connection.ref.sqlite3_open(dbPath) != NativeDatabaseBinding.SQLITE_OK) {
        throw OpenDatabaseException(databasePath)
      }
    }

    addCachedDatabase(connection)
    return connection
  }

  @Throws(AccessClosedResourceException::class)
  internal fun initDb(connection: DatabaseConnection) {
    connection.maybeThrowForClosed()
    if (connection.openOptions.enableChangeListener) {
      addUpdateHook(connection)
    }
  }

  @Throws(OpenDatabaseException::class)
  private fun ensureDatabasePathExists(databasePath: String): String {
    if (databasePath == MEMORY_DB_NAME) {
      return databasePath
    }
    try {
      val parsedPath =
        databasePath.toUri().path ?: throw IOException("Couldn't parse Uri - $databasePath")
      val path = File(parsedPath)
      val parentPath =
        path.parentFile ?: throw IOException("Parent directory is null for path '$path'.")
      ensureDirExists(parentPath)
      return path.canonicalPath
    } catch (e: IOException) {
      throw OpenDatabaseException(databasePath, e.message)
    }
  }

  private fun deserializeDatabase(serializedData: ByteArray, options: OpenDatabaseOptions): DatabaseConnection {
    val connection = DatabaseConnection(MEMORY_DB_NAME, options)
    if (connection.ref.sqlite3_open(MEMORY_DB_NAME) != NativeDatabaseBinding.SQLITE_OK) {
      throw OpenDatabaseException(MEMORY_DB_NAME)
    }
    if (connection.ref.sqlite3_deserialize("main", serializedData) != NativeDatabaseBinding.SQLITE_OK) {
      throw SQLiteErrorException(connection.ref.convertSqlLiteErrorToString())
    }
    return connection
  }

  private fun addUpdateHook(connection: DatabaseConnection) {
    connection.ref.enableUpdateHook { databaseName, tableName, operationType, rowID ->
      if (!hasListeners) {
        return@enableUpdateHook
      }
      val event = DatabaseChangeEvent(
        databaseName = databaseName,
        databaseFilePath = connection.ref.sqlite3_db_filename(databaseName),
        tableName = tableName,
        rowId = rowID,
        typeId = SQLAction.fromCode(operationType)
      )
      changeEvents.execute { onDatabaseChange(event) }
    }
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun closeDatabase(connection: DatabaseConnection) {
    connection.closeLock.lock()
    try {
      synchronized(connection.statementLifecycleLock) {
        connection.maybeThrowForClosed()
        maybeFinalizeAllStatements(connection)
        val ret = connection.ref.sqlite3_close()
        if (ret != NativeDatabaseBinding.SQLITE_OK) {
          throw SQLiteErrorException(connection.ref.convertSqlLiteErrorToString())
        }
        connection.markClosed()
      }
    } finally {
      connection.closeLock.unlock()
    }
  }

  private fun deleteDatabase(databasePath: String) {
    findCachedDatabase { it.databasePath == databasePath }?.let {
      throw DeleteDatabaseException(databasePath)
    }

    if (databasePath == MEMORY_DB_NAME) {
      return
    }
    deleteDatabaseFiles(File(ensureDatabasePathExists(databasePath)), databasePath)
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun backupDatabase(
    destDatabase: DatabaseConnection,
    destDatabaseName: String,
    sourceDatabase: DatabaseConnection,
    sourceDatabaseName: String
  ) {
    destDatabase.maybeThrowForClosed()
    sourceDatabase.maybeThrowForClosed()
    NativeDatabaseBinding.sqlite3_backup(destDatabase.ref, destDatabaseName, sourceDatabase.ref, sourceDatabaseName)
  }

  // region cachedDatabases managements

  @Synchronized
  private fun addCachedDatabase(connection: DatabaseConnection) {
    cachedDatabases.add(connection)
  }

  @Synchronized
  internal fun closeDatabaseIfNeeded(connection: DatabaseConnection) {
    connection.maybeThrowForClosed()
    val index = cachedDatabases.indexOf(connection)
    if (index >= 0) {
      val db = cachedDatabases[index]
      if (db.release() == 0) {
        try {
          closeDatabase(db)
        } catch (error: Exception) {
          // Keep the connection cached and owned so callers can clean up and retry.
          db.addRef()
          throw error
        }
        cachedDatabases.removeAt(index)
      }
    }
  }

  @Synchronized
  private fun findCachedDatabase(predicate: (DatabaseConnection) -> Boolean): DatabaseConnection? {
    return cachedDatabases.find(predicate)
  }

  @Synchronized
  private fun removeAllCachedDatabases(): List<DatabaseConnection> {
    val databases = cachedDatabases.toList()
    cachedDatabases.clear()
    return databases
  }

  // endregion

  // region statements managements

  private fun maybeFinalizeAllStatements(connection: DatabaseConnection) {
    if (!connection.openOptions.finalizeUnusedStatementsBeforeClosing) {
      return
    }
    // Finalize through the wrappers so even a failed close leaves them invalidated.
    // Do not destroy SQLite-internal statements owned by concurrent exec/backup operations.
    var firstError: Exception? = null
    for (statement in connection.statements.toList()) {
      try {
        statement.finalizeOn(connection)
      } catch (error: SQLiteErrorException) {
        android.util.Log.w("expo-sqlite", "Finalizing a statement during close failed", error)
      } catch (error: Exception) {
        // A broken wrapper must not prevent cleanup of the remaining statements.
        firstError = firstError ?: error
      }
    }
    firstError?.let { throw it }
  }

  // endregion
}
