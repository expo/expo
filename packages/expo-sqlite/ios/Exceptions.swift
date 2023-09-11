import ExpoModulesCore

internal class DatabaseException: Exception {
  override var code: String {
    "E_SQLITE_OPEN_DATABASE"
  }

  override var reason: String {
    "Could not open database"
  }
}

internal class DeleteDatabaseException: GenericException<String> {
  override var code: String {
    "E_SQLITE_DELETE_DATABASE"
  }

  override var reason: String {
    "Unable to delete database \(param) that is currently open. Close it prior to deletion"
  }
}

internal class DatabaseNotFoundException: GenericException<String> {
  override var code: String {
    "E_SQLITE_DELETE_DATABASE"
  }

  override var reason: String {
    "Database \(param) not found"
  }
}

internal class DeleteDatabaseFileException: GenericException<String> {
  override var code: String {
    "E_SQLITE_DELETE_DATABASE"
  }

  override var reason: String {
    "Unable to delete the database file for \(param) database"
  }
}

internal class InvalidSqlException: Exception {
  override var reason: String {
    "sql argument must be a string"
  }
}

internal class InvalidArgumentsException: Exception {
  override var reason: String {
    "args must be an array"
  }
}
