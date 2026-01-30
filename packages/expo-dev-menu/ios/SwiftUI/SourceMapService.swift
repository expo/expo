// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import ObjectiveC

class SourceMapService {
  private let devMenuManager = DevMenuManager.shared

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

  // MARK: - Source Map Fetching

  /// Fetches and parses the source map, trying multiple strategies
  func fetchSourceMap() async throws -> SourceMap {
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

  /// Builds a file tree from the source map sources array
  func buildFileTree(from sourceMap: SourceMap) async -> [FileTreeNode] {
    let root = Node(name: "", path: "", isDirectory: true)

    for (index, sourcePath) in sourceMap.sources.enumerated() {
      insertPath(sourcePath, contentIndex: index, into: root)
    }

    let nodes = root.children.values.map { convertToNode($0) }
    let sorted = sortNodes(nodes)
    let collapsed = collapseSingleChildFolders(sorted)

    // Unwrap single top-level directory
    let directories = collapsed.filter { $0.isDirectory }
    if directories.count == 1, let mainDir = directories.first {
      return mainDir.children
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
