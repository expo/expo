// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/** The `__expo_device_*` params of a launch URL. Separate from the POST so the parse is unit-testable. */
internal struct DeviceLoginRequest: Equatable {
  let deviceCode: String
  let matchValue: String
  let clientId: String

  internal static func parse(_ url: URL) -> DeviceLoginRequest? {
    let queryItems = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
    func query(_ name: String) -> String? {
      guard let value = queryItems.first(where: { $0.name == name })?.value, !value.isEmpty else {
        return nil
      }
      return value
    }

    guard let deviceCode = query("__expo_device_code"),
          let matchValue = query("__expo_device_match"),
          let clientId = query("__expo_device_client") else {
      return nil
    }
    return DeviceLoginRequest(deviceCode: deviceCode, matchValue: matchValue, clientId: clientId)
  }
}

/**
 * Signs the launcher in from a launch URL. The tool that opens the URL (Expo CLI, Expo Orbit)
 * creates an OAuth device code and approves it with its own session; the launcher exchanges the
 * code for a session of its own. Every failure is silent: the launch continues signed out.
 */
@objc(EXDevLauncherDeviceLogin)
public class EXDevLauncherDeviceLogin: NSObject {
  static let didSignInNotification = Notification.Name("EXDevLauncherDeviceLoginDidSignIn")

  @objc public static func handle(_ url: URL) {
    // Simulator only: on a device, a link from another app could sign the launcher in to the
    // sender's account.
    #if targetEnvironment(simulator)
    guard UserDefaults.standard.string(forKey: sessionKey) == nil,
          let request = DeviceLoginRequest.parse(url) else {
      return
    }

    Task {
      guard let sessionSecret = try? await exchange(request) else {
        return
      }
      UserDefaults.standard.set(sessionSecret, forKey: sessionKey)
      NotificationCenter.default.post(name: didSignInNotification, object: nil)
    }
    #endif
  }

  private static func exchange(_ request: DeviceLoginRequest) async throws -> String? {
    guard let url = URL(string: "\(APIClient.shared.apiOrigin)/v2/auth/token") else {
      return nil
    }
    var urlRequest = URLRequest(url: url)
    urlRequest.httpMethod = "POST"
    urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
    urlRequest.httpBody = try JSONSerialization.data(withJSONObject: [
      "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
      "client_id": request.clientId,
      "device_code": request.deviceCode,
      "match_value": request.matchValue
    ])
    urlRequest.timeoutInterval = 10

    let (data, _) = try await URLSession.shared.data(for: urlRequest)
    let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
    return (json?["data"] as? [String: Any])?["session_secret"] as? String
  }
}
