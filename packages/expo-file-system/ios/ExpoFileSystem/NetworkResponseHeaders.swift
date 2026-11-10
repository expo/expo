// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation

extension HTTPURLResponse {
  func responseHeaders() -> [String: String] {
    allHeaderFields.reduce(into: [String: String]()) { result, item in
      if let key = item.key as? String, let value = item.value as? String {
        result[key] = value
      }
    }
  }
}
