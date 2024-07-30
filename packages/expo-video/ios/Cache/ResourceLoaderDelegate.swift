import Foundation
import AVFoundation
import UIKit
import CoreServices


final class ResourceLoaderDelegate: NSObject, AVAssetResourceLoaderDelegate, URLSessionDelegate, URLSessionDataDelegate, URLSessionTaskDelegate {
  private let lock = NSLock()

  private var bufferData = Data()
  private let downloadBufferLimit = CachingPlayerItemConfiguration.downloadBufferLimit
  private let readDataLimit = CachingPlayerItemConfiguration.readDataLimit

  private lazy var fileHandle = MediaFileHandle(filePath: pathWithExtension)

  private var session: URLSession?
  private var response: URLResponse?
  private var pendingRequests = Set<AVAssetResourceLoadingRequest>()
  private var isDownloadComplete = false

  private let url: URL
  private let saveFilePath: String
  private let fileExtension: String
  
  // For videos with uris without an extension the file extension is not known until we get mimeType response from the server
  // We can't play local videos without an extension, which means that the cached file has to have it
  // We should always receive it before creating the fileHandle
  private var pathWithExtension: String {
    let ext = CachingPlayerItem.mimeTypeToExtension(mimeType: response?.mimeType)
    if let ext, self.fileExtension == "" {
      return self.saveFilePath + ".\(ext)"
    }
    return self.saveFilePath
  }
  private weak var owner: CachingPlayerItem?

  // MARK: Init

  init(url: URL, saveFilePath: String, fileExtension: String, owner: CachingPlayerItem?) {
    self.url = url
    self.saveFilePath = saveFilePath
    self.owner = owner
    self.fileExtension = fileExtension
    super.init()

    NotificationCenter.default.addObserver(self, selector: #selector(handleAppWillTerminate), name: UIApplication.willTerminateNotification, object: nil)
  }

  deinit {
    invalidateAndCancelSession()
  }

  // MARK: AVAssetResourceLoaderDelegate

  func resourceLoader(_ resourceLoader: AVAssetResourceLoader, shouldWaitForLoadingOfRequestedResource loadingRequest: AVAssetResourceLoadingRequest) -> Bool {
    if session == nil {
      // If we're playing from an url, we need to download the file.
      // We start loading the file on first request only.
      startDataRequest(with: url)
    }

    pendingRequests.insert(loadingRequest)
    if (self.response != nil) {
      processPendingRequests()
    }
    return true
  }

  func resourceLoader(_ resourceLoader: AVAssetResourceLoader, didCancel loadingRequest: AVAssetResourceLoadingRequest) {
    pendingRequests.remove(loadingRequest)
  }

  // MARK: URLSessionDelegate

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
    bufferData.append(data)
    writeBufferDataToFileIfNeeded()
    if (self.response != nil) {
      processPendingRequests()
    }
  }

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse, completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
    self.response = response
    processPendingRequests()
    completionHandler(.allow)
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    if let error = error {
      downloadFailed(with: error)
      return
    }

    if bufferData.count > 0 {
      fileHandle.append(data: bufferData)
    }

    let error = verifyResponse()

    guard error == nil else {
      downloadFailed(with: error!)
      return
    }

