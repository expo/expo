//  Copyright (c) 2026 650 Industries, Inc. All rights reserved.

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

    logger.errorForLoadFailure(error, otherwise: .updateFailedToLoad) {
      UpdatesError.fetchUpdateProcedureFailed(cause: $0)
    }
    try await Task.sleep(for: .seconds(0.1))

    let errors = logReader.getLogEntries(newerThan: epoch)
      .compactMap { UpdatesLogEntry.create(from: $0) }
      .filter { $0.level == "error" }
    #expect(errors.map { $0.code } == ["AssetsFailedToLoad", "UpdateServerUnreachable", "AssetsFailedToLoad"])
    #expect(errors.map { $0.message } == [
      "Failed to download new update: Failed to load 2 assets (a, c): HTTP response error 404: not found",
      "Failed to download new update: Failed to load 1 asset (b): \(UpdatesError.fileDownloaderUnknownError(cause: URLError(.timedOut)).localizedDescription)",
      "Failed to download new update: Failed to load 1 asset (d): HTTP response error 500: server exploded"
    ])
  }

  @Test
  func `a failed load without asset failures logs one error`() async throws {
    let epoch = Date()

    logger.errorForLoadFailure(UpdatesError.fileDownloaderHTTPResponseError(statusCode: 500, body: "server exploded"), otherwise: .updateFailedToLoad) {
      UpdatesError.fetchUpdateProcedureFailed(cause: $0)
    }
    try await Task.sleep(for: .seconds(0.1))

    let errors = logReader.getLogEntries(newerThan: epoch)
      .compactMap { UpdatesLogEntry.create(from: $0) }
      .filter { $0.level == "error" }
    #expect(errors.map { $0.code } == ["UpdateFailedToLoad"])
  }

  @Test
  func `a failed load logged without a wrapper logs each group as it is`() async throws {
    let epoch = Date()
    let error = UpdatesError.appLoaderFailedToLoadAllAssets(failures: [
      notFound("a"),
      AssetLoadFailure(assetKey: "b", error: .fileDownloaderUnknownError(cause: URLError(.timedOut)))
    ])

    logger.errorForLoadFailure(error, otherwise: .updateFailedToLoad)
    try await Task.sleep(for: .seconds(0.1))

    let errors = logReader.getLogEntries(newerThan: epoch)
      .compactMap { UpdatesLogEntry.create(from: $0) }
      .filter { $0.level == "error" }
    #expect(errors.map { $0.code } == ["AssetsFailedToLoad", "UpdateServerUnreachable"])
    #expect(errors.first?.message == "Failed to load 1 asset (a): HTTP response error 404: not found")
  }

  private func notFound(_ assetKey: String) -> AssetLoadFailure {
    return AssetLoadFailure(assetKey: assetKey, error: .fileDownloaderHTTPResponseError(statusCode: 404, body: "not found"))
  }
}
