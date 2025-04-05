// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

final class NativeDatabase: SharedObject, Equatable, Hashable {
  var pointer: OpaquePointer?
  let databasePath: String
  let openOptions: OpenDatabaseOptions
  var isClosed = false
  var extraPointer: OpaquePointer?
  private var refCount = AtomicInteger(1)

  init(_ pointer: OpaquePointer?, databasePath: String, openOptions: OpenDatabaseOptions) {
    self.pointer = pointer
    self.databasePath = databasePath
    self.openOptions = openOptions
  }

  @discardableResult
  func addRef() -> Int {
    return refCount.increment()
  }

  @discardableResult
  func release() -> Int {
    return refCount.decrement()
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
