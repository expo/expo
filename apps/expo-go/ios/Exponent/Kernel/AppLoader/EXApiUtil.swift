// Copyright 2015-present 650 Industries. All rights reserved.

import EXManifests

@objc(EXApiUtil)
@objcMembers
public class ApiUtil: NSObject {
  // NOTE(@kitten): Keep in sync with Android's `ExponentUrls.HTTPS_HOSTS`
  private static let httpsHosts = [
    "exp.host",
    "exponentjs.com",
    "u.expo.dev",
    "staging-u.expo.dev"
  ]

  public static func bundleUrlFromManifest(_ manifest: Manifest) -> URL? {
    return bundleUrlFromManifest(manifest, relativeTo: nil)
  }

  public static func bundleUrlFromManifest(_ manifest: Manifest, relativeTo manifestUrl: URL?) -> URL? {
    return self.encodedUrlFromString(manifest.bundleUrl(), relativeTo: manifestUrl)
  }

  public static func encodedUrlFromString(_ urlString: String) -> URL? {
    return encodedUrlFromString(urlString, relativeTo: nil)
  }

  public static func encodedUrlFromString(_ urlString: String, relativeTo baseUrl: URL?) -> URL? {
    let encodedUrlString = urlString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
    let normalizedBaseUrl = baseUrl.flatMap(normalizeExpoScheme)
    let resolvedUrl: URL?
    if let normalizedBaseUrl {
      resolvedUrl = URL(string: urlString, relativeTo: normalizedBaseUrl)?.absoluteURL
        ?? URL(string: encodedUrlString, relativeTo: normalizedBaseUrl)?.absoluteURL
    } else {
      resolvedUrl = URL(string: urlString) ?? URL(string: encodedUrlString)
    }
    return resolvedUrl.flatMap(normalizeExpoScheme)
  }

  /** Converts schemes to the http(s) schemes used to fetch their resources */
  private static func normalizeExpoScheme(_ url: URL) -> URL? {
    guard url.scheme == "exp" || url.scheme == "exps" else {
      return url
    }
    guard var components = URLComponents(url: url, resolvingAgainstBaseURL: true) else {
      return nil
    }
    components.scheme = url.scheme == "exps" || httpsHosts.contains(url.host ?? "") ? "https" : "http"
    return components.url
  }
}
