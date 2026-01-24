// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@MainActor
class SourceMapService {
  private let devMenuManager = DevMenuManager.shared

  /// Constructs the source map URL from the bundle URL
  /// Bundle: http://localhost:8081/index.bundle?platform=ios&dev=true
  /// SourceMap: http://localhost:8081/index.map?platform=ios&dev=true
  func getSourceMapURL() -> URL? {
    guard let bundleURL = devMenuManager.currentBridge?.bundleURL else {
      return nil
    }

    var urlString = bundleURL.absoluteString

    // Replace .bundle with .map
    if urlString.contains(".bundle") {
      urlString = urlString.replacingOccurrences(of: ".bundle", with: ".map")
    } else {
      // If no .bundle extension, insert .map before query params
      if let queryIndex = urlString.firstIndex(of: "?") {
        urlString.insert(contentsOf: ".map", at: queryIndex)
      } else {
        urlString += ".map"
      }
    }

    return URL(string: urlString)
  }

  /// Fetches and parses the source map from Metro
  func fetchSourceMap() async throws -> SourceMap {
    guard let sourceMapURL = getSourceMapURL() else {
      throw SourceMapError.noBundleURL
    }

    do {
      let (data, response) = try await URLSession.shared.data(from: sourceMapURL)

      if let httpResponse = response as? HTTPURLResponse,
         !(200...299).contains(httpResponse.statusCode) {
        throw SourceMapError.httpError(httpResponse.statusCode)
      }

      let sourceMap = try JSONDecoder().decode(SourceMap.self, from: data)
      return sourceMap
    } catch let error as SourceMapError {
      throw error
    } catch let error as DecodingError {
      throw SourceMapError.parseError(error)
    } catch {
      throw SourceMapError.networkError(error)
    }
  }

  /// Builds a file tree from the source map sources array
  func buildFileTree(from sourceMap: SourceMap) -> [FileTreeNode] {
    var rootChildren: [String: FileTreeNode] = [:]

    for (index, sourcePath) in sourceMap.sources.enumerated() {
      insertPath(sourcePath, contentIndex: index, into: &rootChildren)
    }

    let sorted = sortNodes(Array(rootChildren.values))
    return collapseSingleChildFolders(sorted)
  }

  /// Collapses folder chains that have only a single child folder
  /// e.g., Users/evanbacon/Documents/GitHub becomes one expandable node
  private func collapseSingleChildFolders(_ nodes: [FileTreeNode]) -> [FileTreeNode] {
    return nodes.map { node in
      var current = node

      // Keep collapsing while we have a directory with exactly one child that's also a directory
      while current.isDirectory && current.children.count == 1 && current.children[0].isDirectory {
        let child = current.children[0]
        current = FileTreeNode(
          name: "\(current.name)/\(child.name)",
          path: child.path,
          isDirectory: true,
          children: child.children,
          contentIndex: nil
        )
      }

      // Recursively collapse children
      if current.isDirectory && !current.children.isEmpty {
        var collapsed = current
        collapsed.children = collapseSingleChildFolders(current.children)
        return collapsed
      }

      return current
    }
  }

  private func insertPath(_ path: String, contentIndex: Int, into nodes: inout [String: FileTreeNode]) {
    let components = path.split(separator: "/").map(String.init)
    guard !components.isEmpty else { return }

    let firstName = components[0]

    if components.count == 1 {
      // This is a file at this level
      nodes[firstName] = FileTreeNode(
        name: firstName,
        path: path,
        isDirectory: false,
        contentIndex: contentIndex
      )
    } else {
      // This is a directory
      var existingNode = nodes[firstName] ?? FileTreeNode(
        name: firstName,
        path: firstName,
        isDirectory: true
      )

      let remainingPath = components.dropFirst().joined(separator: "/")
      var childrenDict = Dictionary(uniqueKeysWithValues: existingNode.children.map { ($0.name, $0) })
      insertPath(remainingPath, contentIndex: contentIndex, into: &childrenDict)
      existingNode.children = Array(childrenDict.values)

      nodes[firstName] = existingNode
    }
  }

  private func sortNodes(_ nodes: [FileTreeNode]) -> [FileTreeNode] {
    var sorted = nodes.sorted { node1, node2 in
      if node1.isDirectory != node2.isDirectory {
        return node1.isDirectory
      }
      return node1.name.localizedCaseInsensitiveCompare(node2.name) == .orderedAscending
    }

    for i in sorted.indices {
      sorted[i].children = sortNodes(sorted[i].children)
    }

    return sorted
  }
}
