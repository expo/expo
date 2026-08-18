// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// The parsed source of a project: a folder hierarchy for browsing, a flat
/// file index for search, and contents addressable by display path.
struct SourceTree: Sendable {
  /// Hierarchical nodes for the folder browser.
  let rootNodes: [FileTreeNode]

  /// Leaf (file) nodes only, in tree order - search filters this directly.
  let flatFiles: [FileTreeNode]

  private let contentsByPath: [String: String]

  init(rootNodes: [FileTreeNode], flatFiles: [FileTreeNode], contentsByPath: [String: String]) {
    self.rootNodes = rootNodes
    self.flatFiles = flatFiles
    self.contentsByPath = contentsByPath
  }

  /// Contents for a node's display path; nil when the sourcemap carried no
  /// content for the file.
  func contents(forPath path: String) -> String? {
    contentsByPath[path]
  }
}

enum SourceTreeBuilder {
  private final class Node {
    let name: String
    let path: String
    var children: [String: Node] = [:]
    let isDirectory: Bool

    init(name: String, path: String, isDirectory: Bool) {
      self.name = name
      self.path = path
      self.isDirectory = isDirectory
    }
  }

  /// Builds a SourceTree from sourcemap-style (path, contents) pairs.
  /// Nonisolated and pure - awaiting this from the main actor runs it on the
  /// cooperative pool.
  static func build(sources: [(path: String, contents: String?)], unwrapSingleRoot: Bool) -> SourceTree {
    let root = Node(name: "", path: "", isDirectory: true)
    var contentsByPath: [String: String] = [:]

    for (sourcePath, contents) in sources {
      guard let displayPath = insert(sourcePath, into: root) else {
        continue
      }
      if let contents {
        contentsByPath[displayPath] = contents
      }
    }

    let nodes = root.children.values.map(convert)
    let sorted = sort(nodes)
    var collapsed = collapseSingleChildFolders(sorted)

    // Start non-snack projects at the project root instead of a single wrapper dir
    if unwrapSingleRoot, collapsed.count == 1, let only = collapsed.first, only.isDirectory {
      collapsed = only.children
    }

    var flat: [FileTreeNode] = []
    collectFiles(collapsed, into: &flat)

    return SourceTree(rootNodes: collapsed, flatFiles: flat, contentsByPath: contentsByPath)
  }

  /// Display-path components for a sourcemap source path (nil when the
  /// source should be skipped). Shared with anything that needs to key
  /// data by the same display paths the tree uses.
  static func displayComponents(forSourcePath path: String) -> [String]? {
    var components = path.split(separator: "/").map(String.init)
    guard !components.isEmpty else {
      return nil
    }

    // Skip Metro's virtual context modules
    if let last = components.last, last.hasPrefix("app?ctx=") {
      return nil
    }

    // Hoist the first node_modules segment into "../modules"; deeper nested
    // node_modules stay in place under their parent package.
    if let first = components.firstIndex(of: "node_modules") {
      components.replaceSubrange(first...first, with: ["..", "modules"])
    }

    return components
  }

  private static func insert(_ path: String, into root: Node) -> String? {
    guard let components = displayComponents(forSourcePath: path) else {
      return nil
    }

    var current = root
    let lastIndex = components.count - 1

    for (index, component) in components.enumerated() {
      let isLast = index == lastIndex

      if let existing = current.children[component] {
        current = existing
      } else {
        let newNode = Node(
          name: component,
          path: components[0...index].joined(separator: "/"),
          isDirectory: !isLast
        )
        current.children[component] = newNode
        current = newNode
      }
    }

    return components.joined(separator: "/")
  }

  private static func convert(_ builder: Node) -> FileTreeNode {
    FileTreeNode(
      name: builder.name,
      path: builder.path,
      isDirectory: builder.isDirectory,
      children: builder.children.values.map(convert)
    )
  }

  private static func sort(_ nodes: [FileTreeNode]) -> [FileTreeNode] {
    var sorted = nodes.sorted { node1, node2 in
      if node1.isDirectory != node2.isDirectory {
        return node1.isDirectory
      }
      return node1.name.localizedCaseInsensitiveCompare(node2.name) == .orderedAscending
    }

    for i in sorted.indices {
      sorted[i].children = sort(sorted[i].children)
    }

    return sorted
  }

  /// Collapses folder chains that have only a single child folder.
  /// The ".." modules container is never collapsed away.
  private static func collapseSingleChildFolders(_ nodes: [FileTreeNode]) -> [FileTreeNode] {
    return nodes.map { node in
      var current = node

      while current.isDirectory && current.children.count == 1 && current.children[0].isDirectory && current.name != ".." {
        let child = current.children[0]
        current = FileTreeNode(
          name: child.name,
          path: child.path,
          isDirectory: true,
          children: child.children
        )
      }

      if current.isDirectory && !current.children.isEmpty {
        var collapsed = current
        collapsed.children = collapseSingleChildFolders(current.children)
        return collapsed
      }

      return current
    }
  }

  private static func collectFiles(_ nodes: [FileTreeNode], into result: inout [FileTreeNode]) {
    for node in nodes {
      if node.isDirectory {
        collectFiles(node.children, into: &result)
      } else {
        result.append(node)
      }
    }
  }
}
