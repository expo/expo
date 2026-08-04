// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

struct ExchangePartnerLoginCodeRequest: Encodable {
  let code: String
}

struct PartnerLoginResponse: Decodable {
  let data: PartnerLoginResponseData
}

struct PartnerLoginResponseData: Decodable {
  let sessionSecret: String
  let username: String
  let expiresAt: String
}

/// Redeems a partner login code for a session. The code is single use, so a failure is final for
/// that code and the user needs a freshly rendered QR code.
@objc(EXPartnerLoginService)
public final class PartnerLoginService: NSObject {
  static let invalidCodeMessage =
    "Expo couldn't sign you in with this QR code. Reload your project's preview and scan the new QR code."
  static let networkErrorMessage =
    "Couldn't reach Expo to sign you in. Check your connection and scan the QR code again."
  static let unexpectedResponseMessage =
    "Expo returned an unexpected response while signing you in. Scan the QR code again, and contact support@expo.dev if it keeps happening."

  private override init() {
    super.init()
  }

  /// Objective-C entry point for `EXKernelLinkingManager`. Calls back on the main queue.
  @objc(exchangeCode:completion:)
  public static func exchange(code: String, completion: @escaping (Bool, String?) -> Void) {
    Task {
      let failureMessage = await exchange(code: code)
      await MainActor.run {
        completion(failureMessage == nil, failureMessage)
      }
    }
  }

  /// Returns nil on success, or a user-facing message describing what to do next.
  static func exchange(code: String) async -> String? {
    do {
      let response: PartnerLoginResponse = try await RESTClient.shared.post(
        path: "auth/exchange-partner-login-code",
        body: ExchangePartnerLoginCodeRequest(code: code)
      )

      guard let expiresAt = PartnerLogin.parseExpiry(response.data.expiresAt) else {
        print("[PartnerLoginService] Could not parse expiresAt: \(response.data.expiresAt)")
        return unexpectedResponseMessage
      }

      await AuthenticationService.storePartnerSession(
        sessionSecret: response.data.sessionSecret,
        username: response.data.username,
        expiresAt: expiresAt
      )
      return nil
    } catch let error as LoginError {
      print("[PartnerLoginService] Exchange failed: \(error.localizedDescription)")
      return message(for: error)
    } catch {
      print("[PartnerLoginService] Exchange failed: \(error.localizedDescription)")
      return message(for: error)
    }
  }

  /// Maps a thrown error to a user-facing message. Pure so it can be tested without going
  /// through `RESTClient`.
  static func message(for error: Error) -> String {
    guard let loginError = error as? LoginError else {
      return unexpectedResponseMessage
    }
    switch loginError {
    case .networkError:
      return networkErrorMessage
    case .invalidCredentials, .apiError, .otpRequired:
      return invalidCodeMessage
    }
  }
}
