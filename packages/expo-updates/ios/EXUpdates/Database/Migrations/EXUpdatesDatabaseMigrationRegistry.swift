//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

internal final class EXUpdatesDatabaseMigrationRegistry {
  public static func migrations() -> [EXUpdatesDatabaseMigration] {
    // migrations should be added here in the order they should be performed (e.g. oldest first)
    return [
      EXUpdatesDatabaseMigration4To5(),
      EXUpdatesDatabaseMigration5To6(),
      EXUpdatesDatabaseMigration6To7(),
      EXUpdatesDatabaseMigration7To8(),
      EXUpdatesDatabaseMigration8To9()
    ]
  }
}
