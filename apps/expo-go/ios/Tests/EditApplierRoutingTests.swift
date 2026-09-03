// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

@MainActor
final class EditApplierRoutingTests: XCTestCase {
  func testPublishedApplierRefusalPublishesError() async throws {
    let overlay = EditOverlay()
    var reloaded = false
    var publishedError: String?
    let errorPublished = expectation(description: "published edit error")
    let applier = PublishedEditApplier(
      overlay: overlay,
      environment: .init(
        scopeKey: { "scope" },
        makeApplier: { throw PublishedBundleApplier.ApplyError.moduleNotFound("app/App.tsx") },
        reload: { reloaded = true },
        onError: {
          publishedError = $0
          if $0 != nil {
            errorPublished.fulfill()
          }
        }
      ))

    // Mirrors ProjectSourceSession.submitEdit: the overlay is populated
    // before the applier runs, so applyAllEdits sees a non-empty edit set
    // and actually exercises the throwing makeApplier path below.
    overlay.recordEdit(path: "app/App.tsx", original: "a", newContents: "b")
    XCTAssertTrue(applier.submit(path: "app/App.tsx", original: "a", previous: "a", newContents: "b"))
    await fulfillment(of: [errorPublished], timeout: 1.0)
    XCTAssertNotNil(publishedError)
    XCTAssertFalse(reloaded)
  }

  func testRevertAllWithNoEditsClearsAndReloads() async throws {
    let overlay = EditOverlay()
    var reloaded = false
    let applier = PublishedEditApplier(
      overlay: overlay,
      environment: .init(
        scopeKey: { "scope" },
        makeApplier: { throw PublishedBundleApplier.ApplyError.moduleNotFound("x") },
        reload: { reloaded = true },
        onError: { _ in }
      ))
    applier.revertAll()
    XCTAssertTrue(reloaded)
    XCTAssertNil(PatchedBundleRegistry.interceptor(forScopeKey: "scope"))
  }

  func testInvalidationSuppressesPendingPublishedEditFailure() async throws {
    let overlay = EditOverlay()
    var reloaded = false
    var publishedError: String?
    let lateFailure = expectation(description: "late edit failure is ignored")
    lateFailure.isInverted = true
    let applier = PublishedEditApplier(
      overlay: overlay,
      environment: .init(
        scopeKey: { "scope" },
        makeApplier: {
          try await Task.sleep(nanoseconds: 100_000_000)
          throw PublishedBundleApplier.ApplyError.moduleNotFound("app/App.tsx")
        },
        reload: { reloaded = true },
        onError: {
          publishedError = $0
          if $0 != nil {
            lateFailure.fulfill()
          }
        }
      ))

    overlay.recordEdit(path: "app/App.tsx", original: "a", newContents: "b")
    XCTAssertTrue(applier.submit(path: "app/App.tsx", original: "a", previous: "a", newContents: "b"))
    applier.invalidate()

    await fulfillment(of: [lateFailure], timeout: 0.25)
    XCTAssertNil(publishedError)
    XCTAssertFalse(reloaded)
    XCTAssertNil(PatchedBundleRegistry.interceptor(forScopeKey: "scope"))
  }
}
