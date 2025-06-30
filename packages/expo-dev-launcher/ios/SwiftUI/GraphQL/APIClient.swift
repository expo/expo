// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

class APIClient {
  static let shared = APIClient()

  private var useStaging: Bool {
#if DEBUG
    return true
#else
    return false
#endif
  }

  private var apiEndpoint: String {
    return useStaging
      ? "https://staging.exp.host/--/graphql"
      : "https://exp.host/--/graphql"
  }

  var websiteOrigin: String {
    return useStaging
      ? "https://staging.expo.dev"
      : "https://expo.dev"
  }

  private var sessionSecret: String?

  private init() {}

  func setSession(_ sessionSecret: String?) {
    self.sessionSecret = sessionSecret
  }

  func request<T: Decodable>(_ query: String, variables: [String: Any]? = nil) async throws -> T {
    guard let url = URL(string: apiEndpoint) else {
      throw APIError.invalidURL
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue(sessionSecret, forHTTPHeaderField: "expo-session")
    request.assumesHTTP3Capable = false
    request.httpBody = try JSONSerialization.data(withJSONObject: [
      "query": query,
      "variables": variables ?? [:]
    ])

    // We need to disable http/3 or the requests will fail
    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = []
    let session = URLSession(configuration: config)

    do {
      let (data, response) = try await session.data(for: request)
      guard let httpResponse = response as? HTTPURLResponse else {
        throw APIError.invalidResponse
      }

      guard httpResponse.statusCode == 200 else {
        let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
        throw APIError.httpError(statusCode: httpResponse.statusCode, message: errorMessage)
      }

      do {
        return try JSONDecoder().decode(T.self, from: data)
      } catch {
        throw APIError.decodingError(error)
      }
    } catch let error as APIError {
      throw error
    } catch {
      throw APIError.networkError(error)
    }
  }
}
