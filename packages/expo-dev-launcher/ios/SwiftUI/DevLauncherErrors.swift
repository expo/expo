import Foundation

enum APIError: Error, LocalizedError {
  case invalidURL
  case invalidResponse
  case httpError(statusCode: Int, message: String)
  case decodingError(Error)
  case networkError(Error)

  var errorDescription: String? {
    switch self {
    case .invalidURL:
      return "Invalid GraphQL endpoint URL"
    case .invalidResponse:
      return "Invalid response from server"
    case .httpError(let statusCode, let message):
      return "HTTP \(statusCode): \(message)"
    case .decodingError(let error):
      return "Failed to decode response: \(error.localizedDescription)"
    case .networkError(let error):
      return "Network error: \(error.localizedDescription)"
    }
  }
}

enum AuthError: Error, LocalizedError {
  case invalidURL
  case noSessionSecret

  var errorDescription: String? {
    switch self {
    case .invalidURL:
      return "Invalid authentication URL"
    case .noSessionSecret:
      return "No session secret received from authentication"
    }
  }
}
