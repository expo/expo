// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

final class NativeStatement: SharedObject, Equatable {
  var pointer: OpaquePointer?
  var isFinalized = false
  var extraPointer: OpaquePointer?
  // The database that prepared this statement. Used by functions that do not
  // receive the database but must still lock the connection.
  weak var database: NativeDatabase?
  internal let lock = DispatchSemaphore(value: 1)

  // MARK: - Equatable

  static func == (lhs: NativeStatement, rhs: NativeStatement) -> Bool {
    return lhs.pointer == rhs.pointer
  }
}
