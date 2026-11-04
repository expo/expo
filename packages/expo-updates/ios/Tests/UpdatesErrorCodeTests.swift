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
  func `asset failures group by code and HTTP status`() {
    let failures = [
      AssetLoadFailure(assetKey: "a", error: .fileDownloaderHTTPResponseError(statusCode: 404, body: "not found")),
      AssetLoadFailure(assetKey: "b", error: .fileDownloaderUnknownError(cause: URLError(.timedOut))),
      AssetLoadFailure(assetKey: "c", error: .fileDownloaderHTTPResponseError(statusCode: 404, body: "not found")),
      AssetLoadFailure(assetKey: "d", error: .fileDownloaderHTTPResponseError(statusCode: 500, body: "server exploded")),
      AssetLoadFailure(assetKey: "e", error: .fileDownloaderUnknownError(cause: URLError(.notConnectedToInternet)))
    ]

    let groups = UpdatesErrorCode.groups(of: failures)

    #expect(groups.map { $0.code } == [.assetsFailedToLoad, .updateServerUnreachable, .assetsFailedToLoad])
    #expect(groups.map { $0.failures.map { $0.assetKey } } == [["a", "c"], ["b", "e"], ["d"]])
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
