// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

func normalizeUrl(_ url: String) -> String {
  guard let urlComponents = URLComponents(string: url) else {
    return url
  }

  // Build URL without scheme
  var components: [String] = []
  if let host = urlComponents.host {
    components.append(host)
  }
  if let port = urlComponents.port {
    components.append(":\(port)")
  }
  components.append(urlComponents.path)
  if let query = urlComponents.query {
    components.append("?\(query)")
  }

  return components.joined()
}

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

func toExpURLString(_ url: URL) -> String {
  guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
    return url.absoluteString
  }

  if let scheme = components.scheme?.lowercased(), scheme == "exp" || scheme == "exps" {
    return url.absoluteString
  }

  if let scheme = components.scheme?.lowercased(), scheme == "http" || scheme == "https" {
    components.scheme = "exp"
    return components.url?.absoluteString ?? url.absoluteString
  }

  return url.absoluteString
}
