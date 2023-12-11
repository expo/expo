// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

final class NativeDatabase: SharedRef<OpaquePointer?>, Equatable, Hashable {
  let dbName: String
  let openOptions: OpenDatabaseOptions
  var isClosed = false

  init(_ pointer: OpaquePointer?, dbName: String, openOptions: OpenDatabaseOptions) {
    self.dbName = dbName
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
