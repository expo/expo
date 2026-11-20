// Copyright 2015-present 650 Industries. All rights reserved.

#if os(tvOS)
import Foundation
import UIKit

/**
 Client for the EAS device authorization flow (OAuth 2.0 device grant), used on tvOS where
 there is no browser for `ASWebAuthenticationSession`. The user approves the request on another
 device, then picks the number shown in their browser on the TV.
 */
struct DeviceAuthClient {
  // Only `eas-cli` is a registered client today. A dedicated dev launcher client ID is needed
  // before this ships.
  private static let clientId = "eas-cli"
  private static let deviceCodeGrantType = "urn:ietf:params:oauth:grant-type:device_code"

  struct Grant {
    let deviceCode: String
    let userCode: String
    let verificationURL: URL
    let expiresAt: Date
    let interval: TimeInterval

    var verificationURLWithCode: URL {
      guard var components = URLComponents(url: verificationURL, resolvingAgainstBaseURL: false) else {
        return verificationURL
      }
      components.queryItems = (components.queryItems ?? []) + [URLQueryItem(name: "user_code", value: userCode)]
      return components.url ?? verificationURL
    }
  }

  enum TokenResult {
    case authenticated(sessionSecret: String)
    case pending
    case slowDown
    case matchingRequired(options: [String])
    case failed(reason: String)
  }

  @MainActor
  func startAsync() async throws -> Grant {
    let device = UIDevice.current
    let data = try await postAsync("device_authorization", body: [
      "device_name": String(device.name.prefix(255)),
      "device_platform": "tvos",
      "device_os_version": String(device.systemVersion.prefix(64))
    ])

    guard let deviceCode = data["device_code"] as? String,
      let userCode = data["user_code"] as? String,
      let verificationURI = data["verification_uri"] as? String,
      let verificationURL = URL(string: verificationURI),
      let expiresIn = data["expires_in"] as? Double,
      let interval = data["interval"] as? Double else {
      throw DeviceAuthError.unexpectedResponse
    }

    return Grant(
      deviceCode: deviceCode,
      userCode: userCode,
      verificationURL: verificationURL,
      expiresAt: Date().addingTimeInterval(expiresIn),
      interval: max(5, interval)
    )
  }

  func pollAsync(grant: Grant, match: String? = nil) async throws -> TokenResult {
    var body: [String: Any] = [
      "grant_type": Self.deviceCodeGrantType,
      "device_code": grant.deviceCode
    ]
    if let match {
      body["match_value"] = match
    }

    let data: [String: Any]
    do {
      data = try await postAsync("token", body: body)
    } catch DeviceAuthError.rateLimited {
      return .slowDown
    }

    if let sessionSecret = data["session_secret"] as? String {
      return .authenticated(sessionSecret: sessionSecret)
    }

    switch data["error"] as? String {
    case "authorization_pending":
      return .pending
    case "slow_down":
      return .slowDown
    case "matching_required":
      guard let options = data["match_options"] as? [String], !options.isEmpty else {
        throw DeviceAuthError.unexpectedResponse
      }
      return .matchingRequired(options: options)
    case "access_denied":
      return .failed(reason: "The login request was denied.")
    case "expired_token":
      return .failed(reason: "The login code expired.")
    case "invalid_grant":
      return .failed(reason: "The login request is no longer valid.")
    default:
      throw DeviceAuthError.unexpectedResponse
    }
  }

  private func postAsync(_ endpoint: String, body: [String: Any]) async throws -> [String: Any] {
    guard let url = URL(string: "\(APIClient.shared.apiOrigin)/v2/auth/\(endpoint)") else {
      throw APIError.invalidURL
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.timeoutInterval = 30
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try JSONSerialization.data(
      withJSONObject: body.merging(["client_id": Self.clientId]) { current, _ in current }
    )

    let (responseData, response) = try await URLSession.shared.data(for: request)
    if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 429 {
      throw DeviceAuthError.rateLimited
    }

    guard let json = try JSONSerialization.jsonObject(with: responseData) as? [String: Any] else {
      throw DeviceAuthError.unexpectedResponse
    }
    if let data = json["data"] as? [String: Any] {
      return data
    }
    if let errors = json["errors"] as? [[String: Any]],
      let message = errors.first?["message"] as? String {
      throw DeviceAuthError.server(message: message)
    }
    throw DeviceAuthError.unexpectedResponse
  }
}

enum DeviceAuthError: LocalizedError {
  case unexpectedResponse
  case rateLimited
  case server(message: String)

  var errorDescription: String? {
    switch self {
    case .unexpectedResponse:
      return "Unexpected response from EAS. Try again."
    case .rateLimited:
      return "Too many requests. Try again in a minute."
    case .server(let message):
      return message
    }
  }
}
#endif
