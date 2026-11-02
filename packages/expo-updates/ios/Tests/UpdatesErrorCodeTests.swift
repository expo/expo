//  Copyright (c) 2026 650 Industries, Inc. All rights reserved.

import Foundation
import Testing

@testable import EXUpdates

@Suite("Updates error codes")
struct UpdatesErrorCodeTests {
  @Test(arguments: [
    URLError.Code.notConnectedToInternet,
    .networkConnectionLost,
    .timedOut,
    .cannotFindHost,
    .cannotConnectToHost,
    .dnsLookupFailed
  ])
  func `a network failure is updateServerUnreachable`(code: URLError.Code) {
    #expect(UpdatesErrorCode.forLoadFailure(URLError(code), otherwise: .updateFailedToLoad) == .updateServerUnreachable)
  }

  @Test
  func `a network failure inside wrapping errors is updateServerUnreachable`() {
    let error = UpdatesError.checkForUpdateProcedureFailed(
      cause: UpdatesError.appLoaderUnknownError(
        cause: UpdatesError.fileDownloaderUnknownError(cause: URLError(.notConnectedToInternet))
      )
    )

    #expect(UpdatesErrorCode.forLoadFailure(error, otherwise: .updateFailedToLoad) == .updateServerUnreachable)
  }

  @Test
  func `a network failure as an NSError is updateServerUnreachable`() {
    let error = UpdatesError.fileDownloaderUnknownError(
      cause: NSError(domain: NSURLErrorDomain, code: NSURLErrorTimedOut)
    )

    #expect(UpdatesErrorCode.forLoadFailure(error, otherwise: .assetsFailedToLoad) == .updateServerUnreachable)
  }

  @Test
  func `any other failure keeps the given code`() {
    let httpError = UpdatesError.fetchUpdateProcedureFailed(
      cause: UpdatesError.fileDownloaderHTTPResponseError(statusCode: 500, body: "server exploded")
    )
    let cancelled = UpdatesError.fileDownloaderUnknownError(cause: URLError(.cancelled))

    #expect(UpdatesErrorCode.forLoadFailure(httpError, otherwise: .updateFailedToLoad) == .updateFailedToLoad)
    #expect(UpdatesErrorCode.forLoadFailure(cancelled, otherwise: .assetsFailedToLoad) == .assetsFailedToLoad)
  }
}
