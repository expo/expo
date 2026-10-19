// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import UIKit

/// Both calls are unauthenticated.
enum DeviceLoginService {
  static let clientId = "expo-go"

  static func requestAuthorization() async throws -> DeviceAuthorization {
    let info = deviceInfo()
    let response: DeviceAuthorizationResponse = try await RESTClient.shared.post(
      path: "auth/device_authorization",
      body: DeviceAuthorizationRequest(
        clientId: clientId,
        deviceName: info.name,
        devicePlatform: info.platform,
        deviceOsVersion: info.osVersion,
        deviceAppVersion: info.appVersion
      )
    )
    return response.data
  }

  static func poll(deviceCode: String, matchValue: String?) async throws -> TokenOutcome {
    let response: DeviceTokenResponse = try await RESTClient.shared.post(
      path: "auth/token",
      body: DeviceTokenRequest(
        clientId: clientId,
        deviceCode: deviceCode,
        matchValue: matchValue
      )
    )
    return TokenOutcome(payload: response.data)
  }

  /// Shown on the verification page to confirm the device asking to sign in. `UIDevice.current.name` returns a generic name on iOS 16+ without the entitlement.
  static func deviceInfo() -> (name: String?, platform: String, osVersion: String, appVersion: String?) {
    return (
      name: UIDevice.current.name,
      platform: "ios",
      osVersion: UIDevice.current.systemVersion,
      appVersion: Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
    )
  }
}
