// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum HighlightPolicy {
  private static let maxByteCount = 200_000
  private static let maxLineLength = 2_000

  static func shouldHighlight(_ text: String) -> Bool {
    if text.utf8.count > maxByteCount {
      return false
    }
    // A single very long line (minified bundle) is the worst case for layout.
    var lineLength = 0
    for scalar in text.unicodeScalars {
      if scalar == "\n" {
        lineLength = 0
      } else {
        lineLength += 1
        if lineLength > maxLineLength {
          return false
        }
      }
    }
    return true
  }
}
