// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum ErrorScreenLogMessage {
  static func make(header: String?, detail: String?, fixInstructions: String?) -> String? {
    guard let detail, !detail.isEmpty else {
      return nil
    }
    var parts: [String] = []
    if let header, !header.isEmpty {
      parts.append(header)
    }
    parts.append(detail.replacingOccurrences(of: "**", with: ""))
    if let fixInstructions, !fixInstructions.isEmpty {
      parts.append("How to fix this error:\n\n\(fixInstructions)")
    }
    return parts.joined(separator: "\n\n")
  }
}
