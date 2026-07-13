// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Where a project's source comes from. Implementations are Sendable structs
/// whose loadSource() is nonisolated async, so parsing and tree building run
/// on the cooperative pool, never the main actor.
protocol SourceProvider: Sendable {
  func loadSource() async throws -> SourceTree
}

/// Metro sourcemap JSON shape (also embedded inline in exported bundles).
struct SourceMapDTO: Codable {
  let version: Int
  let sources: [String]
  let sourcesContent: [String?]?
  let mappings: String
  let names: [String]
}

private func makeTree(from map: SourceMapDTO, unwrapSingleRoot: Bool) -> SourceTree {
  let contents = map.sourcesContent ?? []
  let sources = map.sources.enumerated().map { index, path in
    (path: path, contents: index < contents.count ? contents[index] : nil)
  }
  return SourceTreeBuilder.build(sources: sources, unwrapSingleRoot: unwrapSingleRoot)
}

// MARK: - Selection

enum SourceProviderSelector {
  /// Strategy order (ported from the old fetchSourceMap): snack params win;
  /// then a non-file, non-EAS-CDN bundle URL means a Metro dev server;
  /// anything else reads the loaded bundle's inline sourcemap.
  static func provider(
    manifestURL: URL?,
    bundleURL: URL?,
    loadBundleData: @escaping @Sendable () async -> Data?
  ) -> SourceProvider {
    let (snackId, channel) = snackParams(from: manifestURL)
    if snackId != nil || channel != nil {
      let isStaging = manifestURL?.absoluteString.contains("staging") == true
      return SnackSourceProvider(channel: channel, snackId: snackId, isStaging: isStaging)
    }

    if let bundleURL, !bundleURL.isFileURL, bundleURL.host != "assets.eascdn.net" {
      return MetroSourceProvider(bundleURL: bundleURL)
    }

    return BundleSourceMapProvider(loadBundleData: loadBundleData)
  }

  /// True when the project's source is the loaded bundle itself (the
  /// BundleSourceMapProvider branch above): published Expo-Go-hosted apps,
  /// not snacks and not Metro dev servers.
  static func isPublishedBundle(manifestURL: URL?, bundleURL: URL?) -> Bool {
    let (snackId, channel) = snackParams(from: manifestURL)
    if snackId != nil || channel != nil {
      return false
    }
    if let bundleURL, !bundleURL.isFileURL, bundleURL.host != "assets.eascdn.net" {
      return false
    }
    return true
  }

  static func snackParams(from manifestURL: URL?) -> (snackId: String?, channel: String?) {
    guard let manifestURL,
          let components = URLComponents(url: manifestURL, resolvingAgainstBaseURL: false) else {
      return (nil, nil)
    }
    let snackId = components.queryItems?.first(where: { $0.name == "snack" })?.value
    let channel = components.queryItems?.first(where: { $0.name == "snack-channel" })?.value
    return (snackId, channel)
  }
}

// MARK: - Metro dev server

struct MetroSourceProvider: SourceProvider {
  let bundleURL: URL

  /// Bundle: http://host:8081/index.bundle?platform=ios
  /// Map:    http://host:8081/index.map?platform=ios
  var sourceMapURL: URL? {
    var urlString = bundleURL.absoluteString
    if urlString.contains(".bundle") {
      urlString = urlString.replacingOccurrences(of: ".bundle", with: ".map")
    } else if let queryIndex = urlString.firstIndex(of: "?") {
      urlString.insert(contentsOf: ".map", at: queryIndex)
    } else {
      urlString += ".map"
    }
    return URL(string: urlString)
  }

  func loadSource() async throws -> SourceTree {
    guard let sourceMapURL else {
      throw SourceMapError.invalidSourceMapURL
    }

    let (data, response) = try await URLSession.shared.data(from: sourceMapURL)
    if let httpResponse = response as? HTTPURLResponse,
       !(200...299).contains(httpResponse.statusCode) {
      throw SourceMapError.httpError(httpResponse.statusCode)
    }

    let map: SourceMapDTO
    do {
      map = try JSONDecoder().decode(SourceMapDTO.self, from: data)
    } catch {
      throw SourceMapError.parseError(error)
    }

    return makeTree(from: map, unwrapSingleRoot: true)
  }
}

