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
  /// Caller/application identity headers that must not be reused across values,
  /// even when the server did not list them in `Vary`.
  let identityValues: [String: String]
  /// File extension used by this variant's data file.
  let fileExtension: String?
  /// Per RFC 9111 §3.5: whether this response may be reused for an
  /// `Authorization`-bearing request not already disambiguated by `Vary`.
  let allowsAuthorizedReuse: Bool

  enum CodingKeys: String, CodingKey {
    case storageKey, varyHeaders, varyValues, identityValues, fileExtension, allowsAuthorizedReuse
  }

  init(
    storageKey: String,
    varyHeaders: [String],
    varyValues: [String: String],
    identityValues: [String: String],
    fileExtension: String? = nil,
    allowsAuthorizedReuse: Bool
  ) {
    self.storageKey = storageKey
    self.varyHeaders = varyHeaders
    self.varyValues = varyValues
    self.identityValues = identityValues
    self.fileExtension = fileExtension
    self.allowsAuthorizedReuse = allowsAuthorizedReuse
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    storageKey = try container.decode(String.self, forKey: .storageKey)
    varyHeaders = try container.decode([String].self, forKey: .varyHeaders)
    varyValues = try container.decode([String: String].self, forKey: .varyValues)
    identityValues = try container.decodeIfPresent([String: String].self, forKey: .identityValues) ?? [:]
    fileExtension = try container.decodeIfPresent(String.self, forKey: .fileExtension)
    allowsAuthorizedReuse = try container.decodeIfPresent(Bool.self, forKey: .allowsAuthorizedReuse) ?? false
  }
}

