//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation
import SQLite3

internal final class UpdatesDatabaseMigration7To8: UpdatesDatabaseMigration {
  private(set) var filename: String = "expo-v7.db"

  func runMigration(onDatabase db: OpaquePointer) throws {
    // https://www.sqlite.org/lang_altertable.html#otheralter
    let sql = """
      ALTER TABLE "assets" ADD COLUMN "extra_request_headers" TEXT
    """

    guard sqlite3_exec(db, String(sql.utf8), nil, nil, nil) == SQLITE_OK else {
      throw UpdatesDatabaseMigrationError.migrationSQLError
    }
  }
}
