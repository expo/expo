// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum APIError: LocalizedError {
  case invalidURL
  case invalidResponse
  case httpError(statusCode: Int, message: String)
  case decodingError(Error)
  case networkError(Error)
  case authenticationRequired

  var errorDescription: String? {
    switch self {
    case .invalidURL:
      return "Invalid URL"
    case .invalidResponse:
      return "Invalid response from server"
    case .httpError(let statusCode, let message):
      return "HTTP \(statusCode): \(message)"
    case .decodingError(let error):
      return "Failed to decode response: \(error.localizedDescription)"
    case .networkError(let error):
      return "Network error: \(error.localizedDescription)"
    case .authenticationRequired:
      return "Authentication required. Please sign in."
    }
  }

  // Cancellation happens whenever SwiftUI tears down a refreshable or task modifier; it is
  // never worth surfacing to the user.
  var isCancellation: Bool {
    if case .networkError(let error) = self {
      return error is CancellationError || (error as? URLError)?.code == .cancelled
    }
    return false
  }

  var isAuthenticationError: Bool {
    if case .httpError(let statusCode, _) = self, statusCode == 401 {
      return true
    }
    if case .authenticationRequired = self {
      return true
    }
    return false
  }
}
