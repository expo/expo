// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Represents a node in the file tree (file or directory)
struct FileTreeNode: Identifiable, Hashable {
  var id: String { path }
  let name: String
  let path: String
  let isDirectory: Bool
  var children: [FileTreeNode]

  let searchableName: String
  let searchablePath: String

  init(name: String, path: String, isDirectory: Bool, children: [FileTreeNode] = []) {
    self.name = name
    self.path = path
    self.isDirectory = isDirectory
    self.children = children
    self.searchableName = name.lowercased()
    self.searchablePath = path.lowercased()
  }

  func hash(into hasher: inout Hasher) {
    hasher.combine(id)
  }

  static func == (lhs: FileTreeNode, rhs: FileTreeNode) -> Bool {
    lhs.id == rhs.id
  }
}

/// Loading states for the source map explorer
enum SourceMapLoadingState {
  case idle
  case loading
  case loaded
  case error(SourceMapError)
}

/// Errors that can occur when fetching source maps
enum SourceMapError: Error, LocalizedError {
  case noBundleURL
  case invalidSourceMapURL
  case networkError(Error)
  case parseError(Error)
  case httpError(Int)
  case noSourceMapFound
  case invalidInlineSourceMap
  case invalidSnackId(String)
  case hermesBytecodeBundle

  var errorDescription: String? {
    switch self {
    case .noBundleURL:
      return "No bundle URL available. Make sure the app is connected to Metro."
    case .invalidSourceMapURL:
      return "Could not construct source map URL."
    case .networkError(let error):
      return "Network error: \(error.localizedDescription)"
    case .parseError(let error):
      return "Failed to parse source map: \(error.localizedDescription)"
    case .httpError(let code):
      return "HTTP error: \(code)"
    case .noSourceMapFound:
      return "No source map found. Enable inline source maps in your Metro config or ensure the bundle is stored locally."
    case .invalidInlineSourceMap:
      return "Found inline source map but failed to decode it."
    case .invalidSnackId(let id):
      return "The Snack ID \"\(id)\" from the project link isn't a valid identifier, so its code can't be fetched. Check the link or QR code used to open this Snack."
    case .hermesBytecodeBundle:
      return "This project is running compiled Hermes bytecode, which has no readable source. Publish the update with plain JavaScript and inline source maps (eas update --no-bytecode --source-maps inline) to view its source here."
    }
  }
}
