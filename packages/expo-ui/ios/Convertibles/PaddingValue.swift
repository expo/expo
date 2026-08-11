// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

/**
 The amount of padding applied to a single edge. The system default padding has no fixed length —
 SwiftUI resolves it at layout time — so it is kept as a separate case instead of a number.
 */
internal enum PaddingValue: Convertible {
  case auto
  case points(CGFloat)

  private static let autoKeyword = "auto"

  static func convert(from value: Any?, appContext: AppContext) throws -> PaddingValue {
    if let value = value as? String {
      guard value == autoKeyword else {
        throw InvalidPaddingValueException(value)
      }
      return .auto
    }

    if let value = value as? Double {
      return .points(CGFloat(value))
    }

    if let value = value as? Int {
      return .points(CGFloat(value))
    }
    throw InvalidPaddingValueException(String(describing: value))
  }

  /**
   The explicit length in points, or `nil` when the edge uses the system default padding.
   */
  var length: CGFloat? {
    if case .points(let length) = self {
      return length
    }
    return nil
  }

  var isAuto: Bool {
    if case .auto = self {
      return true
    }
    return false
  }
}

internal final class InvalidPaddingValueException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Padding edge value '\(param)' is neither a length nor a keyword, so the padding modifier cannot be applied. "
      + "Pass a number of points, such as padding({ top: 16 }), or 'auto' to use the system default padding for that edge."
  }
}
