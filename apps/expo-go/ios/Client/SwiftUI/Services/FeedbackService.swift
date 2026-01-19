// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import UIKit

struct FeedbackService {
  func submitFeedback(message: String, email: String?) async throws {
    guard let url = URL(string: "\(APIClient.shared.apiOrigin)/--/api/v2/feedback/expo-go-send") else {
      throw APIError.invalidURL
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("application/json", forHTTPHeaderField: "Accept")

    let payload = FeedbackPayload(
      feedback: message,
      email: email,
      metadata: FeedbackMetadata(
        os: "\(UIDevice.current.systemName) \(UIDevice.current.systemVersion)",
        model: UIDevice.current.model,
        expoGoVersion: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String
      )
    )

    let encoder = JSONEncoder()
    request.httpBody = try encoder.encode(payload)

    do {
      let (data, response) = try await URLSession.shared.data(for: request)
      guard let httpResponse = response as? HTTPURLResponse else {
        throw APIError.invalidResponse
      }

      guard (200..<300).contains(httpResponse.statusCode) else {
        let message = parseAPIErrorMessage(from: data) ?? "Something went wrong."
        throw APIError.httpError(statusCode: httpResponse.statusCode, message: message)
      }
    } catch let error as APIError {
      throw error
    } catch {
      throw APIError.networkError(error)
    }
  }

  private func parseAPIErrorMessage(from data: Data) -> String? {
    guard let jsonObject = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
          let errors = jsonObject["errors"] as? [[String: Any]],
          let firstError = errors.first else {
      return nil
    }

    if let details = firstError["details"] as? [String: Any],
       let message = details["message"] as? String {
      return message
    }

    return firstError["message"] as? String
  }
}

private struct FeedbackPayload: Encodable {
  let feedback: String
  let email: String?
  let metadata: FeedbackMetadata
}

private struct FeedbackMetadata: Encodable {
  let os: String
  let model: String
  let expoGoVersion: String?
}
