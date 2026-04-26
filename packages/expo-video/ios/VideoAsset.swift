import Foundation
import AVFoundation
import CryptoKit
import MobileCoreServices
import ExpoModulesCore

internal class VideoAsset: AVURLAsset, @unchecked Sendable {
  internal let videoSource: VideoSource
  internal let effectivePlaybackURL: URL
  internal let effectiveContentType: ContentType
  private var resourceLoaderDelegateRef: (any AVAssetResourceLoaderDelegate)?
  private var retainedTransportObjects: [AnyObject] = []
  private let preAssetLoadCallback: ((AVURLAsset) async throws -> Void)?
  private let onAssetDeinit: (() -> Void)?

  var transportError: Error?

  init(url: URL, videoSource: VideoSource) {
    self.videoSource = videoSource
    VideoAssetTransportRegistry.registerDefaultProviders()

    if let loadPlan = VideoAssetTransportRegistry.resolveLoadPlan(for: videoSource, url: url) {
      self.effectivePlaybackURL = loadPlan.assetURL
      self.effectiveContentType = loadPlan.reportedContentTypeHint ?? videoSource.contentType
      self.preAssetLoadCallback = loadPlan.prepareAsset
      self.onAssetDeinit = loadPlan.onAssetDeinit
      super.init(url: loadPlan.assetURL, options: loadPlan.assetOptions ?? Self.assetOptions(headers: videoSource.headers))

      if let resourceLoaderDelegate = loadPlan.resourceLoaderDelegate {
        self.resourceLoaderDelegateRef = resourceLoaderDelegate
        self.resourceLoader.setDelegate(resourceLoaderDelegate, queue: loadPlan.resourceLoaderQueue)
      }

      self.retainedTransportObjects = loadPlan.retainedObjects
      loadPlan.attachErrorHandler? { [weak self] error in
        self?.transportError = error
      }
      return
    }

    self.effectivePlaybackURL = url
    self.effectiveContentType = videoSource.contentType
    self.preAssetLoadCallback = nil
    self.onAssetDeinit = nil
    super.init(url: url, options: Self.assetOptions(headers: videoSource.headers))
  }

  deinit {
    onAssetDeinit?()
  }

  internal func prepareForLoadingIfNeeded() async throws {
    try await preAssetLoadCallback?(self)
  }

  static func pathForUrl(url: URL, fileExtension: String) -> String? {
    let hashedData = SHA256.hash(data: Data(url.absoluteString.utf8))
    let hashString = hashedData.compactMap { String(format: "%02x", $0) }.joined()
    let parsedExtension = fileExtension.starts(with: ".") || fileExtension.isEmpty ? fileExtension : ("." + fileExtension)
    let hashFilename = hashString + parsedExtension

    guard var cachesDirectory = try? FileManager.default.url(
      for: .cachesDirectory,
      in: .userDomainMask,
      appropriateFor: nil,
      create: true)
    else {
      log.warn("[expo-video] CachingPlayerItem error: Can't access default cache directory")
      return nil
    }

    cachesDirectory.appendPathComponent(VideoCacheManager.expoVideoCacheScheme, isDirectory: true)
    cachesDirectory.appendPathComponent(hashFilename)

    return cachesDirectory.path
  }

  static func assetOptions(headers: [String: String]?) -> [String: Any]? {
    if let headers {
      return ["AVURLAssetHTTPHeaderFieldsKey": headers]
    }
    return nil
  }

  static func createCacheDirectoryIfNeeded() {
    guard var cachesDirectory = try? FileManager.default.url(
      for: .cachesDirectory,
      in: .userDomainMask,
      appropriateFor: nil,
      create: true)
    else {
      return
    }

    cachesDirectory.appendPathComponent(VideoCacheManager.expoVideoCacheScheme, isDirectory: true)
    try? FileManager.default.createDirectory(at: cachesDirectory, withIntermediateDirectories: true)
  }
}
