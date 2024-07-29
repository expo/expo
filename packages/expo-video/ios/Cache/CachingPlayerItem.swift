//
//  CachingPlayerItem.swift
//  CachingPlayerItem
//
//  Created by Gorjan Shukov on 10/24/20.
//

import Foundation
import AVFoundation
import CryptoKit

/// Convenient delegate methods for `CachingPlayerItem` status updates.
@objc public protocol CachingPlayerItemDelegate {
  // MARK: Downloading delegate methods

  /// Called when the media file is fully downloaded.
  @objc optional func playerItem(_ playerItem: CachingPlayerItem, didFinishDownloadingFileAt filePath: String)

  /// Called every time a new portion of data is received.
  @objc optional func playerItem(_ playerItem: CachingPlayerItem, didDownloadBytesSoFar bytesDownloaded: Int, outOf bytesExpected: Int)

  /// Called on downloading error.
  @objc optional func playerItem(_ playerItem: CachingPlayerItem, downloadingFailedWith error: Error)

  // MARK: Playing delegate methods

  /// Called after initial prebuffering is finished, means we are ready to play.
  @objc optional func playerItemReadyToPlay(_ playerItem: CachingPlayerItem)

  /// Called when the player is unable to play the data/url.
  @objc optional func playerItemDidFailToPlay(_ playerItem: CachingPlayerItem, withError error: Error?)

  /// Called when the data being downloaded did not arrive in time to continue playback.
  @objc optional func playerItemPlaybackStalled(_ playerItem: CachingPlayerItem)
}

/// AVPlayerItem subclass that supports caching while playing.
public class CachingPlayerItem: AVPlayerItem {
  public static let expoVideoCacheScheme = "expo-video-cache"

  private lazy var resourceLoaderDelegate = ResourceLoaderDelegate(url: url, saveFilePath: saveFilePath, owner: self)
  private let url: URL
  private let initialScheme: String?
  private let saveFilePath: String
  private var customFileExtension: String?
  /// HTTPHeaderFields set in avUrlAssetOptions using AVURLAssetHTTPHeaderFieldsKey
  internal var urlRequestHeaders: [String: String]?

  /// Useful for keeping relevant model associated with CachingPlayerItem instance. This is a **strong** reference, be mindful not to create a **retain cycle**.
  public var passOnObject: Any?
  public weak var delegate: CachingPlayerItemDelegate?

  // MARK: Public init

  public convenience init(url: URL) {
    self.init(url: url, customFileExtension: nil, avUrlAssetOptions: nil)
  }

  convenience init(url: URL, customFileExtension:String? = nil, avUrlAssetOptions:[String: Any]? = nil) {
    let fileExtension = customFileExtension ?? url.pathExtension
    let cachedVideoPath = Self.pathForUrl(url: url, fileExtension: fileExtension)

//    if FileManager.default.fileExists(atPath: cachedVideoPath) {
//      self.init(asset: AVURLAsset(url: URL(fileURLWithPath: cachedVideoPath), options: avUrlAssetOptions), automaticallyLoadedAssetKeys: nil)
//      addObservers()
//      return
//    }

    self.init(url: url, saveFilePath: Self.randomFilePath(withExtension: url.pathExtension), customFileExtension: customFileExtension, avUrlAssetOptions: avUrlAssetOptions)
  }

  private init(filePathURL: URL, fileExtension: String? = nil) {
    if let fileExtension = fileExtension {
      let url = filePathURL.deletingPathExtension()
      self.url = url.appendingPathExtension(fileExtension)

      // Removes old SymLinks which cause issues
      try? FileManager.default.removeItem(at: url)

      try? FileManager.default.createSymbolicLink(at: url, withDestinationURL: filePathURL)
    } else {
      assert(filePathURL.pathExtension.isEmpty == false,
             "CachingPlayerItem error: filePathURL pathExtension empty, pass the extension in `fileExtension` parameter")
      self.url = filePathURL
    }

    // Not needed properties when playing media from a local file.
    self.saveFilePath = ""
    self.initialScheme = nil

    super.init(asset: AVURLAsset(url: url), automaticallyLoadedAssetKeys: nil)

    addObservers()
  }


