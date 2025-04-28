import Foundation
import AVFoundation
import UIKit
import CoreServices
import ExpoModulesCore

/**
 * Class responsible for fulfilling data requests created  by the AVAsset. There are two types of requests:
 * - Initial request  - The response contains most of the information about the data source such as support for content ranges, total size etc.
 *   this information is cached for offline playback support.
 * - Data request - For each range request from the player the delegate will request and receive multiple chunks of data. We have to return a correct subrange
 *   of data and cache it. If a chunk of data is already available we will return it from cache.
 */
final class ResourceLoaderDelegate: NSObject, AVAssetResourceLoaderDelegate, URLSessionDelegate, URLSessionDataDelegate, URLSessionTaskDelegate {
  private let url: URL
  private let saveFilePath: String
  private let fileExtension: String
  private let cachedResource: CachedResource
  private let urlRequestHeaders: [String: String]?
  internal var onError: ((Error) -> Void)?

  private var cachableRequests: SynchronizedHashTable<CachableRequest> = SynchronizedHashTable()
  private var session: URLSession?

  /**
   * The default requestTimeoutInterval is 60, which is  too long (UI should respond relatively quickly to network errors)
   */
  private static let requestTimeoutInterval: Double = 5

  // When playing from an url without an extension appends an extension to the path based on the response from the server
  private var pathWithExtension: String {
    let ext = mimeTypeToExtension(mimeType: cachedResource.mediaInfo?.mimeType)
    if let ext, self.fileExtension.isEmpty {
      return self.saveFilePath + ".\(ext)"
    }
    return self.saveFilePath
  }

  init(url: URL, saveFilePath: String, fileExtension: String, urlRequestHeaders: [String: String]?) {
    self.url = url
    self.saveFilePath = saveFilePath
    self.fileExtension = fileExtension
    self.urlRequestHeaders = urlRequestHeaders
    cachedResource = CachedResource(dataFileUrl: saveFilePath, resourceUrl: url, dataPath: saveFilePath)
    super.init()
    self.session = URLSession(configuration: .default, delegate: self, delegateQueue: nil)
  }

  deinit {
    session?.invalidateAndCancel()
    session = nil
  }

  // MARK: - AVAssetResourceLoaderDelegate

  func resourceLoader(_ resourceLoader: AVAssetResourceLoader, shouldWaitForLoadingOfRequestedResource loadingRequest: AVAssetResourceLoadingRequest) -> Bool {
    processLoadingRequest(loadingRequest: loadingRequest)
    return true
  }

  func resourceLoader(_ resourceLoader: AVAssetResourceLoader, didCancel loadingRequest: AVAssetResourceLoadingRequest) {
    cachableRequest(by: loadingRequest)?.dataTask.cancel()
  }

  // MARK: - URLSessionDelegate

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
    guard let currentRequest = dataTask.currentRequest,
      let response = dataTask.response as? HTTPURLResponse,
      let cachableRequest = cachableRequest(by: dataTask) else {
      return
    }

    let dataRequest = cachableRequest.dataRequest
    let requestedOffset = dataRequest.requestedOffset
    let currentOffset = dataRequest.currentOffset
    let length = dataRequest.requestedLength

    // If finding correct subdata failed, fallback to pure received data
    let subdata = data.subdata(request: currentRequest, response: response) ?? data

    // Append modified or original data
    cachableRequest.onReceivedData(data: subdata)

