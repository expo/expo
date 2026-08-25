// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

// MARK: - Requests

struct DeviceAuthorizationRequest: Encodable {
  let clientId: String
  let deviceName: String?
  let devicePlatform: String?
  let deviceOsVersion: String?
  let deviceAppVersion: String?

  enum CodingKeys: String, CodingKey {
    case clientId = "client_id"
    case deviceName = "device_name"
    case devicePlatform = "device_platform"
    case deviceOsVersion = "device_os_version"
    case deviceAppVersion = "device_app_version"
  }
}

struct DeviceTokenRequest: Encodable {
  let grantType = "urn:ietf:params:oauth:grant-type:device_code"
  let clientId: String
  let deviceCode: String
  let matchValue: String?

  enum CodingKeys: String, CodingKey {
    case grantType = "grant_type"
    case clientId = "client_id"
    case deviceCode = "device_code"
    case matchValue = "match_value"
  }
}

// MARK: - Responses

struct DeviceAuthorizationResponse: Decodable {
  let data: DeviceAuthorization
}

struct DeviceAuthorization: Decodable {
  let deviceCode: String
  let userCode: String
  let verificationURI: URL
  let expiresIn: Int
  let interval: Int

  enum CodingKeys: String, CodingKey {
    case deviceCode = "device_code"
    case userCode = "user_code"
    case verificationURI = "verification_uri"
    case expiresIn = "expires_in"
    case interval = "interval"
  }
}

struct DeviceTokenResponse: Decodable {
  let data: DeviceTokenPayload
}

/// The token endpoint reports in-flight and terminal states as HTTP 200 with an `error` string, not an HTTP error code.
struct DeviceTokenPayload: Decodable {
  let sessionSecret: String?
  let expiresAt: String?
  let error: String?
  let matchOptions: [String]?

  enum CodingKeys: String, CodingKey {
    case sessionSecret = "session_secret"
    case expiresAt = "expires_at"
    case error
    case matchOptions = "match_options"
  }
}

// MARK: - Outcome

enum TokenOutcome: Equatable {
  case session(secret: String, expiresAt: Date?)
  case pending
  case slowDown
  case matchRequired([String])
  case denied
  case expired
  case invalid

  init(payload: DeviceTokenPayload) {
    if let secret = payload.sessionSecret {
      // A session with an unreadable expiry is still valid. Drop the expiry, not the credential.
      let expiresAt = payload.expiresAt.flatMap(DeviceLoginDates.parseExpiry)
      if payload.expiresAt != nil, expiresAt == nil {
        print("[DeviceLogin] Could not parse expires_at: \(payload.expiresAt ?? "")")
      }
      self = .session(secret: secret, expiresAt: expiresAt)
      return
    }

    switch payload.error {
    case "authorization_pending":
      self = .pending
    case "slow_down":
      self = .slowDown
    case "matching_required":
      guard let options = payload.matchOptions, !options.isEmpty else {
        print("[DeviceLogin] matching_required arrived with no match_options")
        self = .invalid
        return
      }
      self = .matchRequired(options)
    case "access_denied":
      self = .denied
    case "expired_token":
      self = .expired
    default:
      self = .invalid
    }
  }
}

// MARK: - Dates

enum DeviceLoginDates {
  /// The API sends fractional seconds, which `JSONDecoder`'s `.iso8601` strategy rejects.
  static func parseExpiry(_ value: String) -> Date? {
    parseISO8601Date(value)
  }
}
