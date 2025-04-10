// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

struct OpenDatabaseOptions: Record, Equatable {
  @Field
  var enableChangeListener: Bool = false

  @Field
  var useNewConnection: Bool = false

  @Field
  var finalizeUnusedStatementsBeforeClosing: Bool = true

  @Field
  var libSQLUrl: URL?

  @Field
  var libSQLAuthToken: String?

  @Field
  var libSQLRemoteOnly: Bool = false

  // MARK: - Equatable

  static func == (lhs: OpenDatabaseOptions, rhs: OpenDatabaseOptions) -> Bool {
    return lhs.enableChangeListener == rhs.enableChangeListener &&
      lhs.useNewConnection == rhs.useNewConnection &&
      lhs.finalizeUnusedStatementsBeforeClosing == rhs.finalizeUnusedStatementsBeforeClosing &&
      lhs.libSQLUrl == rhs.libSQLUrl &&
      lhs.libSQLAuthToken == rhs.libSQLAuthToken &&
      lhs.libSQLRemoteOnly == rhs.libSQLRemoteOnly
  }
}
