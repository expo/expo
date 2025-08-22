//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

internal final class UpdatesDatabaseMigrationRegistry {
  static func migrations() -> [UpdatesDatabaseMigration] {
    // migrations should be added here in the order they should be performed (e.g. oldest first)
    return [
      UpdatesDatabaseMigration4To5(),
      UpdatesDatabaseMigration5To6(),
      UpdatesDatabaseMigration6To7(),
      UpdatesDatabaseMigration7To8(),
      UpdatesDatabaseMigration8To9(),
      UpdatesDatabaseMigration9To10(),
      UpdatesDatabaseMigration10To11()
    ]
  }
}
