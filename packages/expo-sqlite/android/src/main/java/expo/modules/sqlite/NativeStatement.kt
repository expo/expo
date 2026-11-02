// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import io.github.expo.modules.v2.ExpoSharedObject
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.SharedRef

@ExpoSharedObject
internal class NativeStatement @JS constructor() : SharedRef<NativeStatementBinding>(NativeStatementBinding()) {
  var isFinalized = false
  var isPrepared = false
  var releasedByJavaScript = false

  override fun sharedObjectDidRelease() {
    super.sharedObjectDidRelease()
    synchronized(this) {
      if (isFinalized || !isPrepared) {
        ref.close()
      } else {
        releasedByJavaScript = true
      }
    }
  }

  // region JavaScript members

  @JS
  suspend fun runAsync(
    database: NativeDatabase,
    bindParams: Map<String, Any?>,
    bindBlobParams: Map<String, ByteArray>,
    shouldPassAsArray: Boolean
  ): RunResult = io { run(database.connection, bindParams, bindBlobParams, shouldPassAsArray) }

  @JS
  fun runSync(
    database: NativeDatabase,
    bindParams: Map<String, Any?>,
    bindBlobParams: Map<String, ByteArray>,
    shouldPassAsArray: Boolean
  ): RunResult = run(database.connection, bindParams, bindBlobParams, shouldPassAsArray)

  @JS
  suspend fun stepAsync(database: NativeDatabase): List<Any?>? = io { step(database.connection) }

  @JS
  fun stepSync(database: NativeDatabase): List<Any?>? = step(database.connection)

  @JS
  suspend fun getAllAsync(database: NativeDatabase): List<List<Any?>> =
    io { getAll(database.connection) }

  @JS
  fun getAllSync(database: NativeDatabase): List<List<Any?>> = getAll(database.connection)

  @JS
  suspend fun resetAsync(database: NativeDatabase): Unit = io { reset(database.connection) }

  @JS
  fun resetSync(database: NativeDatabase): Unit = reset(database.connection)

  @JS
  suspend fun getColumnNamesAsync(): List<String> = io { columnNames() }

  @JS
  fun getColumnNamesSync(): List<String> = columnNames()

  @JS
  suspend fun finalizeAsync(database: NativeDatabase): Unit = io { finalizeOn(database.connection) }

  @JS
  fun finalizeSync(database: NativeDatabase): Unit = finalizeOn(database.connection)

  // endregion

  fun getTransformedColumnValues(): List<Any?> = normalizeColumnValues(ref.getColumnValues())

  @Throws(AccessClosedResourceException::class)
  fun maybeThrowForFinalized() {
    if (isFinalized) {
      throw AccessClosedResourceException()
    }
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun run(
    connection: DatabaseConnection,
    bindParams: Map<String, Any?>,
    bindBlobParams: Map<String, ByteArray>,
    shouldPassAsArray: Boolean
  ): RunResult {
    // The statement with parameter bindings is stateful,
    // we have to guard with a critical section for thread safety.
    synchronized(this) {
      maybeThrowForFinalized()
      connection.maybeThrowForClosed()

      ref.sqlite3_reset()
      ref.sqlite3_clear_bindings()
      for ((key, param) in bindParams) {
        val index = getBindParamIndex(key, shouldPassAsArray)
        if (index > 0) {
          ref.bindStatementParam(index, normalizeBindParam(param))
        }
      }
      for ((key, param) in bindBlobParams) {
        val index = getBindParamIndex(key, shouldPassAsArray)
        if (index > 0) {
          ref.bindStatementParam(index, param)
        }
      }

      val ret = ref.sqlite3_step()
      if (ret != NativeDatabaseBinding.SQLITE_ROW && ret != NativeDatabaseBinding.SQLITE_DONE) {
        throw SQLiteErrorException(ref.getLastErrorMessage())
      }
      val firstRowValues: List<Any?> =
        if (ret == NativeDatabaseBinding.SQLITE_ROW) {
          getTransformedColumnValues()
        } else {
          emptyList()
        }
      return RunResult(
        lastInsertRowId = connection.ref.sqlite3_last_insert_rowid(),
        changes = connection.ref.sqlite3_changes(),
        firstRowValues = firstRowValues
      )
    }
  }

  @Throws(AccessClosedResourceException::class, InvalidConvertibleException::class, SQLiteErrorException::class)
  private fun step(connection: DatabaseConnection): List<Any?>? {
    // Guard the stateful statement, see `run` above.
    synchronized(this) {
      maybeThrowForFinalized()
      connection.maybeThrowForClosed()

      val ret = ref.sqlite3_step()
      if (ret == NativeDatabaseBinding.SQLITE_ROW) {
        return getTransformedColumnValues()
      }
      if (ret != NativeDatabaseBinding.SQLITE_DONE) {
        throw SQLiteErrorException(ref.getLastErrorMessage())
      }
      return null
    }
  }

  @Throws(AccessClosedResourceException::class, InvalidConvertibleException::class, SQLiteErrorException::class)
  private fun getAll(connection: DatabaseConnection): List<List<Any?>> {
    // Guard the stateful statement, see `run` above.
    synchronized(this) {
      maybeThrowForFinalized()
      connection.maybeThrowForClosed()

      val columnValuesList = mutableListOf<List<Any?>>()
      while (true) {
        val ret = ref.sqlite3_step()
        if (ret == NativeDatabaseBinding.SQLITE_ROW) {
          columnValuesList.add(getTransformedColumnValues())
          continue
        } else if (ret == NativeDatabaseBinding.SQLITE_DONE) {
          break
        }
        throw SQLiteErrorException(ref.getLastErrorMessage())
      }
      return columnValuesList
    }
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun reset(connection: DatabaseConnection) {
    // Guard the stateful statement, see `run` above.
    synchronized(this) {
      maybeThrowForFinalized()
      connection.maybeThrowForClosed()

      if (ref.sqlite3_reset() != NativeDatabaseBinding.SQLITE_OK) {
        throw SQLiteErrorException(ref.getLastErrorMessage())
      }
    }
  }

  @Throws(AccessClosedResourceException::class)
  private fun columnNames(): List<String> {
    synchronized(this) {
      maybeThrowForFinalized()
      return ref.getColumnNames()
    }
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  fun finalizeOn(connection: DatabaseConnection) {
    synchronized(connection.statementLifecycleLock) {
      // Guard the stateful statement, see `run` above.
      synchronized(this) {
        maybeThrowForFinalized()
        connection.maybeThrowForClosed()

        val ret = ref.sqlite3_finalize()
        val error = if (ret != NativeDatabaseBinding.SQLITE_OK) {
          ref.getLastErrorMessage()
        } else {
          null
        }
        // SQLite destroys the statement even when returning an earlier execution error.
        isFinalized = true
        connection.statements.removeAll { it === this }
        if (releasedByJavaScript) {
          ref.close()
        }
        if (error != null) {
          throw SQLiteErrorException(error)
        }
      }
    }
  }

  @Throws(InvalidBindParameterException::class)
  private fun getBindParamIndex(key: String, shouldPassAsArray: Boolean): Int =
    if (shouldPassAsArray) {
      (key.toIntOrNull() ?: throw InvalidBindParameterException()) + 1
    } else {
      ref.sqlite3_bind_parameter_index(key)
    }
}