/// Per-URL on-disk index of cached variants. Each variant points to a stored
/// response file via its `storageKey`. Variant selection encodes both the
/// HTTP `Vary` rules and the §3.5 `Authorization` reuse restriction.
enum CacheVariantIndex {
  static let fileSuffix = ".variants"
  private static let queue = DispatchQueue(label: "expo.video.cache.variants")
  private static let authorizationHeader = "authorization"
  /// Headers that must never be reused across differing identities.
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
    return queue.sync {
      pruneMissingVariantsUnlocked(forUrl: url, fileExtension: nil, variants: loadUnlocked(forUrl: url))
    }
  }

  private static func loadUnlocked(forUrl url: URL) -> [CacheVariant] {
    guard let path = indexPath(forUrl: url),
      FileManager.default.fileExists(atPath: path),
      let data = FileManager.default.contents(atPath: path) else {
      return []
    }
    return (try? JSONDecoder().decode([CacheVariant].self, from: data)) ?? []
  }

  /// Returns the storage key for the variant that matches this request, or
  /// derives a provisional one when no variant matches yet.
  static func storageKey(
    forUrl url: URL,
    requestHeaders: [String: String]?,
    fileExtension: String? = nil
  ) -> String {
    let normalized = normalizedRequestHeaders(forUrl: url, requestHeaders: requestHeaders)
    return queue.sync {
      let variants = pruneMissingVariantsUnlocked(
        forUrl: url,
        fileExtension: fileExtension,
        variants: loadUnlocked(forUrl: url)
      )
      if let variant = matchingVariant(variants: variants, normalizedHeaders: normalized) {
        return variant.storageKey
      }
      let knownVaryHeaders = variants.flatMap { $0.varyHeaders }
      return provisionalStorageKey(
        normalizedHeaders: normalized,
        knownVaryHeaders: knownVaryHeaders,
        hasExistingVariants: !variants.isEmpty
      )
    }
  }

  static func recordVariant(
    forUrl url: URL,
    storageKey: String,
    requestHeaders: [String: String]?,
    fileExtension: String? = nil,
    policy: CachePolicy
  ) {
    guard policy.isCacheable else {
      return
    }
    let normalized = normalizedRequestHeaders(forUrl: url, requestHeaders: requestHeaders)
    let varyValues = Dictionary(uniqueKeysWithValues:
      policy.varyHeaders.map { ($0, normalized[$0] ?? "") }
    )
    let variant = CacheVariant(
      storageKey: storageKey,
      varyHeaders: policy.varyHeaders,
      varyValues: varyValues,
      identityValues: identityValues(normalizedHeaders: normalized),
      fileExtension: fileExtension,
      allowsAuthorizedReuse: policy.allowsAuthorizedReuse
    )
    queue.sync {
      var existing = loadUnlocked(forUrl: url)
      existing.removeAll { $0.storageKey == storageKey }
      existing.append(variant)
      saveUnlocked(variants: existing, forUrl: url)
    }
  }

  static func hasIdentityHeaders(_ normalizedHeaders: [String: String]) -> Bool {
    return Self.provisionalIdentityHeaders.contains { normalizedHeaders[$0] != nil }
  }

  private static func matchingVariant(variants: [CacheVariant], normalizedHeaders: [String: String]) -> CacheVariant? {
    let hasAuthorization = normalizedHeaders[authorizationHeader] != nil
    for variant in variants {
      let allMatch = variant.varyHeaders.allSatisfy { name in
        (normalizedHeaders[name] ?? "") == (variant.varyValues[name] ?? "")
      }
      guard allMatch else {
        continue
      }
      let identityMatch = variant.identityValues.allSatisfy { name, value in
        (normalizedHeaders[name] ?? "") == value
      }
      guard identityMatch else {
        continue
      }
      let identityHandledByVariant = variant.identityValues[authorizationHeader] != nil
      if hasAuthorization && !identityHandledByVariant && !variant.allowsAuthorizedReuse {
        continue
      }
      return variant
    }
    return nil
  }

  private static func provisionalStorageKey(
    normalizedHeaders: [String: String],
    knownVaryHeaders: [String],
    hasExistingVariants: Bool
  ) -> String {
    let headers = Array(
      Set(Self.provisionalIdentityHeaders + knownVaryHeaders.map { $0.lowercased() })
    ).sorted()
    let hasVariantInput = hasExistingVariants ||
      !knownVaryHeaders.isEmpty ||
      Self.provisionalIdentityHeaders.contains { normalizedHeaders[$0] != nil }
    if !hasVariantInput {
      // Preserve the pre-variant URL-only cache filename for anonymous videos
      // so existing offline downloads remain playable after upgrading.
      return ""
    }
    let composite = headers
      .map { "\($0):\(normalizedHeaders[$0] ?? "")" }
      .joined(separator: ";")
    return sha256(composite)
  }

  /// Normalizes request headers (lowercased keys) used for variant matching.
  ///
  /// On iOS we additionally fold in cookies from `HTTPCookieStorage.shared` when
  /// the caller didn't pass an explicit `Cookie` header, so cookie-authenticated
  /// videos get isolated variants. Android does not do this — it only considers
  /// cookies passed explicitly in `VideoSource.headers` (OkHttp's default has no
  /// cookie jar). The asymmetry is intentional.
  ///
  /// Note the offline trade-off: because cookies are part of the variant
  /// identity, a rotated/expired session cookie changes the key, so an
  /// offline-downloaded cookie-authenticated video may no longer match after the
  /// cookie changes. This is the correct behavior for cross-identity isolation,
  /// but callers relying on offline playback should prefer stable auth headers.
  static func normalizedRequestHeaders(forUrl url: URL, requestHeaders: [String: String]?) -> [String: String] {
    var out: [String: String] = [:]
    for (key, value) in requestHeaders ?? [:] {
      out[key.lowercased()] = value
    }
    if out["cookie"] == nil,
      let cookies = HTTPCookieStorage.shared.cookies(for: url),
      !cookies.isEmpty {
      let cookieHeaders = HTTPCookie.requestHeaderFields(with: cookies)
      if let cookie = cookieHeaders["Cookie"], !cookie.isEmpty {
        out["cookie"] = cookie
      }
    }
    return out
  }

  private static func identityValues(normalizedHeaders: [String: String]) -> [String: String] {
    return Dictionary(uniqueKeysWithValues:
      Self.provisionalIdentityHeaders.compactMap { name in
        guard let value = normalizedHeaders[name] else {
          return nil
        }
        return (name, value)
      }
    )
  }

  private static func pruneMissingVariantsUnlocked(
    forUrl url: URL,
    fileExtension: String?,
    variants: [CacheVariant]
  ) -> [CacheVariant] {
    let live = variants.filter { variant in
      guard let ext = variant.fileExtension ?? fileExtension else {
        return true
      }
      guard let path = VideoAsset.pathForUrl(url: url, fileExtension: ext, variantKey: variant.storageKey) else {
        return true
      }
      return FileManager.default.fileExists(atPath: path) ||
        FileManager.default.fileExists(atPath: path + VideoCacheManager.mediaInfoSuffix)
    }
    if live.count != variants.count {
      saveUnlocked(variants: live, forUrl: url)
    }
    return live
  }

  private static func saveUnlocked(variants: [CacheVariant], forUrl url: URL) {
    guard let path = indexPath(forUrl: url) else {
      return
    }
    if variants.isEmpty {
      try? FileManager.default.removeItem(atPath: path)
      return
    }
    guard let data = try? JSONEncoder().encode(variants) else {
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
