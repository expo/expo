// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Where an edit goes when the user saves: a live snack session, or a
/// published bundle patched via PublishedBundleApplier. The session owns the
/// overlay; appliers own delivery.
@MainActor
protocol EditApplier: AnyObject {
  var canEdit: Bool { get }
  func submit(path: String, original: String, previous: String, newContents: String) -> Bool
  func revertAll()
}

@MainActor
final class SnackEditApplier: EditApplier {
  private let channel: String

  init(channel: String) {
    self.channel = channel
  }

  var canEdit: Bool {
    SnackEditingSession.shared.hasActiveSession(forChannel: channel)
  }

  func submit(path: String, original: String, previous: String, newContents: String) -> Bool {
    guard canEdit else { return false }
    return SnackEditingSession.shared.sendFileUpdate(
      path: path, oldContents: previous, newContents: newContents)
  }

  func revertAll() {}
}

@MainActor
final class PublishedEditApplier: EditApplier {
  /// Closures cross into a detached task and back; the actual calls stay on
  /// the main actor (reload/onError run via MainActor.run, makeApplier is
  /// @Sendable). @unchecked Sendable because the closures' captured state
  /// (overlay-owning session) is only ever touched from the main actor.
  struct Environment: @unchecked Sendable {
    let scopeKey: () -> String?
    /// Built lazily on first use; heavy (bundle scan + payload evaluation).
    let makeApplier: @Sendable () async throws -> PublishedBundleApplier
    let reload: () -> Void
    let onError: (String?) -> Void
  }

  private let overlay: EditOverlay
  private let environment: Environment
  private var applierTask: Task<PublishedBundleApplier, Error>?

  init(overlay: EditOverlay, environment: Environment) {
    self.overlay = overlay
    self.environment = environment
  }

  var canEdit: Bool { true }

  func submit(path: String, original: String, previous: String, newContents: String) -> Bool {
    applyAllEdits()
    return true
  }

  func revertAll() {
    applyAllEdits()
  }

  /// Rebuilds the patched bundle from the overlay's full edit set. An empty
  /// set drops the patch and relaunches the pristine bundle.
  private func applyAllEdits() {
    guard let scopeKey = environment.scopeKey() else { return }
    environment.onError(nil)
    let edits = overlay.edits.map {
      PublishedBundleApplier.SourceEdit(
        displayPath: $0.key, contents: $0.value.current, originalContents: $0.value.original)
    }

    guard !edits.isEmpty else {
      PatchedBundleRegistry.clear()
      environment.reload()
      return
    }

    let applierTask = ensureApplier()
    let environment = self.environment
    Task.detached(priority: .userInitiated) {
      do {
        let applier = try await applierTask.value
        _ = try applier.apply(edits: edits, scopeKey: scopeKey)
        await MainActor.run { environment.reload() }
      } catch {
        let message = error.localizedDescription
        await MainActor.run { environment.onError(message) }
      }
    }
  }

  private func ensureApplier() -> Task<PublishedBundleApplier, Error> {
    if let applierTask {
      return applierTask
    }
    let make = environment.makeApplier
    let task = Task.detached(priority: .userInitiated) { try await make() }
    applierTask = task
    return task
  }
}
