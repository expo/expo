// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/**
 A `URLSession` interceptor which passes network events to its delegate
 */
@objc(EXRequestInterceptorProtocol)
public final class ExpoRequestInterceptorProtocol: URLProtocol, URLSessionDataDelegate {
  private static let sessionDelegateProxy = URLSessionSessionDelegateProxy()
  private static let urlSession = URLSession(
    configuration: URLSessionConfiguration.default,
    delegate: sessionDelegateProxy,
    delegateQueue: nil
  )
  private var requestId: String?
  private var dataTask_: URLSessionDataTask?
  private let responseBody = NSMutableData()
  private var responseBodyExceedsLimit = false

  static let MAX_BODY_SIZE = 1_048_576

  // Currently keeps the delegate fixed for ExpoRequestCdpInterceptor and be thread-safe
  static let delegate: ExpoRequestInterceptorProtocolDelegate = ExpoRequestCdpInterceptor.shared

  // MARK: URLProtocol implementations

  public override class func canInit(with request: URLRequest) -> Bool {
    guard let scheme = request.url?.scheme else {
      return false
    }
    if !["http", "https"].contains(scheme) {
      return false
    }
    return URLProtocol.property(
      forKey: REQUEST_ID,
      in: request
    ) == nil
  }

  override init(
    request: URLRequest,
    cachedResponse: CachedURLResponse?,
    client: URLProtocolClient?
  ) {
    super.init(request: request, cachedResponse: cachedResponse, client: client)
    // swiftlint:disable force_cast
    let mutableRequest = request as! NSMutableURLRequest
    // swiftlint:enable force_cast
    self.requestId = Self.sessionDelegateProxy.addDelegate(delegate: self)
    guard let requestId else {
      fatalError("requestId should not be nil.")
    }
    URLProtocol.setProperty(
      requestId,
      forKey: REQUEST_ID,
      in: mutableRequest
    )
    let dataTask = Self.urlSession.dataTask(with: mutableRequest as URLRequest)
    Self.delegate.willSendRequest(
      requestId: requestId,
      task: dataTask,
      request: mutableRequest as URLRequest,
      redirectResponse: nil
    )
    dataTask_ = dataTask
  }

  public override class func canonicalRequest(for request: URLRequest) -> URLRequest {
    request
  }

  public override func startLoading() {
    dataTask_?.resume()
  }

  public override func stopLoading() {
    dataTask_?.cancel()
    if let requestId {
      Self.sessionDelegateProxy.removeDelegate(requestId: requestId)
    }
  }

  // MARK: URLSessionDataDelegate implementations

  public func urlSession(_: URLSession, dataTask _: URLSessionDataTask, didReceive data: Data) {
    client?.urlProtocol(self, didLoad: data)
    if responseBody.length + data.count <= Self.MAX_BODY_SIZE {
      responseBody.append(data)
    } else {
      responseBodyExceedsLimit = true
    }
  }

  public func urlSession(_: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    if let error = error {
      client?.urlProtocol(self, didFailWithError: error)
    } else {
      if let response = task.response as? HTTPURLResponse,
        let requestId {
        let contentType = response.value(forHTTPHeaderField: "Content-Type")
        let isText = (contentType?.starts(with: "text/") ?? false) || contentType == "application/json"
        Self.delegate.didReceiveResponse(
          requestId: requestId, task: task, responseBody: responseBody as Data, isText: isText, responseBodyExceedsLimit: responseBodyExceedsLimit)
      }
      client?.urlProtocolDidFinishLoading(self)
    }
  }

  public func urlSession(
    _: URLSession,
    dataTask: URLSessionDataTask,
    didReceive response: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    completionHandler(.allow)
    client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .allowed)
  }

  public func urlSession(
    _: URLSession,
    task: URLSessionTask,
    willPerformHTTPRedirection response: HTTPURLResponse,
    newRequest request: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void
  ) {
    if let requestId {
      Self.delegate.willSendRequest(
        requestId: requestId,
        task: task,
        request: request,
        redirectResponse: response
      )
    }
    completionHandler(request)
  }

  /**
   Data structure to save the response for redirection
   */
  private struct RedirectResponse {
    let requestId: String
    let redirectResponse: HTTPURLResponse
  }
}

