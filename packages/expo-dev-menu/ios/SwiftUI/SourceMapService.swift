// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import ObjectiveC

/// Response from Snack API
private struct SnackApiResponse: Codable {
  let id: String
  let hashId: String
  let code: [String: SnackApiFile]

  struct SnackApiFile: Codable {
    let type: String  // "CODE" or "ASSET"
    let contents: String
  }
}

class SourceMapService {
  private let devMenuManager = DevMenuManager.shared

  // Cache for Snack session client to keep connection alive
  private static var cachedSession: SnackSessionClient?
  private static var cachedSessionChannel: String?

  /// Clears the cached snack session. Call this on app reload.
  static func clearCache() {
    cachedSession = nil
    cachedSessionChannel = nil
    SnackEditingSession.shared.resetFiles()
  }

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

  /// Detects the Snack API host based on the manifest URL
  /// Returns staging host if URL contains "staging", otherwise production
  private func detectSnackApiHost() -> String {
    if let manifestURL = devMenuManager.currentManifestURL,
       manifestURL.absoluteString.contains("staging") {
      return "https://staging.exp.host"
    }
    return "https://exp.host"
  }

  /// Checks if a URL is an EAS CDN URL (assets.eascdn.net)
  private func isEASCDNURL(_ url: URL) -> Bool {
    return url.host == "assets.eascdn.net"
  }

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

  // MARK: - Expo Go Integration via EXKernel

  /// Gets the local bundle path from Expo Go's EXKernel
  /// Path: EXKernel.sharedInstance.visibleApp.appLoader.appLauncher.launchAssetUrl
  private func getLaunchAssetURLFromExpoGoKernel() -> URL? {
    guard let kernelClass = NSClassFromString("EXKernel") else {
      return nil
    }

    let sharedInstanceSelector = NSSelectorFromString("sharedInstance")
    guard let metaClass = object_getClass(kernelClass),
          class_respondsToSelector(metaClass, sharedInstanceSelector),
          let kernel = (kernelClass as AnyObject).perform(sharedInstanceSelector)?.takeUnretainedValue() else {
      return nil
    }

    guard let visibleApp = (kernel as AnyObject).value(forKey: "visibleApp"),
          let appLoader = (visibleApp as AnyObject).value(forKey: "appLoader"),
          let appLauncher = (appLoader as AnyObject).value(forKey: "appLauncher") else {
      return nil
    }

    let launchAssetUrlSelector = NSSelectorFromString("launchAssetUrl")
    if (appLauncher as AnyObject).responds(to: launchAssetUrlSelector),
       let url = (appLauncher as AnyObject).perform(launchAssetUrlSelector)?.takeUnretainedValue() as? URL {
      return url
    }

    return nil
  }

  // MARK: - expo-updates Integration via EXUpdatesInterface

  /// Gets the local file URL from UpdatesControllerRegistry (for dev clients)
  private func getLaunchAssetURLFromUpdatesController() -> URL? {
    guard let registryClass = NSClassFromString("EXUpdatesControllerRegistry") else {
      return nil
    }

    let sharedInstanceSelector = NSSelectorFromString("sharedInstance")
    guard let metaClass = object_getClass(registryClass),
          class_respondsToSelector(metaClass, sharedInstanceSelector),
          let registry = (registryClass as AnyObject).perform(sharedInstanceSelector)?.takeUnretainedValue(),
          let controller = (registry as AnyObject).value(forKey: "controller"),
          let launchAssetURL = (controller as AnyObject).value(forKey: "launchAssetURL") as? URL else {
      return nil
    }

    return launchAssetURL
  }