  private init(url: URL, saveFilePath: String, customFileExtension: String?, avUrlAssetOptions: [String: Any]? = nil) {
    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
          let scheme = components.scheme,
          var urlWithCustomScheme = url.withScheme(CachingPlayerItem.expoVideoCacheScheme) else {
      fatalError("CachingPlayerItem error: Urls without a scheme are not supported")
    }

    self.url = url
    self.saveFilePath = saveFilePath
    self.initialScheme = scheme

    if let ext = customFileExtension {
      urlWithCustomScheme.deletePathExtension()
      urlWithCustomScheme.appendPathExtension(ext)
      self.customFileExtension = ext
    }  else {
      assert(url.pathExtension.isEmpty == false, "CachingPlayerItem error: url pathExtension empty, pass the extension in `customFileExtension` parameter")
    }

    if let headers = avUrlAssetOptions?["AVURLAssetHTTPHeaderFieldsKey"] as? [String: String] {
      self.urlRequestHeaders = headers
    }

    let asset = AVURLAsset(url: urlWithCustomScheme, options: avUrlAssetOptions)
    super.init(asset: asset, automaticallyLoadedAssetKeys: nil)

    asset.resourceLoader.setDelegate(resourceLoaderDelegate, queue: DispatchQueue.main)

    addObservers()
  }


  override public init(asset: AVAsset, automaticallyLoadedAssetKeys: [String]?) {
    self.url = URL(fileURLWithPath: "")
    self.initialScheme = nil
    self.saveFilePath = ""
    super.init(asset: asset, automaticallyLoadedAssetKeys: automaticallyLoadedAssetKeys)

    addObservers()
  }

  public init(asset: AVURLAsset, automaticallyLoadedAssetKeys: [String]?) {
    self.url = asset.url
    self.initialScheme = asset.url.scheme
    self.saveFilePath = Self.randomFilePath(withExtension: url.pathExtension)
    super.init(asset: asset)
    addObservers()
  }

  deinit {
    removeObservers()

    // Don't reference lazy `resourceLoaderDelegate` if it hasn't been called before.
    guard initialScheme != nil else { return }

    // Otherwise the ResourceLoaderDelegate wont deallocate and will keep downloading.
    resourceLoaderDelegate.invalidateAndCancelSession()
  }

  // MARK: Public methods

  /// Downloads the media file. Works only with the initializers intended for play and cache.
  public func download() {
    // Make sure we are not initilalized with a filePath or non-caching init.
    guard initialScheme != nil else {
      assertionFailure("CachingPlayerItem error: Download method used on a non caching instance")
      return
    }

    resourceLoaderDelegate.startDataRequest(with: url)
  }

  // MARK: KVO

  private var playerItemContext = 0

  public override func observeValue(forKeyPath keyPath: String?,
                                    of object: Any?,
                                    change: [NSKeyValueChangeKey : Any]?,
                                    context: UnsafeMutableRawPointer?) {

    // Only handle observations for the playerItemContext
    guard context == &playerItemContext else {
      super.observeValue(forKeyPath: keyPath,
                         of: object,
                         change: change,
                         context: context)
      return
    }

    // We are only observing the status keypath
    guard keyPath == #keyPath(AVPlayerItem.status) else { return }

    let status: AVPlayerItem.Status
    if let statusNumber = change?[.newKey] as? NSNumber {
      status = AVPlayerItem.Status(rawValue: statusNumber.intValue)!
    } else {
      status = .unknown
    }

    // Switch over status value
    switch status {
    case .readyToPlay:
      // Player item is ready to play.
      DispatchQueue.main.async { self.delegate?.playerItemReadyToPlay?(self) }
    case .failed:
      // Player item failed. See error.
      print("CachingPlayerItem status: failed with error: \(String(describing: error))")
      DispatchQueue.main.async { self.delegate?.playerItemDidFailToPlay?(self, withError: self.error) }
    case .unknown:
      // Player item is not yet ready.
      print("CachingPlayerItem status: uknown with error: \(String(describing: error))")
    @unknown default:
      break
    }
  }

