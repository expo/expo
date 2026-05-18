// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation

/// Result of evaluating a response against RFC 9111 caching semantics, used to
/// decide how a video response may be reused across requests.
struct CachePolicy {
  /// Header names listed by the response's `Vary` header, lowercased and sorted.
  /// Excludes `*`; presence of `*` instead sets `isCacheable` to `false`.
  let varyHeaders: [String]

  /// `false` when the response opts out of storage entirely:
  /// non-2xx status, `Vary: *`, or `Cache-Control: no-store` / `private`.
  let isCacheable: Bool

  /// RFC 9111 §3.5: when a request bears `Authorization`, a stored response may
  /// only be reused if the response carries `public`, `s-maxage`, or
  /// `must-revalidate`. This precomputes that decision for the response.
  let allowsAuthorizedReuse: Bool

  static func evaluate(responseHeaders: [String: String], statusCode: Int) -> CachePolicy {
    // Only the success codes a video player can play back are worth caching.
    // Caching a 401/500 would lock the user into a stale error.
    guard statusCode == 200 || statusCode == 206 else {
      return CachePolicy(varyHeaders: [], isCacheable: false, allowsAuthorizedReuse: false)
    }

    let vary = splitRespectingQuotes(headerValue(responseHeaders, name: "vary"))
    let cacheControl = directiveNames(in: splitRespectingQuotes(headerValue(responseHeaders, name: "cache-control")))

    // `private` excludes shared caches (RFC 9111 §5.2.2.7). Our cache straddles
    // multiple identities on one device, so we treat ourselves as shared.
    if vary.contains("*") || cacheControl.contains("no-store") || cacheControl.contains("private") {
      return CachePolicy(varyHeaders: [], isCacheable: false, allowsAuthorizedReuse: false)
    }

    // Cache-Control is consulted only for the §3.5 reuse decision below.
    // Freshness directives (`max-age`, `Expires`, `Age`) and conditional
    // revalidation (`If-None-Match`/`Last-Modified`) are not implemented; cached
    // responses live until LRU eviction.
    let allowsAuth = cacheControl.contains("public")
      || cacheControl.contains("must-revalidate")
      || cacheControl.contains("s-maxage")

    let normalizedVary = vary.map { $0.lowercased() }.filter { $0 != "*" }.sorted()
    return CachePolicy(
      varyHeaders: Array(Set(normalizedVary)).sorted(),
      isCacheable: true,
      allowsAuthorizedReuse: allowsAuth
    )
  }

  private static func headerValue(_ headers: [String: String], name: String) -> String {
    let lower = name.lowercased()
    for (key, value) in headers where key.lowercased() == lower {
      return value
    }
    return ""
  }

  /// Splits a header value on `,` while treating commas inside double-quoted
  /// strings as literal. Required for directives like `private="X-Foo, X-Bar"`
  /// where a naive split would shred the quoted field-name list.
  private static func splitRespectingQuotes(_ value: String) -> [String] {
    var tokens: [String] = []
    var current = ""
    var inQuotes = false
    for char in value {
      if char == "\"" {
        inQuotes.toggle()
        current.append(char)
      } else if char == "," && !inQuotes {
        let trimmed = current.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmed.isEmpty { tokens.append(trimmed) }
        current.removeAll(keepingCapacity: true)
      } else {
        current.append(char)
      }
    }
    let trimmed = current.trimmingCharacters(in: .whitespacesAndNewlines)
    if !trimmed.isEmpty { tokens.append(trimmed) }
    return tokens
  }

  /// Extracts the directive name (the part before `=`) from each token. Values
  /// are intentionally dropped — the policy decisions above only need presence.
  private static func directiveNames(in tokens: [String]) -> Set<String> {
    var names: Set<String> = []
    for token in tokens {
      let nameEnd = token.firstIndex(of: "=") ?? token.endIndex
      let name = token[..<nameEnd].trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
      if !name.isEmpty { names.insert(name) }
    }
    return names
  }
}
