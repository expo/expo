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
    return filterNodes(fileTree, searchText: searchText.lowercased())
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

  private func filterNodes(_ nodes: [FileTreeNode], searchText: String) -> [FileTreeNode] {
    var result: [FileTreeNode] = []

    for node in nodes {
      if node.name.lowercased().contains(searchText) {
        result.append(node)
      } else if node.isDirectory {
        let filteredChildren = filterNodes(node.children, searchText: searchText)
        if !filteredChildren.isEmpty {
          var filteredNode = node
          filteredNode.children = filteredChildren
          result.append(filteredNode)
        }
      }
    }

    return result
  }
}
