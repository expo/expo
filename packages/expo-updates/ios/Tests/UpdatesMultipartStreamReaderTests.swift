//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

@Suite("UpdatesMultipartStreamReader")
struct UpdatesMultipartStreamReaderTests {
  @Test
  func `simple case`() {
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
      #expect(done == true)
      #expect(headers?["Content-Type"] as? String == "application/json; charset=utf-8")
      #expect(String(data: content!, encoding: .utf8) == "{}")
      count += 1
    }

    #expect(success == true)
    #expect(count == 1)
  }

  @Test
  func `multiple parts`() {
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
        #expect(String(data: content!, encoding: .utf8) == expectedContent)
        #expect(done == (count == expectedContents.count - 1))
        count += 1
      }
    }

    #expect(success == true)
    #expect(count == 3)
  }

  @Test
  func `no delimiter`() throws {
    let response = "content with no delimiter"

    let responseData = try #require(response.data(using: .utf8))
    let inputStream = InputStream(data: responseData)
    let reader = UpdatesMultipartStreamReader(inputStream: inputStream, boundary: "sample_boundary")

    var count = 0
    let success = reader.readAllParts { _, _, _ in
      count += 1
    }

    #expect(success == false)
    #expect(count == 0)
  }

  @Test
  func `empty content`() throws {
    let response = "--sample_boundary\r\n" +
      "Content-Type: application/json\r\n" +
      "\r\n" +
      "\r\n" +
      "--sample_boundary--\r\n"

    let responseData = try #require(response.data(using: .utf8))
    let inputStream = InputStream(data: responseData)
    let reader = UpdatesMultipartStreamReader(inputStream: inputStream, boundary: "sample_boundary")

    var count = 0
    let success = reader.readAllParts { headers, content, done in
      #expect(done == true)
      #expect(headers?["Content-Type"] as? String == "application/json")
      #expect(content != nil)
      if let contentData = content {
        #expect(String(data: contentData, encoding: .utf8) == "")
      }
      count += 1
    }

    #expect(success == true)
    #expect(count == 1)
  }

  @Test
  func `first boundary as boundary`() throws {
    let response = "--sample_boundary\r\n" +
      "Content-Type: application/json\r\n" +
      "\r\n" +
      "{}\r\n" +
      "--sample_boundary--\r\n"

    let responseData = try #require(response.data(using: .utf8))
    let inputStream = InputStream(data: responseData)
    let reader = UpdatesMultipartStreamReader(inputStream: inputStream, boundary: "sample_boundary")

    var count = 0
    let success = reader.readAllParts { headers, content, done in
      #expect(done == true)
      #expect(headers?["Content-Type"] as? String == "application/json")
      #expect(content != nil)
      if let contentData = content {
        #expect(String(data: contentData, encoding: .utf8) == "{}")
      }
      count += 1
    }

    #expect(success == true)
    #expect(count == 1)
  }
}
