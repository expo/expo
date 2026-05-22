//  Copyright © 2025 650 Industries. All rights reserved.

import Foundation

// MARK: - Request Types

struct LoginRequest: Encodable {
  let username: String
  let password: String
  let otp: String?
}

struct SendSMSOTPRequest: Encodable {
  let username: String
  let password: String
  let secondFactorDeviceID: String
}

// MARK: - Response Types

struct LoginResponse: Decodable {
  let data: LoginResponseData
}

struct LoginResponseData: Decodable {
  let sessionSecret: String
}

// MARK: - Error Types

struct ExpoAPIErrorResponse: Decodable {
  let errors: [ExpoAPIError]
}

struct ExpoAPIError: Decodable {
  let message: String
  let code: String
  let metadata: OTPMetadata?
}

struct OTPMetadata: Decodable {
  let secondFactorDevices: [SecondFactorDevice]?
  let smsAutomaticallySent: Bool?
}

struct SecondFactorDevice: Decodable, Identifiable {
  let id: String
  let method: String
  let sms_phone_number: String?
  let is_primary: Bool
}

// MARK: - Login Error

enum LoginError: Error {
  case otpRequired(devices: [SecondFactorDevice], smsAutomaticallySent: Bool)
  case invalidCredentials(String)
  case apiError(String)
  case networkError(Error)

  var localizedDescription: String {
    switch self {
    case .otpRequired:
      return "Two-factor authentication required."
    case .invalidCredentials(let message):
      return message
    case .apiError(let message):
      return message
    case .networkError(let error):
      return "Network error: \(error.localizedDescription)"
    }
  }
}
