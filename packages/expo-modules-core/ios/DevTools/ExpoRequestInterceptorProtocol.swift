// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/**
 A `URLSession` interceptor which passes network events to its delegate
 */
@objc(EXRequestInterceptorProtocol)
public final class ExpoRequestInterceptorProtocol: URLProtocol, URLSessionDataDelegate {
  private static var requestIdProvider = RequestIdProvider()
  private static let sessionDelegate
    = URLSessionSessionDelegateProxy(dispatchQueue: ExpoRequestCdpInterceptor.shared.dispatchQueue)
  private static let urlSession = URLSession(
    configuration: URLSessionConfiguration.default,
    delegate: sessionDelegate,
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
    self.requestId = Self.requestIdProvider.create()
    guard let requestId else {
      fatalError("requestId should not be nil.")
    }
    URLProtocol.setProperty(
      requestId,
      forKey: REQUEST_ID,
      in: mutableRequest
    )
    let dataTask = Self.urlSession.dataTask(with: mutableRequest as URLRequest)
    Self.sessionDelegate.addDelegate(task: dataTask, delegate: self)
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
    if let task = dataTask_ {
      task.cancel()
      Self.sessionDelegate.removeDelegate(task: task)
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

  public func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    didReceive challenge: URLAuthenticationChallenge,
    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
  ) {
    let sender = URLAuthenticationChallengeForwardSender(completionHandler: completionHandler)
    let challengeWithSender = URLAuthenticationChallenge(authenticationChallenge: challenge, sender: sender)
    client?.urlProtocol(self, didReceive: challengeWithSender)
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
 A helper class to create a unique request ID
 */
private struct RequestIdProvider {
  private var value: UInt64 = 0

  mutating func create() -> String {
    // We can ensure it is thread-safe to increment this value,
    // because we always access this function from the same thread (com.apple.CFNetwork.CustomProtocols).
    value += 1
    return String(value)
  }
}

private let REQUEST_ID = "ExpoRequestInterceptorProtocol.requestId"
