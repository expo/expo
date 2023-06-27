package abi49_0_0.expo.modules.sqlite

import abi49_0_0.expo.modules.kotlin.exception.CodedException

class OpenDatabaseException(name: String) :
  CodedException("Unable to delete database '$name' that is currently open. Close it prior to deletion.")

class DatabaseNotFoundException(name: String) :
  CodedException("Database '$name' not found")

class DeleteDatabaseException(name: String) :
  CodedException("Unable to delete the database file for '$name' database")

class SQLiteException(message: String?, cause: Throwable?) :
  CodedException(SQLiteModule::class.java.simpleName, message, cause)