// MARK: - Inline sourcemap from the loaded bundle

struct BundleSourceMapProvider: SourceProvider {
  /// Injected so the provider stays testable; production reads the kernel's
  /// loaded bundle on the main actor.
  let loadBundleData: @Sendable () async -> Data?

  func loadSource() async throws -> SourceTree {
    guard let bundleData = await loadBundleData() else {
      throw SourceMapError.noSourceMapFound
    }
    let map = try Self.extractInlineSourceMap(from: bundleData)
    return makeTree(from: map, unwrapSingleRoot: true)
  }

  /// Byte-level extraction: no whole-bundle String conversion. Searches
  /// backwards since the marker sits at the end of the bundle.
  static func extractInlineSourceMap(from bundle: Data) throws -> SourceMapDTO {
    // Hermes bytecode magic number - no readable source to extract.
    if bundle.starts(with: [0xc6, 0x1f, 0xbc, 0x03]) {
      throw SourceMapError.hermesBytecodeBundle
    }

    let markers = [
      "//# sourceMappingURL=data:application/json;charset=utf-8;base64,",
      "//# sourceMappingURL=data:application/json;base64,"
    ]

    for marker in markers {
      guard let markerRange = bundle.range(of: Data(marker.utf8), options: [.backwards]) else {
        continue
      }

      let base64Start = markerRange.upperBound
      let base64End = bundle[base64Start...].firstIndex(of: UInt8(ascii: "\n")) ?? bundle.endIndex
      guard let decoded = Data(base64Encoded: Data(bundle[base64Start..<base64End])) else {
        throw SourceMapError.invalidInlineSourceMap
      }

      do {
        return try JSONDecoder().decode(SourceMapDTO.self, from: decoded)
      } catch {
        throw SourceMapError.invalidInlineSourceMap
      }
    }

    throw SourceMapError.noSourceMapFound
  }
}

// MARK: - Snack

struct SnackSourceProvider: SourceProvider {
  let channel: String?
  let snackId: String?
  let isStaging: Bool

  func loadSource() async throws -> SourceTree {
    if let channel, let files = await sessionFiles(channel: channel) {
      let sources = files.values
        .filter { !$0.isAsset }
        .sorted { $0.path < $1.path }
        .map { (path: $0.path, contents: Optional($0.contents)) }
      return SourceTreeBuilder.build(sources: sources, unwrapSingleRoot: false)
    }

    if let snackId {
      return try await fetchFromAPI(snackId: snackId)
    }

    throw SourceMapError.noSourceMapFound
  }

  /// Files from the live session, joining as a viewer if no session exists
  /// yet (snack opened via deep link).
  @MainActor
  private func sessionFiles(channel: String) async -> [String: SnackFile]? {
    let session = SnackEditingSession.shared
    if !session.hasActiveSession(forChannel: channel) {
      try? await session.setupViewerSession(channel: channel, isStaging: isStaging)
    }
    guard session.hasActiveSession(forChannel: channel),
          let files = session.currentFiles,
          !files.isEmpty else {
      return nil
    }
    return files
  }

  private func fetchFromAPI(snackId: String) async throws -> SourceTree {
    let snackResponse: SnackAPIResponse
    do {
      snackResponse = try await SnackAPIClient.fetch(snackId: snackId, isStaging: isStaging)
    } catch SnackAPIError.invalidSnackId(let id) {
      throw SourceMapError.invalidSnackId(id)
    } catch SnackAPIError.httpError(let code) {
      throw SourceMapError.httpError(code)
    }

    let sources = snackResponse.code
      .filter { $0.value.type == "CODE" }
      .sorted { $0.key < $1.key }
      .map { (path: $0.key, contents: Optional($0.value.contents)) }

    return SourceTreeBuilder.build(sources: sources, unwrapSingleRoot: false)
  }
}
