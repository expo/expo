// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

struct OpenDatabaseOptions: Record, Equatable {
  @Field
  var enableCRSQLite: Bool = false

  @Field
  var enableChangeListener: Bool = false

  @Field
  var useNewConnection: Bool = false

  @Field
  var finalizeUnusedStatementsBeforeClosing: Bool = true

  // MARK: - Equatable

  static func == (lhs: OpenDatabaseOptions, rhs: OpenDatabaseOptions) -> Bool {
    return lhs.enableCRSQLite == rhs.enableCRSQLite &&
      lhs.enableChangeListener == rhs.enableChangeListener &&
      lhs.useNewConnection == rhs.useNewConnection &&
      lhs.finalizeUnusedStatementsBeforeClosing == rhs.finalizeUnusedStatementsBeforeClosing
  }
}
