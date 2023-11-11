// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

final class NativeStatement: SharedObject, Equatable {
  var pointer: OpaquePointer?

  // MARK: - Equatable

  static func == (lhs: NativeStatement, rhs: NativeStatement) -> Bool {
    return lhs.pointer == rhs.pointer
  }
}