    if dataRequest.requestsAllDataToEndOfResource {
      let currentDataResponseOffset = Int(currentOffset - requestedOffset)
      let currentDataResponseLength = cachableRequest.receivedData.count - currentDataResponseOffset
      let subdata = cachableRequest.receivedData.subdata(in: currentDataResponseOffset..<currentDataResponseOffset + currentDataResponseLength)
      dataRequest.respond(with: subdata)
    } else if currentOffset - requestedOffset <= cachableRequest.receivedData.count {
      let rangeStart = Int(currentOffset - requestedOffset)
      let rangeLength = min(cachableRequest.receivedData.count - rangeStart, length)
      let subdata = cachableRequest.receivedData.subdata(in: rangeStart..<rangeStart + rangeLength)
      dataRequest.respond(with: subdata)
    }
  }

  func urlSession(
    _ session: URLSession,
    dataTask: URLSessionDataTask,
    didReceive response: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    if let cachedDataRequest = cachableRequest(by: dataTask) {
      cachedDataRequest.response = response
      if cachedDataRequest.loadingRequest.contentInformationRequest != nil {
        fillInContentInformationRequest(forDataRequest: cachedDataRequest)
        cachedDataRequest.loadingRequest.response = response
        cachedDataRequest.loadingRequest.finishLoading()
        cachedDataRequest.dataTask.cancel()
        cachableRequests.remove(cachedDataRequest)
      }
    }
    completionHandler(.allow)
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    guard let cachedDataRequest = cachableRequest(by: task) else {
      return
    }

    // The data shouldn't be corrupted and can be cached
    if let error = error as? URLError, error.code == URLError.cancelled || error.code == URLError.networkConnectionLost {
      cachedDataRequest.saveData(to: cachedResource)
    } else if error == nil {
      cachedDataRequest.saveData(to: cachedResource)
    } else {
      cachedDataRequest.loadingRequest.finishLoading(with: error)
    }
    cachedDataRequest.loadingRequest.finishLoading(with: error)
    cachableRequests.remove(cachedDataRequest)
  }

  private func processLoadingRequest(loadingRequest: AVAssetResourceLoadingRequest) {
    let (remainingRequest, dataReceived) = attemptToRespondFromCache(forRequest: loadingRequest)

    // Cache fulfilled the entire request
    if dataReceived != nil && remainingRequest == nil {
      return
    }

    var request = remainingRequest ?? createUrlRequest()

    // remainingRequest will have correct range header fields
    if remainingRequest == nil {
      addRangeHeaderFields(loadingRequest: loadingRequest, urlRequest: &request)
    }

    guard let session else {
      return
    }

    let dataTask = session.dataTask(with: request)

    // we can't do `if let loadingRequest = loadingRequest.dataRequest` as this would create new variable by copying
    if loadingRequest.dataRequest != nil {
      let cachableRequest = CachableRequest(loadingRequest: loadingRequest, dataTask: dataTask, dataRequest: loadingRequest.dataRequest!)
      // We need to add the data that was received from cache in order to keep byte offsets consistent
      if let dataReceived {
        cachableRequest.onReceivedData(data: dataReceived)
      }
      cachableRequests.add(cachableRequest)
    } else {
      log.warn("ResourceLoaderDelegate has received a loading request without a data request")
    }
    dataTask.resume()
  }

  private func fillInContentInformationRequest(forDataRequest request: CachableRequest?) {
    guard let response = request?.response as? HTTPURLResponse else {
      return
    }

    request?.loadingRequest.contentInformationRequest?.contentLength = response.expectedContentLength
    request?.loadingRequest.contentInformationRequest?.isByteRangeAccessSupported = true

    if let mimeType = response.mimeType, isSupported(mimeType: mimeType) {
      let rawUti = UTType(mimeType: mimeType)?.identifier
      request?.loadingRequest.contentInformationRequest?.contentType = rawUti ?? response.mimeType
      cachedResource.onResponseReceived(response: response)
    } else {
      // We can't control the AVPlayer.error property that will be set after the player fails to load the resource
      // We have an additional field that can be used to return a more specific error
      onError?(VideoCacheUnsupportedFormatException(response.mimeType ?? ""))
    }
  }

  /// Attempts to load the request from cache, if just the beginning of the requested data  is available, returns a URL request to fetch the rest of the data
  private func attemptToRespondFromCache(forRequest loadingRequest: AVAssetResourceLoadingRequest) -> (request: URLRequest?, dataReceived: Data?) {
    guard let dataRequest = loadingRequest.dataRequest else {
      return (nil, nil)
    }

    let from = dataRequest.requestedOffset
    let to = from + Int64(dataRequest.requestedLength) - 1

    // Try to return the whole data from the cache
    if let cachedData = cachedResource.requestData(from: from, to: to) {
      if loadingRequest.contentInformationRequest != nil {
        cachedResource.fill(forLoadingRequest: loadingRequest)
      }
      loadingRequest.dataRequest?.respond(with: cachedData)
      loadingRequest.finishLoading()
      return (nil, cachedData)
    }

    // Try to return the beginning of the data, and create a request for the remainder
    if let partialData = cachedResource.requestBeginningOfData(from: from, to: to) {
      if loadingRequest.contentInformationRequest != nil {
        cachedResource.fill(forLoadingRequest: loadingRequest)
      }
      loadingRequest.dataRequest?.respond(with: partialData)

      var request = createUrlRequest()
      if loadingRequest.contentInformationRequest == nil {
        if loadingRequest.dataRequest?.requestsAllDataToEndOfResource == true {
          let requestedOffset = dataRequest.requestedOffset
          request.setValue("bytes=\(Int(requestedOffset) + partialData.count)-", forHTTPHeaderField: "Range")
        } else if let dataRequest = loadingRequest.dataRequest {
          let requestedOffset = dataRequest.requestedOffset
          let requestedLength = dataRequest.requestedLength
          let from = Int(requestedOffset) + partialData.count
          let to = from + requestedLength - partialData.count - 1
          request.setValue("bytes=\(from)-\(to)", forHTTPHeaderField: "Range")
        }
      }
      return (request, partialData)
    }

    return (nil, nil)
  }

  // The loading resource might want only a part of the video
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range
  private func addRangeHeaderFields(loadingRequest: AVAssetResourceLoadingRequest, urlRequest: inout URLRequest) {
    guard let dataRequest = loadingRequest.dataRequest, loadingRequest.contentInformationRequest == nil else {
      return
    }

    if dataRequest.requestsAllDataToEndOfResource {
      let requestedOffset = dataRequest.requestedOffset
      urlRequest.setValue("bytes=\(requestedOffset)-", forHTTPHeaderField: "Range")
      return
    }

    let requestedOffset = dataRequest.requestedOffset
    let requestedLength = Int64(dataRequest.requestedLength)
    urlRequest.setValue("bytes=\(requestedOffset)-\(requestedOffset + requestedLength - 1)", forHTTPHeaderField: "Range")
  }

  private func isSupported(mimeType: String?) -> Bool {
    return mimeType?.starts(with: "video/") ?? false
  }

  private func createUrlRequest() -> URLRequest {
    var request = URLRequest(url: url, cachePolicy: .useProtocolCachePolicy)
    request.timeoutInterval = Self.requestTimeoutInterval

    self.urlRequestHeaders?.forEach { request.setValue($0.value, forHTTPHeaderField: $0.key) }
    return request
  }

  private func cachableRequest(by loadingRequest: AVAssetResourceLoadingRequest) -> CachableRequest? {
    return cachableRequests.allObjects.first(where: {
      $0.loadingRequest == loadingRequest
    })
  }

  private func cachableRequest(by task: URLSessionTask) -> CachableRequest? {
    return cachableRequests.allObjects.first(where: {
      $0.dataTask == task
    })
  }
}
