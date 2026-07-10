// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@MainActor
class SourceMapService {
  private let devMenuManager = DevMenuManager.shared

  // MARK: - Snack Detection

  /// Parses the manifest URL to extract Snack parameters
  private func parseSnackParams() -> (snackId: String?, channel: String?) {
    guard let manifestURL = devMenuManager.currentManifestURL,
          let components = URLComponents(url: manifestURL, resolvingAgainstBaseURL: false) else {
      return (nil, nil)
    }

    let snackId = components.queryItems?.first(where: { $0.name == "snack" })?.value
    let channel = components.queryItems?.first(where: { $0.name == "snack-channel" })?.value

    return (snackId, channel)
  }

  /// Checks if a URL is an EAS CDN URL (assets.eascdn.net)
  private func isEASCDNURL(_ url: URL) -> Bool {
    return url.host == "assets.eascdn.net"
  }

  /// Constructs the source map URL from the bundle URL
  /// Bundle: http://localhost:8081/index.bundle?platform=ios&dev=true
  /// SourceMap: http://localhost:8081/index.map?platform=ios&dev=true
  func getSourceMapURL() -> URL? {
    guard let bundleURL = devMenuManager.currentBundleURL else {
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

  // MARK: - Expo Go Integration via EXKernel

  /// Gets the loaded bundle data directly from the app loader.
  /// This is the JS bundle that EXKernel loaded for the current app.
  private func getLoadedBundleData() -> Data? {
    return EXKernel.sharedInstance().visibleApp.appLoader.bundle as Data?
  }

  // MARK: - Snack Session Integration

  /// Gets the current snack channel from the manifest URL
  private static func getCurrentChannel() -> String? {
    guard let manifestURL = DevMenuManager.shared.currentManifestURL,
          let components = URLComponents(url: manifestURL, resolvingAgainstBaseURL: false) else {
      return nil
    }
    return components.queryItems?.first(where: { $0.name == "snack-channel" })?.value
  }

  /// Sends a file update through the active Snack session
  /// - Returns: true if a session accepted the edit, false if no active session
  static func sendSnackFileUpdate(path: String, oldContents: String, newContents: String) -> Bool {
    guard let currentChannel = getCurrentChannel(),
          SnackEditingSession.shared.channel == currentChannel else {
      return false
    }
    return SnackEditingSession.shared.sendFileUpdate(path: path, oldContents: oldContents, newContents: newContents)
  }

  /// Checks if there's an active Snack session for the current snack
  static var hasActiveSnackSession: Bool {
    guard let currentChannel = getCurrentChannel() else {
      return false
    }
    return SnackEditingSession.shared.hasActiveSession(forChannel: currentChannel)
  }

  /// Fetches source files from a live Snack session via Snackpub
  private func fetchSnackSourceMapFromSession(channel: String) async throws -> SourceMap {
    let session = SnackEditingSession.shared

    // No session for this channel yet (snack opened via deep link) - join as viewer
    if !session.hasActiveSession(forChannel: channel) {
      let isStaging = devMenuManager.currentManifestURL?.absoluteString.contains("staging") == true
      try await session.setupViewerSession(channel: channel, isStaging: isStaging)
    }

    guard let files = session.currentFiles, !files.isEmpty else {
      throw SourceMapError.noSourceMapFound
    }
    return buildSourceMap(from: files)
  }

  private func buildSourceMap(from files: [String: SnackFile]) -> SourceMap {
    let sources = files.keys.sorted()
    let sourcesContent = sources.map { files[$0]?.contents }

    return SourceMap(
      version: 3,
      sources: sources,
      sourcesContent: sourcesContent,
      mappings: "",
      names: []
    )
  }

  // MARK: - Snack API Integration

  /// Fetches source files from Snack API and builds a SourceMap
  private func fetchSnackSourceMap(snackId: String) async throws -> SourceMap {
    let isStaging = devMenuManager.currentManifestURL?.absoluteString.contains("staging") == true

    let snackResponse: SnackAPIResponse
    do {
      snackResponse = try await SnackAPIClient.fetch(snackId: snackId, isStaging: isStaging)
    } catch SnackAPIError.invalidSnackId(let id) {
      throw SourceMapError.invalidSnackId(id)
    } catch SnackAPIError.httpError(let code) {
      throw SourceMapError.httpError(code)
    }

    // Build SourceMap from Snack files (excluding assets)
    let codeFiles = snackResponse.code.filter { $0.value.type == "CODE" }
    let sources = codeFiles.keys.sorted()
    let sourcesContent = sources.map { codeFiles[$0]?.contents }

    return SourceMap(
      version: 3,
      sources: sources,
      sourcesContent: sourcesContent,
      mappings: "",
      names: []
    )
  }

  // MARK: - Source Map Fetching

  /// Fetches and parses the source map, trying multiple strategies
  func fetchSourceMap() async throws -> SourceMap {
    // Strategy 0: Check if running a Snack
    let (snackId, channel) = parseSnackParams()

    // Strategy 0a: If we have an active session with files, use those (preserves edits)
    if let channel = channel {
      if let snackSourceMap = try? await fetchSnackSourceMapFromSession(channel: channel) {
        return snackSourceMap
      }
    }

    // Strategy 0b: If we have a snack ID but no session, fetch from Snack API
    if let snackId = snackId {
      if let snackSourceMap = try? await fetchSnackSourceMap(snackId: snackId) {
        return snackSourceMap
      }
    }

    let bundleURL = devMenuManager.currentBundleURL

    // Strategy 1: If the bundle is from Metro dev server, try to fetch external .map file
    if let bundleURL = bundleURL,
       !bundleURL.isFileURL,
       !isEASCDNURL(bundleURL),
       let externalSourceMap = try? await fetchExternalSourceMap() {
      return externalSourceMap
    }

    // Strategy 2: Extract inline source map from the loaded bundle data
    if let bundleData = getLoadedBundleData(),
       let bundleContent = String(data: bundleData, encoding: .utf8) {
      return try extractInlineSourceMap(from: bundleContent)
    }

    throw SourceMapError.noSourceMapFound
  }

  /// Attempts to fetch an external .map file (used in dev mode)
  private func fetchExternalSourceMap() async throws -> SourceMap {
    guard let sourceMapURL = getSourceMapURL() else {
      throw SourceMapError.invalidSourceMapURL
    }

    let (data, response) = try await URLSession.shared.data(from: sourceMapURL)

    if let httpResponse = response as? HTTPURLResponse,
       !(200...299).contains(httpResponse.statusCode) {
      throw SourceMapError.httpError(httpResponse.statusCode)
    }

    return try JSONDecoder().decode(SourceMap.self, from: data)
  }

  /// Extracts and decodes an inline source map from bundle content
  /// Looks for: //# sourceMappingURL=data:application/json;charset=utf-8;base64,<base64data>
  private func extractInlineSourceMap(from bundleContent: String) throws -> SourceMap {
    let patterns = [
      "//# sourceMappingURL=data:application/json;charset=utf-8;base64,",
      "//# sourceMappingURL=data:application/json;base64,"
    ]

    for pattern in patterns {
      if let range = bundleContent.range(of: pattern) {
        let base64Start = range.upperBound
        let endIndex = bundleContent[base64Start...].firstIndex(where: { $0.isNewline }) ?? bundleContent.endIndex
        let base64String = String(bundleContent[base64Start..<endIndex])

        guard let decodedData = Data(base64Encoded: base64String) else {
          throw SourceMapError.invalidInlineSourceMap
        }

        do {
          return try JSONDecoder().decode(SourceMap.self, from: decodedData)
        } catch {
          throw SourceMapError.parseError(error)
        }
      }
    }

    throw SourceMapError.noSourceMapFound
  }

  // MARK: - File Tree Building
  private class Node {
    let name: String
    let path: String
    var children: [String: Node] = [:]
    var contentIndex: Int?
    let isDirectory: Bool

    init(name: String, path: String, isDirectory: Bool, contentIndex: Int? = nil) {
      self.name = name
      self.path = path
      self.isDirectory = isDirectory
      self.contentIndex = contentIndex
    }
  }

  private var isSnackProject: Bool {
    let (snackId, channel) = parseSnackParams()
    return snackId != nil || channel != nil
  }

  /// Builds a file tree from the source map sources array
  func buildFileTree(from sourceMap: SourceMap) async -> [FileTreeNode] {
    let root = Node(name: "", path: "", isDirectory: true)

    for (index, sourcePath) in sourceMap.sources.enumerated() {
      insertPath(sourcePath, contentIndex: index, into: root)
    }

    let nodes = root.children.values.map { convertToNode($0) }
    let sorted = sortNodes(nodes)
    var collapsed = collapseSingleChildFolders(sorted)

    // For non-Snack projects, unwrap single top-level directory to start at project root
    if !isSnackProject {
      let directories = collapsed.filter { $0.isDirectory }
      if directories.count == 1, let mainDir = directories.first {
        collapsed = mainDir.children
      }
    }

    return collapsed
  }

  private func convertToNode(_ builder: Node) -> FileTreeNode {
    FileTreeNode(
      name: builder.name,
      path: builder.path,
      isDirectory: builder.isDirectory,
      children: builder.children.values.map { convertToNode($0) },
      contentIndex: builder.contentIndex
    )
  }

  /// Collapses folder chains that have only a single child folder
  private func collapseSingleChildFolders(_ nodes: [FileTreeNode]) -> [FileTreeNode] {
    return nodes.map { node in
      var current = node

      // Don't collapse ".." directory - keep it as a container for modules
      while current.isDirectory && current.children.count == 1 && current.children[0].isDirectory && current.name != ".." {
        let child = current.children[0]
        current = FileTreeNode(
          name: child.name,
          path: child.path,
          isDirectory: true,
          children: child.children,
          contentIndex: nil
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

  private func insertPath(_ path: String, contentIndex: Int, into parent: Node) {
    var components = path.split(separator: "/").map(String.init)
    guard !components.isEmpty else { return }

    // Skip files starting with "app?ctx="
    if let last = components.last, last.hasPrefix("app?ctx=") {
      return
    }

    // Move node_modules into a ".." directory and rename to "modules"
    components = components.flatMap { $0 == "node_modules" ? ["..", "modules"] : [$0] }

    var current = parent
    let lastIndex = components.count - 1

    for (index, component) in components.enumerated() {
      let isLast = index == lastIndex

      if let existing = current.children[component] {
        current = existing
      } else {
        let newNode = Node(
          name: component,
          path: components[0...index].joined(separator: "/"),
          isDirectory: !isLast,
          contentIndex: isLast ? contentIndex : nil
        )
        current.children[component] = newNode
        current = newNode
      }
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
