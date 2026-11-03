// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

private final class FailingURLProtocol: URLProtocol {
  nonisolated(unsafe) static var error: URLError = URLError(.notConnectedToInternet)
  nonisolated(unsafe) static var requestCount = 0

  override class func canInit(with request: URLRequest) -> Bool { true }
  override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

  override func startLoading() {
    Self.requestCount += 1
    client?.urlProtocol(self, didFailWithError: Self.error)
  }

  override func stopLoading() {}
}

@MainActor
final class DevelopmentServerServiceTests: XCTestCase {
  private func makeService(failingWith error: URLError) -> DevelopmentServerService {
    FailingURLProtocol.error = error
    FailingURLProtocol.requestCount = 0
    let configuration = URLSessionConfiguration.ephemeral
    configuration.protocolClasses = [FailingURLProtocol.self]
    let service = DevelopmentServerService(urlSession: URLSession(configuration: configuration))
    service.setSessionSecret("test-session")
    return service
  }

  func testBacksOffAfterNetworkError() async {
    let service = makeService(failingWith: URLError(.notConnectedToInternet))

    await service.refreshRemoteSessions()
    await service.refreshRemoteSessions()

    XCTAssertEqual(FailingURLProtocol.requestCount, 1)
  }

  func testDoesNotBackOffWhenRequestIsCancelled() async {
    let service = makeService(failingWith: URLError(.cancelled))

    await service.refreshRemoteSessions()
    await service.refreshRemoteSessions()

    XCTAssertEqual(FailingURLProtocol.requestCount, 2)
  }
}
