//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation
import SQLite3

internal final class EXUpdatesDatabaseMigration8To9: EXUpdatesDatabaseMigration {
  public private(set) var filename: String = "expo-v8.db"

  public func runMigration(onDatabase db: OpaquePointer) throws {
    // https://www.sqlite.org/lang_altertable.html#otheralter
    let sql = """
      ALTER TABLE "assets" ADD COLUMN "expected_hash" TEXT
    """

    guard sqlite3_exec(db, String(sql.utf8), nil, nil, nil) == SQLITE_OK else {
      throw EXUpdatesDatabaseMigrationError.migrationSQLError
    }
  }
}
