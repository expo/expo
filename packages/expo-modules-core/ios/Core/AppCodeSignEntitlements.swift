// Copyright 2015-present 650 Industries. All rights reserved.

/**
 App code signing entitlements passed from autolinking
 */
public struct AppCodeSignEntitlements: Codable {
  /**
   https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_security_application-groups
   */
  public var appGroups: [String]?

  /**
   Create an instance from JSON string.
   If passing an invalid JSON string, it creates default empty entitlements instead.
   */
  public static func from(json: String) -> AppCodeSignEntitlements {
    guard let data = json.data(using: .utf8) else {
      log.error("Invalid string encoding")
      return AppCodeSignEntitlements()
    }

    do {
      return try JSONDecoder().decode(AppCodeSignEntitlements.self, from: data)
    } catch {
      log.error("Unable to decode entitlement JSON data: \(error.localizedDescription)")
      return AppCodeSignEntitlements()
    }
  }
}
