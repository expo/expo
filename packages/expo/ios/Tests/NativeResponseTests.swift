// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation
import Testing
@testable import Expo

@Suite
struct NativeResponseTests {
  @Test
  func `preserves raw Set-Cookie values when splitting repeated headers`() throws {
    let expected = [
      "host-only=value",
      "preferences=dark; Max-Age=3600; SameSite=None; Secure; Partitioned; Priority=High",
      "expires=value; Expires=Wed, 09 Jun 2027 10:18:14 GMT; Path=/"
    ]
    let response = try Self.makeResponse(
      headerFields: ["Set-Cookie": expected.joined(separator: ", ")]
    )

    let headers = NativeResponse.parseHeaders(from: response)
    let values = headers
      .filter { $0[0].caseInsensitiveCompare("Set-Cookie") == .orderedSame }
      .map { $0[1] }

    #expect(values == expected)
  }

  @Test
  func `does not split a comma unless the next value starts a cookie pair`() throws {
    let value = "first=value; Comment=hello, world; Path=/"
    let response = try Self.makeResponse(headerFields: ["Set-Cookie": value])

    let headers = NativeResponse.parseHeaders(from: response)
    let values = headers
      .filter { $0[0].caseInsensitiveCompare("Set-Cookie") == .orderedSame }
      .map { $0[1] }

    #expect(values == [value])
  }

  @Test
  func `leaves non Set-Cookie headers unchanged`() throws {
    let response = try Self.makeResponse(headerFields: ["X-Combined": "first, second"])

    let headers = NativeResponse.parseHeaders(from: response)

    #expect(headers.contains { $0[0].caseInsensitiveCompare("X-Combined") == .orderedSame && $0[1] == "first, second" })
  }

  private static func makeResponse(headerFields: [String: String]) throws -> HTTPURLResponse {
    let url = try #require(URL(string: "https://example.com/"))
    return try #require(HTTPURLResponse(
      url: url,
      statusCode: 200,
      httpVersion: "HTTP/1.1",
      headerFields: headerFields
    ))
  }
}
