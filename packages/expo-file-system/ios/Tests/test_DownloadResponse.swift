// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation
import Testing

@testable import ExpoFileSystem

@Suite("Download response metadata")
struct DownloadResponseTests {
  @Test
  func testNoResponseHasNullStatusAndEmptyHeaders() {
    let task = FileSystemDownloadTask()
    #expect(task.getResponse()["status"] is NSNull)
    #expect((task.getResponse()["headers"] as? [String: String])?.isEmpty == true)
  }

  @Test(arguments: [200, 206, 429, 500])
  func testRecordsSuccessAndFailureResponses(status: Int) throws {
    let task = FileSystemDownloadTask()
    let response = try #require(HTTPURLResponse(
      url: URL(string: "https://example.com/download")!,
      statusCode: status,
      httpVersion: "HTTP/1.1",
      headerFields: ["Retry-After": "60", "X-Response": "value"]
    ))
    task.recordResponse(response)
    #expect(task.getResponse()["status"] as? Int == status)
    let headers = try #require(task.getResponse()["headers"] as? [String: String])
    #expect(headers.first { $0.key.lowercased() == "retry-after" }?.value == "60")
    #expect(headers.first { $0.key.lowercased() == "x-response" }?.value == "value")

    // A later callback without a response must not erase metadata already received.
    task.recordResponse(nil)
    task.finishTask(succeeded: status == 200 || status == 206)
    #expect(task.getResponse()["status"] as? Int == status)
  }
}
