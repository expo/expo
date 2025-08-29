//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest
@testable import EXUpdates

/**
 * Tests for UpdatesMultipartStreamReader
 */
class UpdatesMultipartStreamReaderSpec: XCTestCase {
  func testSimpleCase() {
    let response = "preamble, should be ignored\r\n" +
      "--sample_boundary\r\n" +
      "Content-Type: application/json; charset=utf-8\r\n" +
      "Content-Length: 2\r\n\r\n" +
      "{}\r\n" +
      "--sample_boundary--\r\n" +
      "epilogue, should be ignored"

    let inputStream = InputStream(data: response.data(using: .utf8)!)
    let reader = UpdatesMultipartStreamReader(inputStream: inputStream, boundary: "sample_boundary")

    var count = 0
    let success = reader.readAllParts { headers, content, done in
      XCTAssertTrue(done)
      XCTAssertEqual(headers?["Content-Type"] as? String, "application/json; charset=utf-8")
      XCTAssertEqual(String(data: content!, encoding: .utf8), "{}")
      count += 1
    }

    XCTAssertTrue(success)
    XCTAssertEqual(count, 1)
  }

  func testMultipleParts() {
    let response = "preamble, should be ignored\r\n" +
      "--sample_boundary\r\n" +
      "1\r\n" +
      "--sample_boundary\r\n" +
      "2\r\n" +
      "--sample_boundary\r\n" +
      "3\r\n" +
      "--sample_boundary--\r\n" +
      "epilogue, should be ignored"

    let inputStream = InputStream(data: response.data(using: .utf8)!)
    let reader = UpdatesMultipartStreamReader(inputStream: inputStream, boundary: "sample_boundary")

    var count = 0
    let expectedContents = ["1", "2", "3"]

    let success = reader.readAllParts { _, content, done in
      if count < expectedContents.count {
        let expectedContent = expectedContents[count]
        XCTAssertEqual(String(data: content!, encoding: .utf8), expectedContent)
        XCTAssertEqual(done, count == expectedContents.count - 1)
        count += 1
      }
    }

    XCTAssertTrue(success)
    XCTAssertEqual(count, 3)
  }

  func testNoDelimiter() {
    let response = "content with no delimiter"

    guard let responseData = response.data(using: .utf8) else {
      XCTFail("Failed to convert response to UTF-8 data")
      return
    }
    let inputStream = InputStream(data: responseData)
    let reader = UpdatesMultipartStreamReader(inputStream: inputStream, boundary: "sample_boundary")

    var count = 0
    let success = reader.readAllParts { _, _, _ in
      count += 1
    }

    XCTAssertFalse(success)
    XCTAssertEqual(count, 0)
  }

  func testEmptyContent() {
    let response = "--sample_boundary\r\n" +
      "Content-Type: application/json\r\n" +
      "\r\n" +
      "\r\n" +
      "--sample_boundary--\r\n"

    guard let responseData = response.data(using: .utf8) else {
      XCTFail("Failed to convert response to UTF-8 data")
      return
    }
    let inputStream = InputStream(data: responseData)
    let reader = UpdatesMultipartStreamReader(inputStream: inputStream, boundary: "sample_boundary")

    var count = 0
    let success = reader.readAllParts { headers, content, done in
      XCTAssertTrue(done)
      XCTAssertEqual(headers?["Content-Type"] as? String, "application/json")
      guard let contentData = content else {
        XCTFail("Content should not be nil")
        return
      }
      XCTAssertEqual(String(data: contentData, encoding: .utf8), "")
      count += 1
    }

    XCTAssertTrue(success)
    XCTAssertEqual(count, 1)
  }

  func testFirstBoundaryAsBoundary() {
    let response = "--sample_boundary\r\n" +
      "Content-Type: application/json\r\n" +
      "\r\n" +
      "{}\r\n" +
      "--sample_boundary--\r\n"

    guard let responseData = response.data(using: .utf8) else {
      XCTFail("Failed to convert response to UTF-8 data")
      return
    }
    let inputStream = InputStream(data: responseData)
    let reader = UpdatesMultipartStreamReader(inputStream: inputStream, boundary: "sample_boundary")

    var count = 0
    let success = reader.readAllParts { headers, content, done in
      XCTAssertTrue(done)
      XCTAssertEqual(headers?["Content-Type"] as? String, "application/json")
      guard let contentData = content else {
        XCTFail("Content should not be nil")
        return
      }
      XCTAssertEqual(String(data: contentData, encoding: .utf8), "{}")
      count += 1
    }

    XCTAssertTrue(success)
    XCTAssertEqual(count, 1)
  }
}
