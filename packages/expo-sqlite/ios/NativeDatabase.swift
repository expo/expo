// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

final class NativeDatabase: SharedRef<OpaquePointer?>, Equatable, Hashable {
  let databaseName: String
  let openOptions: OpenDatabaseOptions
  var isClosed = false

  init(_ pointer: OpaquePointer?, databaseName: String, openOptions: OpenDatabaseOptions) {
    self.databaseName = databaseName
    self.openOptions = openOptions
    super.init(pointer)
  }

  // MARK: - Equatable

  static func == (lhs: NativeDatabase, rhs: NativeDatabase) -> Bool {
    return lhs.pointer == rhs.pointer
  }

  // MARK: - Hashable

  func hash(into hasher: inout Hasher) {
    hasher.combine(pointer)
  }
}
