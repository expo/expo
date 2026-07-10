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
  }

  let overlay = EditOverlay()
  @Published private(set) var tree: SourceTree?

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

  /// True when edits actually apply somewhere (an active snack session for
  /// the current project's channel). Published projects gain this in a later
  /// phase.
  var canEdit: Bool {
    guard let channel = Self.currentChannel() else { return false }
    return SnackEditingSession.shared.hasActiveSession(forChannel: channel)
  }

  @discardableResult
  func submitEdit(path: String, newContents: String) -> Bool {
    guard let original = tree?.contents(forPath: path) else { return false }
    let previous = content(forPath: path) ?? original
    guard canEdit else { return false }

    overlay.recordEdit(path: path, original: original, newContents: newContents)
    return SnackEditingSession.shared.sendFileUpdate(
      path: path,
      oldContents: previous,
      newContents: newContents
    )
  }

  private static func currentChannel() -> String? {
    SourceProviderSelector.snackParams(from: DevMenuManager.shared.currentManifestURL).channel
  }
}
