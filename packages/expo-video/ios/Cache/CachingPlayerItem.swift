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
  private var cachedFileUrl: URL?

  internal var urlRequestHeaders: [String: String]?

  public convenience init(url: URL) {
    self.init(url: url, useCaching: false, avUrlAssetOptions: nil)
  }

  init(url: URL, useCaching: Bool, avUrlAssetOptions: [String: Any]? = nil) {
    let cachedMimeType = CachedResource.readMediaInfo(for: url)?.mimeType
    let cachedExtension = mimeTypeToExtension(mimeType: cachedMimeType) ?? ""
    let fileExtension = url.pathExtension != "" ? url.pathExtension : cachedExtension
    let cachedVideoPath = Self.pathForUrl(url: url, fileExtension: fileExtension)

    self.url = url
    self.saveFilePath = cachedVideoPath
    self.initialScheme = URLComponents(url: url, resolvingAgainstBaseURL: false)?.scheme

    // Creates a regular AVURLAsset
    guard let saveFilePath, useCaching else {
      self.urlAsset = AVURLAsset(url: url, options: avUrlAssetOptions)
      super.init(asset: urlAsset, automaticallyLoadedAssetKeys: nil)
      return
    }

    // Creates an AVUrlAsset that will delegate it's requests to ResourceLoaderDelegate
    guard var urlWithCustomScheme = url.withScheme(VideoCacheManager.expoVideoCacheScheme) else {
      fatalError("CachingPlayerItem error: Urls without a scheme are not supported")
    }

    if let headers = avUrlAssetOptions?["AVURLAssetHTTPHeaderFieldsKey"] as? [String: String] {
      self.urlRequestHeaders = headers
    }

    urlAsset = AVURLAsset(url: urlWithCustomScheme, options: avUrlAssetOptions)

    super.init(asset: urlAsset, automaticallyLoadedAssetKeys: nil)

    self.createCacheDirectoryIfNeeded()
    resourceLoaderDelegate = ResourceLoaderDelegate(url: url, saveFilePath: saveFilePath, fileExtension: fileExtension, owner: self)
    urlAsset.resourceLoader.setDelegate(resourceLoaderDelegate, queue: DispatchQueue.main)
  }

  deinit {
    if let cachedFileUrl {
      VideoCacheManager.shared.unregisterOpenFile(at: cachedFileUrl)
    }
    guard initialScheme != nil else { return }

    resourceLoaderDelegate?.invalidateAndCancelSession()
  }

  // MARK: Public methods

  static func pathForUrl(url: URL, fileExtension: String) -> String? {
    let hashedData = SHA256.hash(data: Data(url.absoluteString.utf8))
    let hashString = hashedData.compactMap { String(format: "%02x", $0) }.joined()
    let parsedExtension = fileExtension.starts(with: ".") || fileExtension == "" ? fileExtension : ("." + fileExtension)
    let hashFilename = hashString + parsedExtension

    guard var cachesDirectory = try? FileManager.default.url(for: .cachesDirectory,
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
    guard var cachesDirectory = try? FileManager.default.url(for: .cachesDirectory,
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
