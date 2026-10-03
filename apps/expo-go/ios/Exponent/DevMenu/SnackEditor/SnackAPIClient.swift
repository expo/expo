// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Response from the Snack API (`/--/api/v2/snack/:id`).
struct SnackAPIResponse: Codable {
  let id: String
  let hashId: String
  let name: String?
  let code: [String: File]
  let dependencies: [String: Dependency]?

  struct File: Codable {
    let type: String  // "CODE" or "ASSET"
    let contents: String
  }

  struct Dependency: Codable {
    let version: String
    let handle: String?
    let peerDependencies: [String: String]?
  }
}

enum SnackAPIError: LocalizedError {
  case invalidSnackId(String)
  case httpError(Int)

  var errorDescription: String? {
    switch self {
    case .invalidSnackId(let id):
      return "The Snack ID \"\(id)\" isn't a valid identifier, so its code can't be fetched. Check the link or QR code used to open this Snack."
    case .httpError(let code):
      return "Snack API returned error: \(code)"
    }
  }
}

/// Single client for fetching snack code, replacing per-caller request code.
enum SnackAPIClient {
  private static let allowedSnackIdCharacters = CharacterSet(
    charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_@/."
  )

  static func makeRequest(snackId: String, isStaging: Bool) throws -> URLRequest {
    let apiHost = isStaging ? "https://staging.exp.host" : "https://exp.host"
    let cleanId = snackId.hasPrefix("@snack/") ? String(snackId.dropFirst(7)) : snackId

    // Validate explicitly: on newer OS versions URL(string:) percent-encodes
    // invalid characters instead of returning nil, so it no longer rejects
    // malformed IDs by itself.
    guard !cleanId.isEmpty,
          cleanId.unicodeScalars.allSatisfy({ allowedSnackIdCharacters.contains($0) }),
          let apiURL = URL(string: "\(apiHost)/--/api/v2/snack/\(cleanId)") else {
      throw SnackAPIError.invalidSnackId(snackId)
    }

    var request = URLRequest(url: apiURL)
    request.setValue("3.0.0", forHTTPHeaderField: "Snack-Api-Version")
    request.setValue("expo-go/1.0", forHTTPHeaderField: "User-Agent")
    return request
  }

  static func fetch(snackId: String, isStaging: Bool) async throws -> SnackAPIResponse {
    let request = try makeRequest(snackId: snackId, isStaging: isStaging)
    let (data, response) = try await URLSession.shared.data(for: request)

    if let httpResponse = response as? HTTPURLResponse,
       !(200...299).contains(httpResponse.statusCode) {
      throw SnackAPIError.httpError(httpResponse.statusCode)
    }

    return try JSONDecoder().decode(SnackAPIResponse.self, from: data)
  }
}
