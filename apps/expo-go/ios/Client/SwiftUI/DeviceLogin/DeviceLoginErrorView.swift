// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct DeviceLoginErrorView: View {
  let failure: DeviceLoginFailure
  let onRetry: () -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 24) {
      VStack(alignment: .leading, spacing: 8) {
        Text(title)
          .font(.headline)
        Text(explanation)
          .font(.subheadline)
          .foregroundColor(.secondary)
      }

      Button {
        onRetry()
      } label: {
        Text(retryLabel)
          .font(.headline)
          .foregroundColor(.white)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 12)
      }
      .background(Color.black)
      .cornerRadius(12)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  private var title: String {
    switch failure {
    case .wrongNumber: return "That was the wrong number"
    case .denied: return "The sign in was declined"
    case .expired: return "The code expired"
    case .invalid: return "Expo couldn't finish signing you in"
    case .network: return "Couldn't reach Expo"
    case .server: return "Expo turned down the request"
    }
  }

  private var explanation: String {
    switch failure {
    case .wrongNumber:
      return "For your security, a wrong number cancels the whole attempt. Get a new code and try again, matching the number on your other screen exactly."
    case .denied:
      return "Someone chose Deny on the page where you entered the code. Get a new code if that wasn't what you meant to do."
    case .expired:
      return "A code only works for ten minutes. Get a new one to carry on."
    case .invalid:
      return "This code has already been used, or Expo returned something unexpected. Get a new code, and contact support@expo.dev if it keeps happening."
    case .network:
      return "Check your connection and try again. Your code was not used."
    case .server(let message):
      return "\(sentence(from: message)) Wait a moment before trying again."
    }
  }

  // The API's message may not end in punctuation.
  private func sentence(from message: String) -> String {
    let trimmed = message.trimmingCharacters(in: .whitespacesAndNewlines)
    guard let last = trimmed.last else {
      return "Expo turned down the request."
    }
    return ".!?".contains(last) ? trimmed : trimmed + "."
  }

  /// A network failure never reached the server, so the same attempt can simply be retried.
  private var retryLabel: String {
    failure == .network ? "Try again" : "Get a new code"
  }
}
