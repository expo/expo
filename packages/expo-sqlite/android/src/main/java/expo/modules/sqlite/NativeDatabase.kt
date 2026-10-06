// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import io.github.expo.modules.v2.ExpoSharedObject
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.SharedObject
import io.github.expo.modules.v2.module

/**
 * A database JavaScript opened. Opening a database that is already open, without asking for a new
 * connection, gives a new `NativeDatabase` over the same [DatabaseConnection], so the data and the
 * open count are shared, as one cached object shared them before.
 */
@ExpoSharedObject
internal class NativeDatabase(
  databasePath: String,
  options: OpenDatabaseOptions,
  serializedData: ByteArray?
) : SharedObject() {
  private val module: SQLiteModule = context.module<SQLiteModule>()
    ?: throw IllegalStateException(
      "Cannot open the database because the ExpoSQLite module is not installed in this app. " +
        "Rebuild the app after installing expo-sqlite."
    )

  val connection: DatabaseConnection = module.openConnection(
    databasePath,
    options,
    serializedData
  )
    .also {
      it.addHolder()
    }

  override fun sharedObjectDidRelease() {
    super.sharedObjectDidRelease()
    connection.removeHolder()
  }

  @JS
  suspend fun initAsync(): Unit = io { module.initDb(connection) }

  @JS
  fun initSync() {
    module.initDb(connection)
  }

  @JS
  suspend fun isInTransactionAsync(): Boolean = io { isInTransaction() }

  @JS
  fun isInTransactionSync(): Boolean = isInTransaction()

  @JS
  suspend fun closeAsync(): Unit = io { module.closeDatabaseIfNeeded(connection) }

  // Interrupt must reach SQLite immediately, without waiting for the running query's queue.
  @JS
  fun interruptSync() {
    // Do not block the JS thread or touch a connection being closed on another thread.
    if (!connection.closeLock.tryLock()) {
      throw DatabaseClosingException()
    }
    try {
      connection.maybeThrowForClosed()
      connection.ref.sqlite3_interrupt()
    } finally {
      connection.closeLock.unlock()
    }
  }

  @JS
  fun closeSync(): Unit = module.closeDatabaseIfNeeded(connection)

  @JS
  suspend fun execAsync(source: String): Unit = io { exec(source) }

  @JS
  fun execSync(source: String): Unit = exec(source)

  @JS
  suspend fun serializeAsync(databaseName: String): ByteArray = io { serialize(databaseName) }

  @JS
  fun serializeSync(databaseName: String): ByteArray = serialize(databaseName)

  @JS
  suspend fun prepareAsync(statement: NativeStatement, source: String): Unit =
    io { prepare(statement, source) }

  @JS
  fun prepareSync(statement: NativeStatement, source: String): Unit =
    prepare(statement, source)

  @JS
  suspend fun createSessionAsync(session: NativeSession, dbName: String): Unit =
    io { session.create(connection, dbName) }

  @JS
  fun createSessionSync(session: NativeSession, dbName: String): Unit =
    session.create(connection, dbName)

  @JS
  suspend fun loadExtensionAsync(libPath: String, entryPoint: String?): Unit =
    io { loadExtension(libPath, entryPoint) }

  @JS
  fun loadExtensionSync(libPath: String, entryPoint: String?): Unit =
    loadExtension(libPath, entryPoint)

  @Throws(AccessClosedResourceException::class)
  private fun isInTransaction(): Boolean {
    connection.maybeThrowForClosed()
    return connection.ref.sqlite3_get_autocommit() == 0
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun exec(source: String) {
    connection.maybeThrowForClosed()
    connection.ref.sqlite3_exec(source)
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun serialize(databaseName: String): ByteArray {
    connection.maybeThrowForClosed()
    return connection.ref.sqlite3_serialize(databaseName)
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun prepare(statement: NativeStatement, source: String) {
    synchronized(connection.statementLifecycleLock) {
      synchronized(statement) {
        statement.maybeThrowForFinalized()
        connection.maybeThrowForClosed()
        connection.ref.sqlite3_prepare_v2(source, statement.ref)
        statement.isPrepared = true
        connection.statements.add(statement)
      }
    }
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun loadExtension(libPath: String, entryPoint: String?) {
    connection.maybeThrowForClosed()
    connection.ref.sqlite3_enable_load_extension(1)
    val ret = connection.ref.sqlite3_load_extension(libPath, entryPoint ?: "")
    if (ret != NativeDatabaseBinding.SQLITE_OK) {
      throw SQLiteErrorException(connection.ref.convertSqlLiteErrorToString())
    }
  }
}
