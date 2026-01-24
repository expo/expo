// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Represents the parsed source map from Metro bundler
struct SourceMap: Codable {
  let version: Int
  let sources: [String]
  let sourcesContent: [String?]?
  let mappings: String
  let names: [String]
}

/// Represents a node in the file tree (file or directory)
struct FileTreeNode: Identifiable, Hashable {
  let id: UUID
  let name: String
  let path: String
  let isDirectory: Bool
  var children: [FileTreeNode]
  let contentIndex: Int?

  init(name: String, path: String, isDirectory: Bool, children: [FileTreeNode] = [], contentIndex: Int? = nil) {
    self.id = UUID()
    self.name = name
    self.path = path
    self.isDirectory = isDirectory
    self.children = children
    self.contentIndex = contentIndex
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
  case loaded(SourceMap)
  case error(SourceMapError)
}

/// Errors that can occur when fetching source maps
enum SourceMapError: Error, LocalizedError {
  case noBundleURL
  case invalidSourceMapURL
  case networkError(Error)
  case parseError(Error)
  case httpError(Int)

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
    }
  }
}
