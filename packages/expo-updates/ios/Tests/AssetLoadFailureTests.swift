//  Copyright (c) 2026 650 Industries, Inc. All rights reserved.

import EXUpdatesInterface
import Foundation
import Testing

@testable import EXUpdates

@Suite("Asset load failures", .serialized)
struct AssetLoadFailureTests {
  private let logger: UpdatesLogger
  private let logReader: UpdatesLogReader

  init() {
    let category = "expo-updates-tests-\(UUID().uuidString)"
    self.logger = UpdatesLogger(category: category)
    self.logReader = UpdatesLogReader(category: category)
  }

  @Test
  func `the message for one failed asset names it and gives its error`() {
    let error = UpdatesError.appLoaderFailedToLoadAllAssets(failures: [notFound("a")])

    #expect(error.localizedDescription == "Failed to load 1 asset (a): HTTP response error 404: not found")
  }

  @Test
  func `the message for several failed assets names all of them`() {
    let error = UpdatesError.appLoaderFailedToLoadAllAssets(failures: [notFound("a"), notFound("b")])

    #expect(error.localizedDescription == "Failed to load 2 assets (a, b): HTTP response error 404: not found")
  }

  @Test
  func `the message for more than five failed assets names the first five`() {
    let failures = (0..<7).map { notFound("k\($0)") }
    let error = UpdatesError.appLoaderFailedToLoadAllAssets(failures: failures)

    #expect(
      error.localizedDescription == "Failed to load 7 assets (k0, k1, k2, k3, k4, and 2 more): HTTP response error 404: not found"
    )
  }

  @Test
  func `a failed load logs one error for each group of asset failures`() async throws {
    let epoch = Date()
    let error = UpdatesError.appLoaderFailedToLoadAllAssets(failures: [
      notFound("a"),
      AssetLoadFailure(assetKey: "b", error: .fileDownloaderUnknownError(cause: URLError(.timedOut))),
      notFound("c"),
      AssetLoadFailure(assetKey: "d", error: .fileDownloaderHTTPResponseError(statusCode: 500, body: "server exploded"))
    ])

    logger.errorForLoadFailure(error, failed: .remoteFetchFailed, unreachable: .remoteFetchUnreachable)
    try await Task.sleep(for: .seconds(0.1))

    let errors = readErrors(newerThan: epoch)
    #expect(errors.map { $0.key } == ["remote.assetsFailed", "remote.assetsUnreachable", "remote.assetsFailed"])
    #expect(errors.map { $0.code } == ["AssetsFailedToLoad", "UpdateServerUnreachable", "AssetsFailedToLoad"])
    #expect(errors.map { $0.message } == [
      "Failed to load 2 asset(s) (a, c): HTTP response error 404: not found",
      "Could not reach the update server to load 1 asset(s) (b): \(UpdatesError.fileDownloaderUnknownError(cause: URLError(.timedOut)).localizedDescription)",
      "Failed to load 1 asset(s) (d): HTTP response error 500: server exploded"
    ])
    #expect(errors.first?.values?["httpStatus"] == "404")
    #expect(errors.first?.values?["assetKeys"] == "a, c")
    #expect(errors[1].values?["httpStatus"] == nil)
  }

  @Test
  func `a group of more than five failed assets names the first five`() async throws {
    let epoch = Date()
    let error = UpdatesError.appLoaderFailedToLoadAllAssets(failures: (0..<7).map { notFound("k\($0)") })

    logger.errorForLoadFailure(error, failed: .remoteFetchFailed, unreachable: .remoteFetchUnreachable)
    try await Task.sleep(for: .seconds(0.1))

    let errors = readErrors(newerThan: epoch)
    #expect(errors.map { $0.values?["assetKeys"] } == ["k0, k1, k2, k3, k4, and 2 more"])
    #expect(errors.map { $0.values?["count"] } == ["7"])
  }

  @Test
  func `a failed load without asset failures logs the failed key`() async throws {
    let epoch = Date()

    logger.errorForLoadFailure(
      UpdatesError.fileDownloaderHTTPResponseError(statusCode: 500, body: "server exploded"),
      failed: .remoteFetchFailed,
      unreachable: .remoteFetchUnreachable
    )
    try await Task.sleep(for: .seconds(0.1))

    let errors = readErrors(newerThan: epoch)
    #expect(errors.map { $0.key } == ["remote.fetchFailed"])
    #expect(errors.map { $0.code } == ["UpdateFailedToLoad"])
    #expect(errors.map { $0.message } == ["Failed to download new update: HTTP response error 500: server exploded"])
  }

  @Test
  func `a failed load that cannot reach the server logs the unreachable key`() async throws {
    let epoch = Date()

    logger.errorForLoadFailure(
      UpdatesError.fileDownloaderUnknownError(cause: URLError(.notConnectedToInternet)),
      failed: .remoteCheckFailed,
      unreachable: .remoteCheckUnreachable
    )
    try await Task.sleep(for: .seconds(0.1))

    let errors = readErrors(newerThan: epoch)
    #expect(errors.map { $0.key } == ["remote.checkUnreachable"])
    #expect(errors.map { $0.code } == ["UpdateServerUnreachable"])
    #expect(errors.first?.message.hasPrefix("Could not reach the update server to check for an update: ") == true)
  }

  @Test
  func `a code signing failure is not logged again`() async throws {
    let epoch = Date()

    logger.errorForLoadFailure(
      UpdatesError.appLoaderUnknownError(cause: UpdatesError.fileDownloaderCodeSigningIncorrectSignature),
      failed: .remoteFetchFailed,
      unreachable: .remoteFetchUnreachable
    )
    try await Task.sleep(for: .seconds(0.1))

    #expect(readErrors(newerThan: epoch).isEmpty)
  }

  private func readErrors(newerThan epoch: Date) -> [UpdatesLogEntry] {
    return logReader.getLogEntries(newerThan: epoch)
      .compactMap { UpdatesLogEntry.create(from: $0) }
      .filter { $0.level == "error" }
  }

  private func notFound(_ assetKey: String) -> AssetLoadFailure {
    return AssetLoadFailure(assetKey: assetKey, error: .fileDownloaderHTTPResponseError(statusCode: 404, body: "not found"))
  }
}
