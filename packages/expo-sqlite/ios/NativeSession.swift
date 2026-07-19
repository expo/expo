// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

final class NativeSession: SharedObject, Equatable {
  var pointer: OpaquePointer?

  // MARK: - Equatable

  static func == (lhs: NativeSession, rhs: NativeSession) -> Bool {
    return lhs.pointer == rhs.pointer
  }
}