    downloadComplete()
  }

  // MARK: Internal methods

  func startDataRequest(with url: URL) {
    guard session == nil else { return }

    let configuration = URLSessionConfiguration.default
    configuration.requestCachePolicy = .reloadIgnoringLocalAndRemoteCacheData
    var urlRequest = URLRequest(url: url)
    owner?.urlRequestHeaders?.forEach { urlRequest.setValue($0.value, forHTTPHeaderField: $0.key) }
    session = URLSession(configuration: configuration, delegate: self, delegateQueue: nil)
    session?.dataTask(with: urlRequest).resume()
  }

  func invalidateAndCancelSession() {
    session?.invalidateAndCancel()
  }

  // MARK: Private methods

  private func processPendingRequests() {
    lock.lock()
    defer { lock.unlock() }

    // Filter out the unfullfilled requests
    let requestsFulfilled: Set<AVAssetResourceLoadingRequest> = pendingRequests.filter {
      fillInContentInformationRequest($0.contentInformationRequest)
      guard haveEnoughDataToFulfillRequest($0.dataRequest!) else { return false }

      $0.finishLoading()
      return true
    }

    // Remove fulfilled requests from pending requests
    requestsFulfilled.forEach { pendingRequests.remove($0) }
  }

  private func fillInContentInformationRequest(_ contentInformationRequest: AVAssetResourceLoadingContentInformationRequest?) {
    // Do we have response from the server?
    guard let response = response else {
      return
    }

    if let mimeType = response.mimeType {
      let rawUti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, mimeType as CFString, nil)?.takeRetainedValue() as? String

      contentInformationRequest?.contentType = rawUti ?? response.mimeType
    }
    contentInformationRequest?.contentLength = response.expectedContentLength
    contentInformationRequest?.isByteRangeAccessSupported = true
  }

  private func haveEnoughDataToFulfillRequest(_ dataRequest: AVAssetResourceLoadingDataRequest) -> Bool {
    let requestedOffset = Int(dataRequest.requestedOffset)
    let requestedLength = dataRequest.requestedLength
    let currentOffset = Int(dataRequest.currentOffset)
    let bytesCached = fileHandle.fileSize

    // Is there enough data cached to fulfill the request?
    guard bytesCached > currentOffset else { return false }

    // Data length to be loaded into memory with maximum size of readDataLimit.
    let bytesToRespond = min(bytesCached - currentOffset, requestedLength, readDataLimit)

    // Read data from disk and pass it to the dataRequest
    guard let data = fileHandle.readData(withOffset: currentOffset, forLength: bytesToRespond) else { return false }
    dataRequest.respond(with: data)

    return bytesCached >= requestedLength + requestedOffset
  }

  private func writeBufferDataToFileIfNeeded() {
    lock.lock()
    defer { lock.unlock() }

    guard bufferData.count >= downloadBufferLimit else { return }

    fileHandle.append(data: bufferData)
    bufferData = Data()
  }

  private func downloadComplete() {
    processPendingRequests()

    isDownloadComplete = true

    if let mimeType = response?.mimeType {
      saveMimeType(forUrl: url, mimeType: mimeType)
    }
  }

  func saveMimeType(forUrl: URL, mimeType: String) {
    let filePath = CachingPlayerItem.pathForUrl(url: url, fileExtension: url.pathExtension)
    let mimeTypeCachePath = filePath + VideoCacheManager.mimeTypeSuffix

    do {
      if (FileManager.default.fileExists(atPath: mimeTypeCachePath)) {
        try FileManager.default.removeItem(atPath: mimeTypeCachePath)
      }
      FileManager.default.createFile(atPath: mimeTypeCachePath, contents: Data(mimeType.utf8))
    } catch {
      print("Failed to delete file at: \(mimeTypeCachePath)")
    }
  }

  static func readMimeType(forUrl url: URL) -> String? {
    let filePath = CachingPlayerItem.pathForUrl(url: url, fileExtension: url.pathExtension)
    let mimeTypeCachePath = filePath + VideoCacheManager.mimeTypeSuffix

    do {
      guard FileManager.default.fileExists(atPath: mimeTypeCachePath) else {
        return nil
      }

      let data = try Data(contentsOf: URL(fileURLWithPath: mimeTypeCachePath))

      return String(data: data, encoding: .utf8)
    } catch {
      print("An error occurred while reading the MIME type: \(error)")
      return nil
    }
  }

  private func verifyResponse() -> NSError? {
    guard let response = response as? HTTPURLResponse else { return nil }

    let shouldVerifyDownloadedFileSize = CachingPlayerItemConfiguration.shouldVerifyDownloadedFileSize
    let minimumExpectedFileSize = CachingPlayerItemConfiguration.minimumExpectedFileSize
    var error: NSError?

    if response.statusCode >= 400 {
      error = NSError(domain: "Failed downloading asset. Reason: response status code \(response.statusCode).", code: response.statusCode, userInfo: nil)
    } else if shouldVerifyDownloadedFileSize && response.expectedContentLength != -1 && response.expectedContentLength != fileHandle.fileSize {
      error = NSError(domain: "Failed downloading asset. Reason: wrong file size, expected: \(response.expectedContentLength), actual: \(fileHandle.fileSize).", code: response.statusCode, userInfo: nil)
    } else if minimumExpectedFileSize > 0 && minimumExpectedFileSize > fileHandle.fileSize {
      error = NSError(domain: "Failed downloading asset. Reason: file size \(fileHandle.fileSize) is smaller than minimumExpectedFileSize", code: response.statusCode, userInfo: nil)
    }

    return error
  }

  private func downloadFailed(with error: Error) {
    fileHandle.deleteFile()
  }

  @objc private func handleAppWillTerminate() {
    // We need to only remove the file if it hasn't been fully downloaded
    guard isDownloadComplete == false else { return }

    fileHandle.deleteFile()
  }
}