/**
 The delegate to dispatch network request events
 */
@objc(EXRequestInterceptorProtocolDelegate)
protocol ExpoRequestInterceptorProtocolDelegate {
  @objc
  func willSendRequest(requestId: String, task: URLSessionTask, request: URLRequest, redirectResponse: HTTPURLResponse?)

  @objc
  func didReceiveResponse(requestId: String, task: URLSessionTask, responseBody: Data, isText: Bool, responseBodyExceedsLimit: Bool)
}

/**
 Shared URLSessionDataDelegate instance and delete calls back to ExpoRequestInterceptorProtocol instances.
 */
private class URLSessionSessionDelegateProxy: NSObject, URLSessionDataDelegate {
  private var requestIdProvider = RequestIdProvider()
  private var delegateMap: [String: URLSessionDataDelegate] = [:]
  private let dispatchQueue = ExpoRequestCdpInterceptor.shared.dispatchQueue

  func addDelegate(delegate: URLSessionDataDelegate) -> String {
    let requestId = self.requestIdProvider.create()
    self.dispatchQueue.async {
      self.delegateMap[requestId] = delegate
    }
    return requestId
  }

  func removeDelegate(requestId: String) {
    self.dispatchQueue.async {
      self.delegateMap.removeValue(forKey: requestId)
    }
  }

  private func getRequestId(task: URLSessionTask) -> String? {
    if let currentRequest = task.currentRequest,
      let requestId = URLProtocol.property(
        forKey: REQUEST_ID,
        in: currentRequest
      ) as? String {
      return requestId
    }
    return nil
  }

  private func getDelegate(requestId: String) -> URLSessionDataDelegate? {
    return self.dispatchQueue.sync {
      return self.delegateMap[requestId]
    }
  }

  private func getDelegate(task: URLSessionTask) -> URLSessionDataDelegate? {
    guard let requestId = self.getRequestId(task: task) else {
      return nil
    }
    return self.getDelegate(requestId: requestId)
  }

  // MARK: URLSessionDataDelegate implementations

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive: Data) {
    if let delegate = getDelegate(task: dataTask) {
      delegate.urlSession?(
        session,
        dataTask: dataTask,
        didReceive: didReceive)
    }
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError: Error?) {
    if let requestId = self.getRequestId(task: task), let delegate = getDelegate(requestId: requestId) {
      delegate.urlSession?(
        session,
        task: task,
        didCompleteWithError: didCompleteWithError)
      self.removeDelegate(requestId: requestId)
    }
  }

  func urlSession(
    _ session: URLSession,
    dataTask: URLSessionDataTask,
    didReceive: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    if let delegate = getDelegate(task: dataTask) {
      delegate.urlSession?(
        session,
        dataTask: dataTask,
        didReceive: didReceive,
        completionHandler: completionHandler)
    }
  }

  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    willPerformHTTPRedirection: HTTPURLResponse,
    newRequest: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void
  ) {
    if let delegate = getDelegate(task: task) {
      delegate.urlSession?(
        session,
        task: task,
        willPerformHTTPRedirection: willPerformHTTPRedirection,
        newRequest: newRequest,
        completionHandler: completionHandler)
    }
  }

  /**
   A helper class to create a unique request ID
   */
  private struct RequestIdProvider {
    private var value: UInt64 = 0

    mutating func create() -> String {
      // We could ensure the increment thread safety,
      // because we access this function from the same thread (com.apple.CFNetwork.CustomProtocols).
      value += 1
      return String(value)
    }
  }
}

private let REQUEST_ID = "ExpoRequestInterceptorProtocol.requestId"
