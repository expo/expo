// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class SnackAPIClientTests: XCTestCase {
  func testRequestURLAndHeaders() throws {
    let request = try SnackAPIClient.makeRequest(snackId: "abc123", isStaging: false)
    XCTAssertEqual(request.url?.absoluteString, "https://exp.host/--/api/v2/snack/abc123")
    XCTAssertEqual(request.value(forHTTPHeaderField: "Snack-Api-Version"), "3.0.0")
    XCTAssertEqual(request.value(forHTTPHeaderField: "User-Agent"), "expo-go/1.0")
  }

  func testRequestStripsSnackPrefixAndUsesStagingHost() throws {
    let request = try SnackAPIClient.makeRequest(snackId: "@snack/xyz789", isStaging: true)
    XCTAssertEqual(request.url?.absoluteString, "https://staging.exp.host/--/api/v2/snack/xyz789")
  }

  func testRequestAllowsFullSnackIdentifiers() throws {
    let request = try SnackAPIClient.makeRequest(snackId: "@username/my-project.demo_1", isStaging: false)
    XCTAssertEqual(request.url?.absoluteString, "https://exp.host/--/api/v2/snack/@username/my-project.demo_1")
  }

  func testRequestThrowsOnEmptySnackId() {
    XCTAssertThrowsError(try SnackAPIClient.makeRequest(snackId: "", isStaging: false))
    XCTAssertThrowsError(try SnackAPIClient.makeRequest(snackId: "@snack/", isStaging: false))
  }

  func testRequestThrowsOnMalformedSnackId() {
    XCTAssertThrowsError(try SnackAPIClient.makeRequest(snackId: "bad id with spaces", isStaging: false)) { error in
      guard case SnackAPIError.invalidSnackId(let id) = error else {
        return XCTFail("Expected invalidSnackId, got \(error)")
      }
      XCTAssertEqual(id, "bad id with spaces")
    }
  }

  func testDecodesFullResponse() throws {
    let json = """
    {
      "id": "1",
      "hashId": "abc123",
      "name": "My Snack",
      "code": {
        "App.js": { "type": "CODE", "contents": "export default 1" },
        "assets/icon.png": { "type": "ASSET", "contents": "https://example.com/icon.png" }
      },
      "dependencies": {
        "expo-camera": {
          "version": "~17.0.0",
          "handle": "snackager-1/expo-camera@17.0.2",
          "peerDependencies": { "react": "*" }
        }
      }
    }
    """.data(using: .utf8)!

    let response = try JSONDecoder().decode(SnackAPIResponse.self, from: json)
    XCTAssertEqual(response.name, "My Snack")
    XCTAssertEqual(response.code["App.js"]?.type, "CODE")
    XCTAssertEqual(response.code["assets/icon.png"]?.type, "ASSET")
    XCTAssertEqual(response.dependencies?["expo-camera"]?.handle, "snackager-1/expo-camera@17.0.2")
  }

  func testDecodesMinimalResponseWithoutNameOrDependencies() throws {
    // The source-explorer path historically decoded a model without these
    // fields, so real responses may omit them.
    let json = """
    {
      "id": "1",
      "hashId": "abc123",
      "code": { "App.js": { "type": "CODE", "contents": "x" } }
    }
    """.data(using: .utf8)!

    let response = try JSONDecoder().decode(SnackAPIResponse.self, from: json)
    XCTAssertNil(response.name)
    XCTAssertNil(response.dependencies)
    XCTAssertEqual(response.code.count, 1)
  }
}
