//  Copyright © 2025 650 Industries. All rights reserved.

import Foundation

actor RESTClient {
  static let shared = RESTClient()

  private let baseURL = "https://api.expo.dev/v2/"

  private lazy var session: URLSession = {
    let config = URLSessionConfiguration.default
    config.timeoutIntervalForRequest = 30
    return URLSession(configuration: config)
  }()

  private init() {}

  func post<Request: Encodable, Response: Decodable>(
    path: String,
    body: Request
  ) async throws -> Response {
    guard let url = URL(string: baseURL + path) else {
      throw LoginError.apiError("Invalid URL")
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    let encoder = JSONEncoder()
    do {
      request.httpBody = try encoder.encode(body)
    } catch {
      throw LoginError.apiError("Failed to encode request")
    }

    let data: Data
    do {
      let (responseData, response) = try await session.data(for: request)
      data = responseData

      guard let httpResponse = response as? HTTPURLResponse else {
        throw LoginError.apiError("Invalid response from server")
      }

      guard (200...299).contains(httpResponse.statusCode) else {
        throw parseAPIError(from: data, statusCode: httpResponse.statusCode)
      }
    } catch let error as LoginError {
      throw error
    } catch {
      throw LoginError.networkError(error)
    }

    let decoder = JSONDecoder()
    do {
      return try decoder.decode(Response.self, from: data)
    } catch {
      throw LoginError.apiError("Failed to decode response")
    }
  }

  private func parseAPIError(from data: Data, statusCode: Int) -> LoginError {
    guard let errorResponse = try? JSONDecoder().decode(ExpoAPIErrorResponse.self, from: data),
          let firstError = errorResponse.errors.first else {
      return .apiError("Server error (\(statusCode))")
    }

    if firstError.code == "ONE_TIME_PASSWORD_REQUIRED" {
      return .otpRequired(
        devices: firstError.metadata?.secondFactorDevices ?? [],
        smsAutomaticallySent: firstError.metadata?.smsAutomaticallySent ?? false
      )
    }

    if firstError.code == "AUTHENTICATION_ERROR" {
      return .invalidCredentials(firstError.message)
    }

    return .apiError(firstError.message)
  }
}
