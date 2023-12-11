// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

enum SQLAction: String, Enumerable {
  case insert
  case delete
  case update
  case unknown

  static func fromCode(value: Int32) -> SQLAction {
    switch value {
    case 9:
      return .delete
    case 18:
      return .insert
    case 23:
      return .update
    default:
      return .unknown
    }
  }
}
