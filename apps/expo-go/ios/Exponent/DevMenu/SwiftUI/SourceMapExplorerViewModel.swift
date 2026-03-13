// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Combine

@MainActor
class SourceMapExplorerViewModel: ObservableObject {
  @Published var loadingState: SourceMapLoadingState = .idle
  @Published var fileTree: [FileTreeNode] = []
  @Published var searchText: String = ""

  private let service = SourceMapService()
  private(set) var sourceMap: SourceMap?

  var filteredFileTree: [FileTreeNode] {
    guard !searchText.isEmpty else { return fileTree }
    // When searching, flatten to show matching files directly
    return findMatchingFiles(in: fileTree, searchText: searchText.lowercased())
  }

  func loadSourceMap() async {
    if case .loaded = loadingState { return }

    loadingState = .loading

    do {
      let sourceMap = try await service.fetchSourceMap()
      self.sourceMap = sourceMap
      self.fileTree = await service.buildFileTree(from: sourceMap)
      loadingState = .loaded(sourceMap)
    } catch let error as SourceMapError {
      loadingState = .error(error)
    } catch {
      loadingState = .error(.networkError(error))
    }
  }

  /// Finds all matching files and returns them as a flat list with full paths
  private func findMatchingFiles(in nodes: [FileTreeNode], searchText: String) -> [FileTreeNode] {
    var results: [FileTreeNode] = []

    for node in nodes {
      if node.isDirectory {
        // Recursively search children
        results.append(contentsOf: findMatchingFiles(in: node.children, searchText: searchText))
      } else {
        // Check if file name or path matches
        if node.searchableName.contains(searchText) || node.searchablePath.contains(searchText) {
          results.append(node)
        }
      }
    }

    return results
  }
}
