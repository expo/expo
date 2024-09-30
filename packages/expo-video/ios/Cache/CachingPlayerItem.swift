import Foundation
import AVFoundation
import CryptoKit
import MobileCoreServices
import ExpoModulesCore

public class CachingPlayerItem: AVPlayerItem {
  let urlAsset: AVURLAsset
  private var resourceLoaderDelegate: ResourceLoaderDelegate?
  private let url: URL
  private let initialScheme: String?
  private let saveFilePath: String?
  private var customFileExtension: String?
  private let useCaching: Bool

  var cachingError: Exception?

  internal var urlRequestHeaders: [String: String]?

  public convenience init(url: URL) {
    self.init(url: url, useCaching: false, avUrlAssetOptions: nil)
  }

  init(url: URL, useCaching: Bool, avUrlAssetOptions: [String: Any]? = nil) {
    self.useCaching = useCaching
    let cachedMimeType = MediaInfo(forResourceUrl: url)?.mimeType
    let cachedExtension = mimeTypeToExtension(mimeType: cachedMimeType) ?? ""
    let fileExtension = url.pathExtension.isEmpty ? cachedExtension : url.pathExtension
    self.saveFilePath = Self.pathForUrl(url: url, fileExtension: fileExtension)

    self.url = url
    self.initialScheme = URLComponents(url: url, resolvingAgainstBaseURL: false)?.scheme

    // Creates an AVUrlAsset that will delegate it's requests to ResourceLoaderDelegate
    let urlWithCustomScheme = url.withScheme(VideoCacheManager.expoVideoCacheScheme)

    // Creates a regular AVURLAsset
    guard let saveFilePath, let urlWithCustomScheme, useCaching else {
      if urlWithCustomScheme == nil && useCaching {
        log.warn("CachingPlayerItem error: Urls without a scheme are not supported, the resource won't be cached")
      }

      self.urlAsset = AVURLAsset(url: url, options: avUrlAssetOptions)
      super.init(asset: urlAsset, automaticallyLoadedAssetKeys: nil)
      return
    }

    if let headers = avUrlAssetOptions?["AVURLAssetHTTPHeaderFieldsKey"] as? [String: String] {
      self.urlRequestHeaders = headers
    }

    urlAsset = AVURLAsset(url: urlWithCustomScheme, options: avUrlAssetOptions)
    super.init(asset: urlAsset, automaticallyLoadedAssetKeys: nil)

    self.createCacheDirectoryIfNeeded()
    VideoCacheManager.shared.ensureCacheIntegrity(forSavePath: saveFilePath)
    resourceLoaderDelegate = ResourceLoaderDelegate(url: url, saveFilePath: saveFilePath, fileExtension: fileExtension, owner: self)
    urlAsset.resourceLoader.setDelegate(resourceLoaderDelegate, queue: DispatchQueue.main)
  }

  deinit {
    guard useCaching else {
      return
    }
    if let saveFilePath, let cachedFileUrl = URL(string: saveFilePath) {
      VideoCacheManager.shared.unregisterOpenFile(at: cachedFileUrl)
    }
    VideoCacheManager.shared.ensureCacheSize()
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
      return nil
      log.warn("CachingPlayerItem error: Can't access default cache directory")
    }

    cachesDirectory.appendPathComponent(VideoCacheManager.expoVideoCacheScheme, isDirectory: true)
    cachesDirectory.appendPathComponent(hashFilename)

    return cachesDirectory.path
  }

  private func createCacheDirectoryIfNeeded() {
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
