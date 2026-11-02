// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum EnterURLForm {
  static func canConnect(_ text: String) -> Bool {
    connectURL(text) != nil
  }

  static func connectURL(_ text: String) -> String? {
    let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else {
      return nil
    }
    return sanitizeUrlString(trimmed)
  }
}
