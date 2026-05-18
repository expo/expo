// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import CryptoKit
import ExpoModulesCore

/// One cached representation of a URL. A single URL may produce multiple
/// variants when the server's `Vary` header indicates the response differs by
/// request headers (e.g. `Vary: Authorization`).
struct CacheVariant: Codable {
  /// Suffix appended to the URL hash to derive the on-disk filename.
  let storageKey: String
  /// Header names the server's `Vary` listed for this response (lowercase, sorted).
  let varyHeaders: [String]
  /// The request-header values that produced this stored response, used to match
  /// subsequent requests against this variant.
  let varyValues: [String: String]
  /// Per RFC 9111 §3.5: whether this response may be reused for an
  /// `Authorization`-bearing request not already disambiguated by `Vary`.
  let allowsAuthorizedReuse: Bool
}

/// Per-URL on-disk index of cached variants. Each variant points to a stored
/// response file via its `storageKey`. Variant selection encodes both the
/// HTTP `Vary` rules and the §3.5 `Authorization` reuse restriction.
enum CacheVariantIndex {
  static let fileSuffix = ".variants"
  private static let authorizationHeader = "authorization"
  /// Headers that imply a distinct identity. Used to derive the storage key
  /// for the first request to a URL, before the server has revealed a `Vary`.
  private static let provisionalIdentityHeaders = ["authorization", "cookie", "proxy-authorization"]

  static func indexPath(forUrl url: URL) -> String? {
    guard var directory = try? FileManager.default.url(
      for: .cachesDirectory,
      in: .userDomainMask,
      appropriateFor: nil,
      create: true
    ) else {
      return nil
    }
    directory.appendPathComponent(VideoCacheManager.expoVideoCacheScheme, isDirectory: true)
    directory.appendPathComponent(urlHash(url) + Self.fileSuffix)
    return directory.path
  }

  static func load(forUrl url: URL) -> [CacheVariant] {
    guard let path = indexPath(forUrl: url),
      FileManager.default.fileExists(atPath: path),
      let data = FileManager.default.contents(atPath: path) else {
      return []
    }
    return (try? JSONDecoder().decode([CacheVariant].self, from: data)) ?? []
  }

  /// Returns the storage key for the variant that matches this request, or
  /// derives a provisional one when no variant matches yet.
  static func storageKey(forUrl url: URL, requestHeaders: [String: String]?) -> String {
    let normalized = normalize(headers: requestHeaders)
    if let variant = matchingVariant(forUrl: url, normalizedHeaders: normalized) {
      return variant.storageKey
    }
    return provisionalStorageKey(normalizedHeaders: normalized)
  }

  static func recordVariant(
    forUrl url: URL,
    storageKey: String,
    requestHeaders: [String: String]?,
    policy: CachePolicy
  ) {
    guard policy.isCacheable else { return }
    let normalized = normalize(headers: requestHeaders)
    let varyValues = Dictionary(uniqueKeysWithValues:
      policy.varyHeaders.map { ($0, normalized[$0] ?? "") }
    )
    let variant = CacheVariant(
      storageKey: storageKey,
      varyHeaders: policy.varyHeaders,
      varyValues: varyValues,
      allowsAuthorizedReuse: policy.allowsAuthorizedReuse
    )
    var existing = load(forUrl: url)
    existing.removeAll { $0.storageKey == storageKey }
    existing.append(variant)
    save(variants: existing, forUrl: url)
  }

  private static func matchingVariant(forUrl url: URL, normalizedHeaders: [String: String]) -> CacheVariant? {
    let hasAuthorization = normalizedHeaders[authorizationHeader] != nil
    for variant in load(forUrl: url) {
      let allMatch = variant.varyHeaders.allSatisfy { name in
        (normalizedHeaders[name] ?? "") == (variant.varyValues[name] ?? "")
      }
      guard allMatch else { continue }
      // §3.5 only matters when Authorization isn't already separating variants.
      let authHandledByVary = variant.varyHeaders.contains(authorizationHeader)
      if hasAuthorization && !authHandledByVary && !variant.allowsAuthorizedReuse {
        continue
      }
      return variant
    }
    return nil
  }

  private static func provisionalStorageKey(normalizedHeaders: [String: String]) -> String {
    let composite = Self.provisionalIdentityHeaders
      .sorted()
      .map { "\($0):\(normalizedHeaders[$0] ?? "")" }
      .joined(separator: ";")
    return sha256(composite)
  }

  private static func normalize(headers: [String: String]?) -> [String: String] {
    var out: [String: String] = [:]
    for (key, value) in headers ?? [:] {
      out[key.lowercased()] = value
    }
    return out
  }

  private static func save(variants: [CacheVariant], forUrl url: URL) {
    guard let path = indexPath(forUrl: url),
      let data = try? JSONEncoder().encode(variants) else {
      return
    }
    let parentDir = URL(fileURLWithPath: path).deletingLastPathComponent()
    try? FileManager.default.createDirectory(at: parentDir, withIntermediateDirectories: true)
    try? data.write(to: URL(fileURLWithPath: path), options: .atomic)
  }

  private static func urlHash(_ url: URL) -> String {
    return sha256(url.absoluteString)
  }

  private static func sha256(_ input: String) -> String {
    return SHA256.hash(data: Data(input.utf8))
      .compactMap { String(format: "%02x", $0) }
      .joined()
  }
}
