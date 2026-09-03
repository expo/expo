// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// The QR is the dev server URL plus device auth params, since iOS has no scanner to add UI at scan time.
@objc(EXDeviceLoginLink)
public final class DeviceLoginLink: NSObject {
  @objc public static let promptParamName = "expo_go_prompt_device_auth"
  @objc public static let overrideParamName = "expo_go_device_auth_verification_uri_override"

  private override init() {
    super.init()
  }

  @objc(promptRequestedInURL:)
  public static func promptRequested(in url: URL) -> Bool {
    decodedQueryItems(of: url)?.first { $0.name == promptParamName }?.value == "1"
  }

  /// Only https with a real host is accepted, because the value is shown inside Expo Go's own UI.
  /// A rejected or absent override leaves the flow on the server's own verification page.
  @objc(verificationURIFromURL:)
  public static func verificationURI(from url: URL) -> URL? {
    guard let value = decodedQueryItems(of: url)?.first(where: { $0.name == overrideParamName })?.value,
          !value.isEmpty,
          let candidate = URL(string: value),
          candidate.scheme?.lowercased() == "https",
          let host = candidate.host,
          !host.isEmpty else {
      return nil
    }
    return candidate
  }

  @objc(urlByRemovingDeviceAuthParamsFromURL:)
  public static func urlByRemovingDeviceAuthParams(from url: URL) -> URL {
    guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false),
          let queryItems = components.percentEncodedQueryItems else {
      return url
    }

    let remaining = queryItems.filter { $0.name != promptParamName && $0.name != overrideParamName }
    guard remaining.count != queryItems.count else {
      return url
    }

    components.percentEncodedQueryItems = remaining.isEmpty ? nil : remaining
    return components.url ?? url
  }

  private static func decodedQueryItems(of url: URL) -> [URLQueryItem]? {
    URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems
  }
}
