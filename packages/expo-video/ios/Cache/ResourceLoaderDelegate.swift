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
  /// Caller-declared request headers. Variant matching only considers these;
  /// `URLSession` may additionally attach cookies from `HTTPCookieStorage.shared`
  /// at request time, and those don't reach the variant index — so two
  /// identities differing only in auto-attached cookies will not be separated.
  private let urlRequestHeaders: [String: String]?
  private let variantKey: String
  /// Set to `false` when the response forbids storage (e.g. `Vary: *`,
  /// `Cache-Control: no-store`). Any data already written for this request is
  /// evicted when the session ends.
  private var responseAllowsStorage: Bool = true
  private var policyEvaluated: Bool = false
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

  init(url: URL, saveFilePath: String, fileExtension: String, urlRequestHeaders: [String: String]?, variantKey: String) {
    self.url = url
    self.saveFilePath = saveFilePath
    self.fileExtension = fileExtension
    self.urlRequestHeaders = urlRequestHeaders
    self.variantKey = variantKey
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
      guard currentOffset >= requestedOffset else {
        log.warn("[expo-video] Current offset (\(currentOffset)) < requested offset (\(requestedOffset))")
        return
      }

      let currentDataResponseOffset = Int(currentOffset - requestedOffset)
      guard currentDataResponseOffset >= 0 && currentDataResponseOffset <= cachableRequest.receivedData.count else {
        log.warn("Invalid offset: \(currentDataResponseOffset), receivedData.count: \(cachableRequest.receivedData.count)")
        return
      }

      let currentDataResponseLength = cachableRequest.receivedData.count - currentDataResponseOffset
      guard currentDataResponseLength >= 0 else {
        return
      }

      let endOffset = currentDataResponseOffset + currentDataResponseLength
      guard endOffset <= cachableRequest.receivedData.count else {
        log.warn("[expo-video] End offset (\(endOffset)) exceeds receivedData.count (\(cachableRequest.receivedData.count))")
        return
      }

      let subdata = cachableRequest.receivedData.subdata(in: currentDataResponseOffset..<endOffset)
      dataRequest.respond(with: subdata)
    } else if currentOffset >= requestedOffset && currentOffset - requestedOffset < cachableRequest.receivedData.count {
      let rangeStart = Int(currentOffset - requestedOffset)
      let rangeLength = min(cachableRequest.receivedData.count - rangeStart, length)

      guard rangeStart >= 0 && rangeStart < cachableRequest.receivedData.count && rangeLength > 0 else {
        return
      }

      let endOffset = rangeStart + rangeLength
      guard endOffset <= cachableRequest.receivedData.count else {
        log.warn("[expo-video] End offset (\(endOffset)) exceeds receivedData.count (\(cachableRequest.receivedData.count))")
        return
      }

      let subdata = cachableRequest.receivedData.subdata(in: rangeStart..<endOffset)
      dataRequest.respond(with: subdata)
    }
  }

  func urlSession(
    _ session: URLSession,
    dataTask: URLSessionDataTask,
    didReceive response: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    evaluateCachePolicy(forResponse: response)
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

  private func evaluateCachePolicy(forResponse response: URLResponse) {
    guard !policyEvaluated, let httpResponse = response as? HTTPURLResponse else {
      return
    }
    policyEvaluated = true
    var headers: [String: String] = [:]
    for (key, value) in httpResponse.allHeaderFields {
      if let keyString = key as? String, let valueString = value as? String {
        headers[keyString] = valueString
      }
    }
    let policy = CachePolicy.evaluate(responseHeaders: headers, statusCode: httpResponse.statusCode)
    let normalizedRequest = (urlRequestHeaders ?? [:]).reduce(into: [String: String]()) { acc, pair in
      acc[pair.key.lowercased()] = pair.value
    }
    let hasAuthorization = normalizedRequest["authorization"] != nil
    let authorizationCoveredByVary = policy.varyHeaders.contains("authorization")
    let authorizationBlocked = hasAuthorization && !authorizationCoveredByVary && !policy.allowsAuthorizedReuse

    responseAllowsStorage = policy.isCacheable && !authorizationBlocked

    // For both !isCacheable and §3.5 cases we drop just this variant's bytes;
    // other variants for the same URL may still be valid representations.
    if !responseAllowsStorage {
      evictStoredFiles()
      return
    }
    CacheVariantIndex.recordVariant(
      forUrl: url,
      storageKey: variantKey,
      requestHeaders: urlRequestHeaders,
      policy: policy
    )
  }

  private func evictStoredFiles() {
    try? FileManager.default.removeItem(atPath: saveFilePath)
    try? FileManager.default.removeItem(atPath: saveFilePath + VideoCacheManager.mediaInfoSuffix)
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    guard let cachedDataRequest = cachableRequest(by: task) else {
      return
    }

    // The data shouldn't be corrupted and can be cached
    if let error = error as? URLError, error.code == URLError.cancelled || error.code == URLError.networkConnectionLost {
      if responseAllowsStorage {
        cachedDataRequest.saveData(to: cachedResource)
      }
      cachedDataRequest.loadingRequest.finishLoading(with: error)
    } else if error == nil {
      if responseAllowsStorage {
        cachedDataRequest.saveData(to: cachedResource)
      }
      cachedDataRequest.loadingRequest.finishLoading()
    } else {
      cachedDataRequest.loadingRequest.finishLoading(with: error)
    }
    cachableRequests.remove(cachedDataRequest)
  }

  private func processLoadingRequest(loadingRequest: AVAssetResourceLoadingRequest) {
    let (remainingRequest, dataReceived) = attemptToRespondFromCache(forRequest: loadingRequest)

    // Cache fulfilled the entire request
    if dataReceived != nil && dataReceived?.isEmpty != true && remainingRequest == nil {
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
      log.warn("[expo-video] ResourceLoaderDelegate has received a loading request without a data request")
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
