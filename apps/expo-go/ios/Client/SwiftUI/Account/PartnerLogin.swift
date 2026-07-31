// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Helpers for the single-use login code that partners attach to the QR code URL they render
/// alongside a project. Expo Go on iOS has no scanner, so the code arrives as a query param on a
/// URL handed over by the system Camera app.
@objc(EXPartnerLogin)
public final class PartnerLogin: NSObject {
  @objc public static let queryParamName = "partner-login-code"

  private override init() {
    super.init()
  }

  @objc(loginCodeFromURL:)
  public static func loginCode(from url: URL) -> String? {
    guard let queryItems = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems,
          let code = queryItems.first(where: { $0.name == queryParamName })?.value,
          !code.isEmpty else {
      return nil
    }
    return code
  }

  @objc(urlByRemovingLoginCodeFromURL:)
  public static func urlByRemovingLoginCode(from url: URL) -> URL {
    guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false),
          let queryItems = components.percentEncodedQueryItems else {
      return url
    }

    let remaining = queryItems.filter { $0.name != queryParamName }
    guard remaining.count != queryItems.count else {
      return url
    }

    components.percentEncodedQueryItems = remaining.isEmpty ? nil : remaining
    return components.url ?? url
  }

  /// The API returns fractional seconds, which `JSONDecoder`'s `.iso8601` strategy rejects.
  static func parseExpiry(_ value: String) -> Date? {
    let withFractionalSeconds = ISO8601DateFormatter()
    withFractionalSeconds.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let date = withFractionalSeconds.date(from: value) {
      return date
    }

    let withoutFractionalSeconds = ISO8601DateFormatter()
    withoutFractionalSeconds.formatOptions = [.withInternetDateTime]
    return withoutFractionalSeconds.date(from: value)
  }
}