  // MARK: Private methods

  private func addObservers() {
    addObserver(self, forKeyPath: #keyPath(AVPlayerItem.status), options: .new, context: &playerItemContext)
    NotificationCenter.default.addObserver(self, selector: #selector(playbackStalledHandler), name: .AVPlayerItemPlaybackStalled, object: self)
  }

  private func removeObservers() {
    removeObserver(self, forKeyPath: #keyPath(AVPlayerItem.status))
    NotificationCenter.default.removeObserver(self)
  }

  @objc private func playbackStalledHandler() {
    DispatchQueue.main.async { self.delegate?.playerItemPlaybackStalled?(self) }
  }

  /// Generates a random file path in caches directory with the provided `fileExtension`.
  private static func randomFilePath(withExtension fileExtension: String) -> String {
    guard var cachesDirectory = try? FileManager.default.url(for: .cachesDirectory,
                                                             in: .userDomainMask,
                                                             appropriateFor: nil,
                                                             create: true)
    else {
      fatalError("CachingPlayerItem error: Can't access default cache directory")
    }

    cachesDirectory.appendPathComponent(UUID().uuidString)
    cachesDirectory.appendPathExtension(fileExtension)

    return cachesDirectory.path
  }

  private static func pathForUrl(url: URL, fileExtension: String) -> String {
    let hashedData = SHA256.hash(data: Data(url.absoluteString.utf8))
    let hashString = hashedData.compactMap { String(format: "%02x", $0) }.joined()
    let parsedExtension = fileExtension.starts(with: ".") ? fileExtension : ("." + fileExtension)
    let hashFilename = hashString + parsedExtension

    guard var cachesDirectory = try? FileManager.default.url(for: .cachesDirectory,
                                                             in: .userDomainMask,
                                                             appropriateFor: nil,
                                                             create: true)
    else {
      fatalError("CachingPlayerItem error: Can't access default cache directory")
    }

    cachesDirectory.appendPathComponent(hashFilename)

    return cachesDirectory.path
  }
}

extension URL {
  func withScheme(_ scheme: String) -> URL? {
    var components = URLComponents(url: self, resolvingAgainstBaseURL: false)
    components?.scheme = scheme
    return components?.url
  }
}






























//// Copyright 2024-present 650 Industries. All rights reserved.
//
//import Foundation
//import AVFoundation
//
///// Convenient delegate methods for `CachingPlayerItem` status updates.
//@objc public protocol CachingPlayerItemDelegate {}
//
///// AVPlayerItem subclass that supports caching while playing.
//public final class CachingPlayerItem: AVPlayerItem {
//  private let cachingPlayerItemScheme = "cachingPlayerItemScheme"
//
//  private let url: URL
//  private let initialScheme: String?
//  private let saveFilePath: String
//  private var customFileExtension: String?
//  /// HTTPHeaderFields set in avUrlAssetOptions using AVURLAssetHTTPHeaderFieldsKey
//  internal var urlRequestHeaders: [String: String]?
//
//  /// Useful for keeping relevant model associated with CachingPlayerItem instance. This is a **strong** reference, be mindful not to create a **retain cycle**.
//  public var passOnObject: Any?
//  public weak var delegate: CachingPlayerItemDelegate?
//
//  // MARK: Public init
//
//  public convenience init(url: URL) {
//    self.init(url: url, saveFilePath: Self.randomFilePath(withExtension: url.pathExtension), customFileExtension: nil, avUrlAssetOptions: nil)
//  }
//
//  /**
//   Play and cache remote media on a local file. `saveFilePath` is **radomly** generated. Requires `url.pathExtension` to not be empty otherwise the player will fail playing.
//
//   - parameter url: URL referencing the media file.
//
//   - parameter avUrlAssetOptions: A dictionary that contains options used to customize the initialization of the asset. For supported keys and values,
//   see [Initialization Options.](https://developer.apple.com/documentation/avfoundation/avurlasset/initialization_options)
//   */
//  public convenience init(url: URL, avUrlAssetOptions: [String: Any]? = nil) {
//    self.init(url: url, saveFilePath: Self.randomFilePath(withExtension: url.pathExtension), customFileExtension: nil, avUrlAssetOptions: avUrlAssetOptions)
//  }
//
//  /**
//   Play and cache remote media on a local file. `saveFilePath` is **radomly** generated.
//
//   - parameter url: URL referencing the media file.
//
//   - parameter customFileExtension: Media file extension. E.g. mp4, mp3. This is required for the player to work correctly with the intended file type.
//
//   - parameter avUrlAssetOptions: A dictionary that contains options used to customize the initialization of the asset. For supported keys and values,
//   see [Initialization Options.](https://developer.apple.com/documentation/avfoundation/avurlasset/initialization_options)
//   */
//  public convenience init(url: URL, customFileExtension: String, avUrlAssetOptions: [String: Any]? = nil) {
//    self.init(url: url, saveFilePath: Self.randomFilePath(withExtension: customFileExtension), customFileExtension: customFileExtension, avUrlAssetOptions: avUrlAssetOptions)
//  }
//
//  /**
//   Play and cache remote media.
//
//   - parameter url: URL referencing the media file.
//
//   - parameter saveFilePath: The desired local save location. E.g. "video.mp4". **Must** be a unique file path that doesn't already exist. If a file exists at the path than it's **required** to be empty (contain no data).
//
//   - parameter customFileExtension: Media file extension. E.g. mp4, mp3. This is required for the player to work correctly with the intended file type.
//
//   - parameter avUrlAssetOptions: A dictionary that contains options used to customize the initialization of the asset. For supported keys and values,
//   see [Initialization Options.](https://developer.apple.com/documentation/avfoundation/avurlasset/initialization_options)
//   */
//  public init(url: URL, saveFilePath: String, customFileExtension: String?, avUrlAssetOptions: [String: Any]? = nil) {
//    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
//          let scheme = components.scheme,
//          var urlWithCustomScheme = url.withScheme(cachingPlayerItemScheme) else {
//      fatalError("CachingPlayerItem error: Urls without a scheme are not supported")
//    }
//
//    self.url = url
//    self.saveFilePath = saveFilePath
//    self.initialScheme = scheme
//
//    if let ext = customFileExtension {
//      urlWithCustomScheme.deletePathExtension()
//      urlWithCustomScheme.appendPathExtension(ext)
//      self.customFileExtension = ext
//    }  else {
//      assert(url.pathExtension.isEmpty == false, "CachingPlayerItem error: url pathExtension empty, pass the extension in `customFileExtension` parameter")
//    }
//
//    if let headers = avUrlAssetOptions?["AVURLAssetHTTPHeaderFieldsKey"] as? [String: String] {
//      self.urlRequestHeaders = headers
//    }
//
//    let asset = AVURLAsset(url: urlWithCustomScheme, options: avUrlAssetOptions)
//    super.init(asset: asset, automaticallyLoadedAssetKeys: nil)
//
//    addObservers()
//  }
//
//  /**
//   Play remote media **without** caching.
//
//   - parameter nonCachingURL: URL referencing the media file.
//
//   - parameter avUrlAssetOptions: A dictionary that contains options used to customize the initialization of the asset. For supported keys and values,
//   see [Initialization Options.](https://developer.apple.com/documentation/avfoundation/avurlasset/initialization_options)
//   */
//  public init(nonCachingURL url: URL, avUrlAssetOptions: [String: Any]? = nil) {
//    self.url = url
//    self.saveFilePath = ""
//    self.initialScheme = nil
//
//    let asset = AVURLAsset(url: url, options: avUrlAssetOptions)
//    super.init(asset: asset, automaticallyLoadedAssetKeys: nil)
//
//    addObservers()
//  }
//
//  /**
//   Play from data.
//
//   - parameter data: Media file represented in data.
//
//   - parameter customFileExtension: Media file extension. E.g. mp4, mp3. This is required for the player to work correctly with the intended file type.
//
//   - throws: An error in the Cocoa domain, if there is an error writing to the `URL`.
//   */
//  public convenience init(data: Data, customFileExtension: String) throws {
//    let filePathURL = URL(fileURLWithPath: Self.randomFilePath(withExtension: customFileExtension))
//    FileManager.default.createFile(atPath: filePathURL.path, contents: nil, attributes: nil)
//    try data.write(to: filePathURL)
//    self.init(filePathURL: filePathURL)
//  }
//
//  /**
//   Play from file.
//
//   - parameter filePathURL: The local file path of a media file.
//
//   - parameter fileExtension: Media file extension. E.g. mp4, mp3. **Required**  if `filePathURL.pathExtension` is empty.
//   */
//  public init(filePathURL: URL, fileExtension: String? = nil) {
//    if let fileExtension = fileExtension {
//      let url = filePathURL.deletingPathExtension()
//      self.url = url.appendingPathExtension(fileExtension)
//
//      // Removes old SymLinks which cause issues
//      try? FileManager.default.removeItem(at: url)
//
//      try? FileManager.default.createSymbolicLink(at: url, withDestinationURL: filePathURL)
//    } else {
//      assert(filePathURL.pathExtension.isEmpty == false,
//             "CachingPlayerItem error: filePathURL pathExtension empty, pass the extension in `fileExtension` parameter")
//      self.url = filePathURL
//    }
//
//    // Not needed properties when playing media from a local file.
//    self.saveFilePath = ""
//    self.initialScheme = nil
//
//    super.init(asset: AVURLAsset(url: url), automaticallyLoadedAssetKeys: nil)
//
//    addObservers()
//  }
//
//  override public init(asset: AVAsset, automaticallyLoadedAssetKeys: [String]?) {
//    self.url = URL(fileURLWithPath: "")
//    self.initialScheme = nil
//    self.saveFilePath = ""
//    super.init(asset: asset, automaticallyLoadedAssetKeys: automaticallyLoadedAssetKeys)
//
//    addObservers()
//  }
//
//  deinit {
//    removeObservers()
//
//    // Don't reference lazy `resourceLoaderDelegate` if it hasn't been called before.
//    guard initialScheme != nil else { return }
//  }
//
//  // MARK: Public methods
//
//  /// Downloads the media file. Works only with the initializers intended for play and cache.
//  public func download() {
//    // Make sure we are not initilalized with a filePath or non-caching init.
//    guard initialScheme != nil else {
//      assertionFailure("CachingPlayerItem error: Download method used on a non caching instance")
//      return
//    }
//  }
//
//  // MARK: KVO
//
//  private var playerItemContext = 0
//
//  // MARK: Private methods
//
//  private func addObservers() {
//    addObserver(self, forKeyPath: #keyPath(AVPlayerItem.status), options: .new, context: &playerItemContext)
//    NotificationCenter.default.addObserver(self, selector: #selector(playbackStalledHandler), name: .AVPlayerItemPlaybackStalled, object: self)
//  }
//
//  private func removeObservers() {
//    removeObserver(self, forKeyPath: #keyPath(AVPlayerItem.status))
//    NotificationCenter.default.removeObserver(self)
//  }
//
//  @objc private func playbackStalledHandler() {
//  }
//
//  /// Generates a random file path in caches directory with the provided `fileExtension`.
//  private static func randomFilePath(withExtension fileExtension: String) -> String {
//    guard var cachesDirectory = try? FileManager.default.url(for: .cachesDirectory,
//                                                             in: .userDomainMask,
//                                                             appropriateFor: nil,
//                                                             create: true)
//    else {
//      fatalError("CachingPlayerItem error: Can't access default cache directory")
//    }
//
//    cachesDirectory.appendPathComponent(UUID().uuidString)
//    cachesDirectory.appendPathExtension(fileExtension)
//
//    return cachesDirectory.path
//  }
//}
//
//fileprivate extension URL {
//  func withScheme(_ scheme: String) -> URL? {
//    var components = URLComponents(url: self, resolvingAgainstBaseURL: false)
//    components?.scheme = scheme
//    return components?.url
//  }
//}
