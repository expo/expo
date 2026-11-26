// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal enum ContentInsetAdjustmentBehavior: String, Enumerable {
  case automatic
  case scrollableAxes
  case never
  case always

  func toContentInsetAdjustmentBehavior() -> UIScrollView.ContentInsetAdjustmentBehavior {
    switch self {
    case .automatic:
      return .automatic
    case .scrollableAxes:
      return .scrollableAxes
    case .never:
      return .never
    case .always:
      return .always
    }
  }
}
