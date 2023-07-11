// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/**
 A `URLSession` interceptor which passes network events to its delegate
 */
@objc(EXRequestInterceptorProtocol)
public final class ExpoRequestInterceptorProtocol: URLProtocol, URLSessionDataDelegate {
  private static let REQUEST_ID = "ExpoRequestInterceptorProtocol.requestId"
  private static var requestIdProvider = RequestIdProvider()
  private lazy var urlSession = URLSession(
    configuration: URLSessionConfiguration.default,
    delegate: self,
    delegateQueue: nil
  )
  private var dataTask_: URLSessionDataTask?
  private let responseBody = NSMutableData()
  private var responseIsText = false
  private var responseContentLength: Int64 = 0

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
    let isNewRequest = URLProtocol.property(
      forKey: Self.REQUEST_ID,
      in: request
    ) == nil
    return isNewRequest
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
    let requestId = Self.requestIdProvider.create()
    URLProtocol.setProperty(
      requestId,
      forKey: Self.REQUEST_ID,
      in: mutableRequest
    )
    Self.delegate.willSendRequest(
      requestId: requestId,
      request: mutableRequest as URLRequest,
      redirectResponse: nil
    )
    dataTask_ = urlSession.dataTask(with: mutableRequest as URLRequest)
  }

  public override class func canonicalRequest(for request: URLRequest) -> URLRequest {
    request
  }

  public override func startLoading() {
    dataTask_?.resume()
  }

  public override func stopLoading() {
    dataTask_?.cancel()
  }

  // MARK: URLSessionDataDelegate implementations

  public func urlSession(_: URLSession, dataTask _: URLSessionDataTask, didReceive data: Data) {
    client?.urlProtocol(self, didLoad: data)
    if responseBody.length + data.count <= Self.MAX_BODY_SIZE {
      responseBody.append(data)
    }
  }

  public func urlSession(
    _: URLSession,
    dataTask: URLSessionDataTask,
    didReceive response: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    if let resp = response as? HTTPURLResponse,
      let currentRequest = dataTask.currentRequest,
      let requestId = URLProtocol.property(
        forKey: Self.REQUEST_ID,
        in: currentRequest
      ) as? String {
      Self.delegate.didReceiveResponse(
        requestId: requestId,
        request: currentRequest,
        response: resp
      )

      let contentType = resp.value(forHTTPHeaderField: "Content-Type")
      responseIsText = (contentType?.starts(with: "text/") ?? false) || contentType == "application/json"
      responseContentLength = resp.expectedContentLength
    }
    completionHandler(.allow)
    client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .allowed)
  }

  public func urlSession(_: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    if let error = error {
      client?.urlProtocol(self, didFailWithError: error)
    } else {
      if responseContentLength > 0 && responseContentLength <= Self.MAX_BODY_SIZE,
        let currentRequest = task.currentRequest,
        let requestId = URLProtocol.property(
          forKey: Self.REQUEST_ID,
          in: currentRequest
        ) as? String {
        Self.delegate.didReceiveResponseBody(
          requestId: requestId, responseBody: responseBody as Data, isText: responseIsText)
      }
      client?.urlProtocolDidFinishLoading(self)
    }
  }

  public func urlSession(
    _: URLSession,
    task _: URLSessionTask,
    willPerformHTTPRedirection response: HTTPURLResponse,
    newRequest request: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void
  ) {
    if let requestId = URLProtocol.property(forKey: Self.REQUEST_ID, in: request) as? String {
      Self.delegate.willSendRequest(
        requestId: requestId,
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

/**
 The delegate to dispatch network request events
 */
@objc(EXRequestInterceptorProtocolDelegate)
protocol ExpoRequestInterceptorProtocolDelegate {
  @objc
  func willSendRequest(requestId: String, request: URLRequest, redirectResponse: HTTPURLResponse?)

  @objc
  func didReceiveResponse(requestId: String, request: URLRequest, response: HTTPURLResponse)

  @objc
  func didReceiveResponseBody(requestId: String, responseBody: Data, isText: Bool)
}
