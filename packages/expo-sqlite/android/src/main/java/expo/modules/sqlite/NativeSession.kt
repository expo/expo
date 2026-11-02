// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import io.github.expo.modules.v2.ExpoSharedObject
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.SharedRef

@ExpoSharedObject
internal class NativeSession @JS constructor() : SharedRef<NativeSessionBinding>(NativeSessionBinding()) {
  override fun sharedObjectDidRelease() {
    super.sharedObjectDidRelease()
    this.ref.close()
  }

  // region JavaScript members

  @JS
  suspend fun attachAsync(database: NativeDatabase, table: String?) {
    io { attach(database.connection, table) }
  }

  @JS
  fun attachSync(database: NativeDatabase, table: String?) {
    attach(database.connection, table)
  }

  @JS
  suspend fun enableAsync(database: NativeDatabase, enabled: Boolean) {
    io { enable(database.connection, enabled) }
  }

  @JS
  fun enableSync(database: NativeDatabase, enabled: Boolean) {
    enable(database.connection, enabled)
  }

  @JS
  suspend fun closeAsync(database: NativeDatabase) {
    io { close(database.connection) }
  }

  @JS
  fun closeSync(database: NativeDatabase) {
    close(database.connection)
  }

  @JS
  suspend fun createChangesetAsync(database: NativeDatabase): ByteArray = io { createChangeset(database.connection) }

  @JS
  fun createChangesetSync(database: NativeDatabase): ByteArray = createChangeset(database.connection)

  @JS
  suspend fun createInvertedChangesetAsync(database: NativeDatabase): ByteArray =
    io { createInvertedChangeset(database.connection) }

  @JS
  fun createInvertedChangesetSync(database: NativeDatabase): ByteArray = createInvertedChangeset(database.connection)

  @JS
  suspend fun applyChangesetAsync(database: NativeDatabase, changeset: ByteArray) {
    io { applyChangeset(database.connection, changeset) }
  }

  @JS
  fun applyChangesetSync(database: NativeDatabase, changeset: ByteArray) {
    applyChangeset(database.connection, changeset)
  }

  @JS
  suspend fun invertChangesetAsync(database: NativeDatabase, changeset: ByteArray): ByteArray =
    io { invertChangeset(database.connection, changeset) }

  @JS
  fun invertChangesetSync(database: NativeDatabase, changeset: ByteArray): ByteArray =
    invertChangeset(database.connection, changeset)

  // endregion

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  fun create(connection: DatabaseConnection, dbName: String) {
    connection.maybeThrowForClosed()
    if (ref.sqlite3session_create(connection.ref, dbName) != NativeDatabaseBinding.SQLITE_OK) {
      throw SQLiteErrorException(connection.ref.convertSqlLiteErrorToString())
    }
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun attach(connection: DatabaseConnection, table: String?) {
    connection.maybeThrowForClosed()
    if (ref.sqlite3session_attach(table) != NativeDatabaseBinding.SQLITE_OK) {
      throw SQLiteErrorException(connection.ref.convertSqlLiteErrorToString())
    }
  }

  @Throws(AccessClosedResourceException::class)
  private fun enable(connection: DatabaseConnection, enabled: Boolean) {
    connection.maybeThrowForClosed()
    ref.sqlite3session_enable(enabled)
  }

  @Throws(AccessClosedResourceException::class)
  private fun close(connection: DatabaseConnection) {
    connection.maybeThrowForClosed()
    ref.sqlite3session_delete()
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun createChangeset(connection: DatabaseConnection): ByteArray {
    connection.maybeThrowForClosed()
    val byteBuffer = ref.sqlite3session_changeset()
      ?: throw SQLiteErrorException(connection.ref.convertSqlLiteErrorToString())
    return byteBuffer.toByteArray()
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun createInvertedChangeset(connection: DatabaseConnection): ByteArray {
    connection.maybeThrowForClosed()
    val byteBuffer = ref.sqlite3session_changeset_inverted()
      ?: throw SQLiteErrorException(connection.ref.convertSqlLiteErrorToString())
    return byteBuffer.toByteArray()
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun applyChangeset(connection: DatabaseConnection, changeset: ByteArray) {
    connection.maybeThrowForClosed()
    if (ref.sqlite3changeset_apply(connection.ref, changeset.toDirectBuffer()) != NativeDatabaseBinding.SQLITE_OK) {
      throw SQLiteErrorException(connection.ref.convertSqlLiteErrorToString())
    }
  }

  @Throws(AccessClosedResourceException::class, SQLiteErrorException::class)
  private fun invertChangeset(connection: DatabaseConnection, changeset: ByteArray): ByteArray {
    connection.maybeThrowForClosed()
    val byteBuffer = ref.sqlite3changeset_invert(changeset.toDirectBuffer())
      ?: throw SQLiteErrorException(connection.ref.convertSqlLiteErrorToString())
    return byteBuffer.toByteArray()
  }
}
