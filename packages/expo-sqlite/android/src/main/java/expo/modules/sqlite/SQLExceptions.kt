package expo.modules.sqlite

import expo.modules.kotlin.exception.CodedException

class OpenDatabaseException(name: String) :
  CodedException("Unable to delete database '$name' that is currently open. Close it prior to deletion.")

class DatabaseNotFoundException(name: String) :
  CodedException("Database '$name' not found")

class DeleteDatabaseException(name: String) :
  CodedException("Unable to delete the database file for '$name' database")

class SQLiteException(message: String?, cause: Throwable?) :
  CodedException(SQLiteModule::class.java.simpleName, message, cause)
