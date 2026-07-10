// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Combine

@MainActor
class SourceMapExplorerViewModel: ObservableObject {
  @Published var loadingState: SourceMapLoadingState = .idle
  @Published var fileTree: [FileTreeNode] = []
  @Published var searchText: String = ""

  private var flatFiles: [FileTreeNode] = []

  var filteredFileTree: [FileTreeNode] {
    guard !searchText.isEmpty else { return fileTree }
    let needle = searchText.lowercased()
    return flatFiles.filter {
      $0.searchableName.contains(needle) || $0.searchablePath.contains(needle)
    }
  }

  func loadSource() async {
    if case .loaded = loadingState { return }

    guard let session = ProjectSourceSession.current else {
      loadingState = .error(.noBundleURL)
      return
    }
    loadingState = .loading

    do {
      let tree = try await session.loadSource()
      self.fileTree = tree.rootNodes
      self.flatFiles = tree.flatFiles
      loadingState = .loaded
    } catch let error as SourceMapError {
      loadingState = .error(error)
    } catch {
      loadingState = .error(.networkError(error))
    }
  }
}
