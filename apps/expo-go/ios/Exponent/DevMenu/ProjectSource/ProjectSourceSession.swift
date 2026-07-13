// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Combine

/// Everything about the currently running project's source: where it comes
/// from, the parsed tree (cached for the session), and local edits. Created
/// when a project opens, destroyed on go-home - so caches and edits have
/// exactly the project's lifetime.
@MainActor
final class ProjectSourceSession: ObservableObject {
  static private(set) var current: ProjectSourceSession?

  static func begin() {
    current = ProjectSourceSession()
  }

  static func end() {
    current = nil
    PatchedBundleRegistry.clear()
  }

  let overlay = EditOverlay()
  @Published private(set) var tree: SourceTree?

  /// Human-readable reason the last published-project apply was refused;
  /// nil while idle or after a successful apply.
  @Published private(set) var publishedEditError: String?

  private var loadTask: Task<SourceTree, Error>?
  private var cancellables: Set<AnyCancellable> = []

  init() {
    // Snack code can change under us (web editor peers); drop the cached
    // tree so the next explorer open rebuilds from current files.
    NotificationCenter.default.publisher(for: SnackEditingSession.codeDidChangeNotification)
      .receive(on: DispatchQueue.main)
      .sink { [weak self] _ in
        self?.tree = nil
        self?.loadTask = nil
      }
      .store(in: &cancellables)
  }

  func loadSource() async throws -> SourceTree {
    if let tree {
      return tree
    }
    if let loadTask {
      return try await loadTask.value
    }

    let provider = SourceProviderSelector.provider(
      manifestURL: DevMenuManager.shared.currentManifestURL,
      bundleURL: DevMenuManager.shared.currentBundleURL,
      loadBundleData: { await MainActor.run { EXKernel.sharedInstance().visibleApp.appLoader.bundle as Data? } }
    )

    let task = Task { try await provider.loadSource() }
    loadTask = task

    do {
      let result = try await task.value
      tree = result
      return result
    } catch {
      loadTask = nil
      throw error
    }
  }

  func content(forPath path: String) -> String? {
    overlay.currentContents(forPath: path) ?? tree?.contents(forPath: path)
  }

  private var editApplier: EditApplier?

  private func currentEditApplier() -> EditApplier? {
    if let editApplier {
      return editApplier
    }
    let manifestURL = DevMenuManager.shared.currentManifestURL
    if let channel = SourceProviderSelector.snackParams(from: manifestURL).channel {
      editApplier = SnackEditApplier(channel: channel)
    } else if SourceProviderSelector.isPublishedBundle(
      manifestURL: manifestURL, bundleURL: DevMenuManager.shared.currentBundleURL) {
      editApplier = PublishedEditApplier(
        overlay: overlay,
        environment: .init(
          scopeKey: { EXKernel.sharedInstance().visibleApp.scopeKey },
          makeApplier: {
            guard let bundleData = await MainActor.run(body: {
              EXKernel.sharedInstance().visibleApp.appLoader.bundle as Data?
            }) else {
              throw SourceMapError.noSourceMapFound
            }
            return try PublishedBundleApplier(bundleData: bundleData, transformer: try OnDeviceTransformer())
          },
          reload: { DevMenuManager.shared.reload() },
          onError: { [weak self] message in self?.publishedEditError = message }
        ))
    }
    return editApplier
  }

  /// True when edits actually apply somewhere: an active snack session for
  /// the current project's channel, or a published bundle we can patch.
  var canEdit: Bool {
    currentEditApplier()?.canEdit ?? false
  }

  @discardableResult
  func submitEdit(path: String, newContents: String) -> Bool {
    guard let original = tree?.contents(forPath: path) else { return false }
    let previous = content(forPath: path) ?? original
    guard let applier = currentEditApplier(), applier.canEdit else { return false }

    overlay.recordEdit(path: path, original: original, newContents: newContents)
    return applier.submit(path: path, original: original, previous: previous, newContents: newContents)
  }

  func revertAllEdits() {
    overlay.revertAll()
    currentEditApplier()?.revertAll()
  }
}
