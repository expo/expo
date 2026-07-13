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
  func invalidate()
}

extension EditApplier {
  func invalidate() {}
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
  private var applyTask: Task<Void, Never>?
  private var generation = 0

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

  func invalidate() {
    generation += 1
    applyTask?.cancel()
    applyTask = nil
    applierTask?.cancel()
    applierTask = nil
  }

  /// Rebuilds the patched bundle from the overlay's full edit set. An empty
  /// set drops the patch and relaunches the pristine bundle.
  private func applyAllEdits() {
    environment.onError(nil)
    guard let scopeKey = environment.scopeKey() else { return }
    generation += 1
    let requestGeneration = generation
    applyTask?.cancel()

    let edits = overlay.edits.map {
      PublishedBundleApplier.SourceEdit(
        displayPath: $0.key, contents: $0.value.current, originalContents: $0.value.original)
    }

    guard !edits.isEmpty else {
      applyTask = nil
      PatchedBundleRegistry.clear()
      environment.reload()
      return
    }

    let applierTask = ensureApplier()
    let environment = self.environment
    applyTask = Task.detached(priority: .userInitiated) { [weak self] in
      do {
        let applier = try await applierTask.value
        try Task.checkCancellation()
        let url = try applier.prepare(edits: edits)
        guard !Task.isCancelled else {
          try? FileManager.default.removeItem(at: url)
          return
        }
        await MainActor.run {
          guard let self,
                self.generation == requestGeneration,
                environment.scopeKey() == scopeKey else {
            try? FileManager.default.removeItem(at: url)
            return
          }
          PatchedBundleRegistry.setPatchedBundleURL(url, forScopeKey: scopeKey)
          self.applyTask = nil
          environment.reload()
        }
      } catch is CancellationError {
        return
      } catch {
        let message = error.localizedDescription
        await MainActor.run {
          guard let self, self.generation == requestGeneration else { return }
          self.applyTask = nil
          self.applierTask = nil
          environment.onError(message)
        }
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
