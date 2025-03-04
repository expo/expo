import ExpoModulesCore

internal final class DatabaseException: Exception {
  override var code: String {
    "E_SQLITE_OPEN_DATABASE"
  }

  override var reason: String {
    "Could not open database"
  }
}

internal final class DatabaseInvalidPathException: GenericException<String> {
  override var code: String {
    "E_SQLITE_INVALID_PATH"
  }

  override var reason: String {
    "Invalid database path: \(param)"
  }
}

internal final class DeleteDatabaseException: GenericException<String> {
  override var code: String {
    "E_SQLITE_DELETE_DATABASE"
  }

  override var reason: String {
    "Unable to delete database \(param) that is currently open. Close it prior to deletion"
  }
}

internal final class DatabaseNotFoundException: GenericException<String> {
  override var code: String {
    "E_SQLITE_DELETE_DATABASE"
  }

  override var reason: String {
    "Database \(param) not found"
  }
}

internal final class DeleteDatabaseFileException: GenericException<String> {
  override var code: String {
    "E_SQLITE_DELETE_DATABASE"
  }

  override var reason: String {
    "Unable to delete the database file for \(param) database"
  }
}

internal final class InvalidSqlException: Exception {
  override var reason: String {
    "sql argument must be a string"
  }
}

internal final class InvalidArgumentsException: GenericException<String> {
  override var reason: String {
    "Invalid arguments: \(param)"
  }
}

internal final class InvalidBindParameterException: Exception {
  override var reason: String {
    "Invalid bind parameter"
  }
}

internal final class AccessClosedResourceException: Exception {
  override var reason: String {
    "Access to closed resource"
  }
}

internal final class SQLiteErrorException: GenericException<String> {
  override var code: String {
    "ERR_INTERNAL_SQLITE_ERROR"
  }

  override var reason: String {
    "\(param)"
  }
}

internal final class InvalidConvertibleException: GenericException<String> {
}

internal final class UnsupportedOperationException: GenericException<String?> {
  convenience init() {
    self.init(nil)
  }

  override var reason: String {
    if let param = param {
      return "Unsupported operations: \(param)"
    }
    return "Unsupported operations"
  }
}
