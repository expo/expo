// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.exception.CodedException

internal class OpenDatabaseException(path: String, additionalInfo: String? = null) :
  CodedException("Could not open database $path. ${additionalInfo ?: ""}".trim())

internal class DatabaseNotFoundException(name: String) :
  CodedException("Database '$name' not found")

internal class DeleteDatabaseException(name: String) :
  CodedException("Unable to delete database '$name' that is currently open. Close it prior to deletion.")

internal class DeleteDatabaseFileException(name: String) :
  CodedException("Unable to delete the database file for '$name' database")

@DoNotStrip
internal class SQLiteErrorException(message: String) :
  CodedException("ERR_INTERNAL_SQLITE_ERROR", message, null)

@DoNotStrip
internal class InvalidConvertibleException(message: String) :
  CodedException(message)

@DoNotStrip
internal class UnsupportedOperationException(message: String) :
  CodedException(if (message.isNotEmpty()) "Unsupported operations: $message" else "Unsupported operations")

internal class AccessClosedResourceException :
  CodedException("Access to closed resource")

internal class InvalidBindParameterException :
  CodedException("Invalid bind parameter")

internal class InvalidArgumentsException(message: String) :
  CodedException("Invalid arguments: $message")
