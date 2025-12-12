//  Copyright © 2025 650 Industries. All rights reserved.

import Foundation

func sanitizeUrlString(_ urlString: String) -> String? {
  var sanitizedUrl = urlString.trimmingCharacters(in: .whitespacesAndNewlines)

  if !sanitizedUrl.contains("://") {
    sanitizedUrl = "http://" + sanitizedUrl
  }

  guard URL(string: sanitizedUrl) != nil else {
    return nil
  }

  return sanitizedUrl
}
