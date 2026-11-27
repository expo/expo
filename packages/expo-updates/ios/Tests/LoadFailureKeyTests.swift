//  Copyright (c) 2026 650 Industries, Inc. All rights reserved.

import EXUpdatesInterface
import Foundation
import Testing

@testable import EXUpdates

@Suite("Load failure keys")
struct LoadFailureKeyTests {
  @Test(arguments: [
    URLError.Code.notConnectedToInternet,
    .networkConnectionLost,
    .timedOut,
    .cannotFindHost,
    .cannotConnectToHost,
    .dnsLookupFailed
  ])
  func `a network failure takes the unreachable key`(code: URLError.Code) {
    #expect(forFetch(URLError(code)) == .remoteFetchUnreachable)
  }

  @Test
  func `a network failure inside wrapping errors takes the unreachable key`() {
    let error = UpdatesError.appLoaderUnknownError(
      cause: UpdatesError.fileDownloaderUnknownError(cause: URLError(.notConnectedToInternet))
    )

    #expect(forFetch(error) == .remoteFetchUnreachable)
  }

  @Test
  func `a network failure as an NSError takes the unreachable key`() {
    let error = UpdatesError.fileDownloaderUnknownError(
      cause: NSError(domain: NSURLErrorDomain, code: NSURLErrorTimedOut)
    )

    #expect(forFetch(error) == .remoteFetchUnreachable)
  }

  @Test
  func `any other failure takes the failed key`() {
    let httpError = UpdatesError.appLoaderUnknownError(
      cause: UpdatesError.fileDownloaderHTTPResponseError(statusCode: 500, body: "server exploded")
    )
    let cancelled = UpdatesError.fileDownloaderUnknownError(cause: URLError(.cancelled))

    #expect(forFetch(httpError) == .remoteFetchFailed)
    #expect(forFetch(cancelled) == .remoteFetchFailed)
  }

  @Test
  func `asset failures group by key and HTTP status`() {
    let failures = [
      AssetLoadFailure(assetKey: "a", error: .fileDownloaderHTTPResponseError(statusCode: 404, body: "not found")),
      AssetLoadFailure(assetKey: "b", error: .fileDownloaderUnknownError(cause: URLError(.timedOut))),
      AssetLoadFailure(assetKey: "c", error: .fileDownloaderHTTPResponseError(statusCode: 404, body: "not found")),
      AssetLoadFailure(assetKey: "d", error: .fileDownloaderHTTPResponseError(statusCode: 500, body: "server exploded")),
      AssetLoadFailure(assetKey: "e", error: .fileDownloaderUnknownError(cause: URLError(.notConnectedToInternet)))
    ]

    let groups = UpdatesLogMessage.groups(of: failures)

    #expect(groups.map { $0.message } == [.remoteAssetsFailed, .remoteAssetsUnreachable, .remoteAssetsFailed])
    #expect(groups.map { $0.httpStatus } == [404, nil, 500])
    #expect(groups.map { $0.failures.map { $0.assetKey } } == [["a", "c"], ["b", "e"], ["d"]])
  }

  private func forFetch(_ error: Error) -> UpdatesLogMessage {
    return UpdatesLogMessage.forLoadFailure(error, failed: .remoteFetchFailed, unreachable: .remoteFetchUnreachable)
  }
}
