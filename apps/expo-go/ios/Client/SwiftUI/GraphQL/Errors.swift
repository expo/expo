// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum APIError: Error {
  case invalidURL
  case invalidResponse
  case httpError(statusCode: Int, message: String)
  case decodingError(Error)
  case networkError(Error)
  case authenticationRequired

  var localizedDescription: String {
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