  /// Gets the local file URL from AppController (for standalone apps)
  private func getLaunchAssetURLFromAppController() -> URL? {
    guard let appControllerClass = NSClassFromString("EXUpdatesAppController") else {
      return nil
    }

    // Check if it's initialized
    let isInitializedSelector = NSSelectorFromString("isInitialized")
    if let metaClass = object_getClass(appControllerClass),
       class_respondsToSelector(metaClass, isInitializedSelector) {
      typealias IsInitializedMethod = @convention(c) (AnyClass, Selector) -> Bool
      let methodIMP = class_getMethodImplementation(metaClass, isInitializedSelector)
      let isInitialized = unsafeBitCast(methodIMP, to: IsInitializedMethod.self)(appControllerClass, isInitializedSelector)
      if !isInitialized {
        return nil
      }
    }

    let sharedInstanceSelector = NSSelectorFromString("sharedInstance")
    guard let metaClass = object_getClass(appControllerClass),
          class_respondsToSelector(metaClass, sharedInstanceSelector),
          let controller = (appControllerClass as AnyObject).perform(sharedInstanceSelector)?.takeUnretainedValue() else {
      return nil
    }

    let launchAssetUrlSelector = NSSelectorFromString("launchAssetUrl")
    if (controller as AnyObject).responds(to: launchAssetUrlSelector),
       let url = (controller as AnyObject).perform(launchAssetUrlSelector)?.takeUnretainedValue() as? URL {
      return url
    }

    return nil
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


  /// Sends a file update to the Snack session (if connected)
  /// - Returns: true if the update was sent, false if no active session
  static func sendSnackFileUpdate(path: String, oldContents: String, newContents: String) -> Bool {
    let currentChannel = getCurrentChannel()

    // First try the SnackEditingSession (for published snacks opened from Expo Go)
    // Only use if the channel matches the current snack
    if let session = SnackEditingSession.shared.sessionClient,
       let editingChannel = SnackEditingSession.shared.channel,
       editingChannel == currentChannel {
      session.sendFileUpdate(path: path, oldContents: oldContents, newContents: newContents)
      return true
    }

    // Fall back to cached session (for snacks opened from snack.expo.dev)
    // Only use if the channel matches the current snack
    guard let session = cachedSession,
          let cachedChannel = cachedSessionChannel,
          cachedChannel == currentChannel else {
      return false
    }

    session.sendFileUpdate(path: path, oldContents: oldContents, newContents: newContents)
    return true
  }

  /// Checks if there's an active Snack session for the current snack
  static var hasActiveSnackSession: Bool {
    let currentChannel = getCurrentChannel()

    // Check SnackEditingSession first (for published snacks)
    if SnackEditingSession.shared.isReady,
       SnackEditingSession.shared.sessionClient != nil,
       let editingChannel = SnackEditingSession.shared.channel,
       editingChannel == currentChannel {
      return true
    }

    // Fall back to cached session (for snacks from website)
    if cachedSession != nil,
       let cachedChannel = cachedSessionChannel,
       cachedChannel == currentChannel {
      return true
    }

    return false
  }

  /// Fetches source files from a live Snack session via Snackpub
  private func fetchSnackSourceMapFromSession(channel: String) async throws -> SourceMap {
    // Check if SnackEditingSession has files for this channel (published snacks from Expo Go)
    if SnackEditingSession.shared.channel == channel,
       SnackEditingSession.shared.isReady,
       let files = SnackEditingSession.shared.currentFiles,
       !files.isEmpty {
      // Convert SnackSessionClient.SnackFile to our expected format and build source map
      var convertedFiles: [String: SnackSessionClient.SnackFile] = [:]
      for (path, file) in files {
        convertedFiles[path] = file
      }
      return buildSourceMap(from: convertedFiles)
    }

    // Check if we have a cached session for this channel with files
    // Use currentFiles from the session (not cachedFiles) to preserve any edits made
    if SourceMapService.cachedSessionChannel == channel,
       let session = SourceMapService.cachedSession,
       !session.currentFiles.isEmpty {
      return buildSourceMap(from: session.currentFiles)
    }

    let isStaging = devMenuManager.currentManifestURL?.absoluteString.contains("staging") == true

    // Reuse existing session or create new one
    let client: SnackSessionClient
    if SourceMapService.cachedSessionChannel == channel,
       let existingClient = SourceMapService.cachedSession {
      client = existingClient
    } else {
      // Disconnect old session if different channel
      SourceMapService.cachedSession?.disconnect()
      client = SnackSessionClient(channel: channel, isStaging: isStaging)
      SourceMapService.cachedSession = client
      SourceMapService.cachedSessionChannel = channel
    }

    return try await withCheckedThrowingContinuation { continuation in
      var hasResumed = false

      // Timeout after 10 seconds
      let timeoutTask = Task {
        try await Task.sleep(nanoseconds: 10_000_000_000)
        if !hasResumed {
          hasResumed = true
          continuation.resume(throwing: SnackSessionError.timeout)
        }
      }

      client.connect(
        onFilesReceived: { [weak self] files in
          guard !hasResumed else { return }
          hasResumed = true
          timeoutTask.cancel()

          let sourceMap = self?.buildSourceMap(from: files) ?? SourceMap(
            version: 3,
            sources: [],
            sourcesContent: [],
            mappings: "",
            names: []
          )

          continuation.resume(returning: sourceMap)
        },
        onError: { error in
          guard !hasResumed else { return }
          hasResumed = true
          timeoutTask.cancel()
          continuation.resume(throwing: error)
        }
      )
    }
  }

  private func buildSourceMap(from files: [String: SnackSessionClient.SnackFile]) -> SourceMap {
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
    // Build the API URL - handle both "@snack/xxx" and plain "xxx" formats
    let cleanId = snackId.hasPrefix("@snack/") ? String(snackId.dropFirst(7)) : snackId

    // Determine API host based on manifest URL (staging vs production)
    let apiHost = detectSnackApiHost()
    let apiURL = URL(string: "\(apiHost)/--/api/v2/snack/\(cleanId)")!

    var request = URLRequest(url: apiURL)
    request.setValue("3.0.0", forHTTPHeaderField: "Snack-Api-Version")
    request.setValue("expo-dev-menu/1.0", forHTTPHeaderField: "User-Agent")

    let (data, response) = try await URLSession.shared.data(for: request)

    if let httpResponse = response as? HTTPURLResponse,
       !(200...299).contains(httpResponse.statusCode) {
      throw SourceMapError.httpError(httpResponse.statusCode)
    }

    let snackResponse = try JSONDecoder().decode(SnackApiResponse.self, from: data)

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

    let bundleURL = devMenuManager.currentBridge?.bundleURL

    // Strategy 1: If the bundle is from Metro dev server, try to fetch external .map file
    if let bundleURL = bundleURL,
       !bundleURL.isFileURL,
       !isEASCDNURL(bundleURL),
       let externalSourceMap = try? await fetchExternalSourceMap() {
      return externalSourceMap
    }

    // Strategy 2: Check if expo-updates or Expo Go has downloaded the bundle locally
    // Try Expo Go kernel first, then UpdatesControllerRegistry, then AppController
    let localBundleURL = getLaunchAssetURLFromExpoGoKernel()
                      ?? getLaunchAssetURLFromUpdatesController()
                      ?? getLaunchAssetURLFromAppController()
    if let localBundleURL = localBundleURL, localBundleURL.isFileURL {
      return try extractInlineSourceMapFromLocalFile(localBundleURL)
    }

    // Strategy 3: Check if bridge's bundle URL is a local file
    if let bundleURL = bundleURL, bundleURL.isFileURL {
      return try extractInlineSourceMapFromLocalFile(bundleURL)
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

  /// Reads a local bundle file and extracts inline source map
  private func extractInlineSourceMapFromLocalFile(_ fileURL: URL) throws -> SourceMap {
    let data = try Data(contentsOf: fileURL)

    guard let bundleContent = String(data: data, encoding: .utf8) else {
      throw SourceMapError.noSourceMapFound
    }

    return try extractInlineSourceMap(from: bundleContent)
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
