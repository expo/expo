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
    loadingState = .loading

    do {
      let sourceMap = try await service.fetchSourceMap()
      self.sourceMap = sourceMap
      self.fileTree = service.buildFileTree(from: sourceMap)
      loadingState = .loaded(sourceMap)
    } catch let error as SourceMapError {
      loadingState = .error(error)
    } catch {
      loadingState = .error(.networkError(error))
    }
  }

  var sourceMapStats: (files: Int, totalSize: String)? {
    guard case .loaded(let sourceMap) = loadingState else { return nil }

    let fileCount = sourceMap.sources.count
    let totalChars = sourceMap.sourcesContent?.compactMap { $0?.count }.reduce(0, +) ?? 0
    let sizeString = ByteCountFormatter.string(fromByteCount: Int64(totalChars), countStyle: .file)

    return (fileCount, sizeString)
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
        if node.name.lowercased().contains(searchText) || node.path.lowercased().contains(searchText) {
          results.append(node)
        }
      }
    }

    return results
  }
}
