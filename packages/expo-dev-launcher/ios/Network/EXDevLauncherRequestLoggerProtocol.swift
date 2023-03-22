/**
 A `URLSession` interceptor to log requests and send events to the `EXDevLauncherNetworkLogger`
 */
@objc
class EXDevLauncherRequestLoggerProtocol: URLProtocol, URLSessionDataDelegate {
  private static let REQUEST_ID = "EXDevLauncherRequestLoggerProtocol.requestId"
  private static let REDIRECT_RESPONSE = "EXDevLauncherRequestLoggerProtocol.redirectResponse"
  static let MAX_BODY_SIZE = 1_048_576
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

  // MARK: URLProtocol implementations

  override class func canInit(with request: URLRequest) -> Bool {
    guard let scheme = request.url?.scheme else {
      return false
    }
    if !["http", "https"].contains(scheme) {
      return false
    }
    let isNewRequest = URLProtocol.property(
      forKey: EXDevLauncherRequestLoggerProtocol.REQUEST_ID,
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
    let mutableRequest = request as! MutableURLRequest
    // swiftlint:enable force_cast
    let redirectResponse = URLProtocol.property(
      forKey: EXDevLauncherRequestLoggerProtocol.REDIRECT_RESPONSE,
      in: request
    ) as? RedirectResponse
    let requestId = redirectResponse?.requestId ?? EXDevLauncherRequestLoggerProtocol.requestIdProvider.create()
    URLProtocol.setProperty(
      requestId,
      forKey: EXDevLauncherRequestLoggerProtocol.REQUEST_ID,
      in: mutableRequest
    )
    EXDevLauncherNetworkLogger.shared.emitNetworkWillBeSent(
      request: mutableRequest as URLRequest,
      requestId: requestId,
      redirectResponse: redirectResponse?.redirectResponse
    )
    dataTask_ = urlSession.dataTask(with: mutableRequest as URLRequest)
  }

  override class func canonicalRequest(for request: URLRequest) -> URLRequest {
    request
  }

  override func startLoading() {
    dataTask_?.resume()
  }

  override func stopLoading() {
    dataTask_?.cancel()
  }

  // MARK: URLSessionDataDelegate implementations

  func urlSession(_: URLSession, dataTask _: URLSessionDataTask, didReceive data: Data) {
    client?.urlProtocol(self, didLoad: data)
    if responseBody.length + data.count <= EXDevLauncherRequestLoggerProtocol.MAX_BODY_SIZE {
      responseBody.append(data)
    }
  }

  func urlSession(
    _: URLSession,
    dataTask: URLSessionDataTask,
    didReceive response: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    if let resp = response as? HTTPURLResponse,
      let currentRequest = dataTask.currentRequest,
      let requestId = URLProtocol.property(
        forKey: EXDevLauncherRequestLoggerProtocol.REQUEST_ID,
        in: currentRequest
      ) as? String {
      EXDevLauncherNetworkLogger.shared.emitNetworkResponse(
        request: request,
        requestId: requestId,
        response: resp
      )

      let contentType = resp.value(forHTTPHeaderField: "Content-Type")
      responseIsText = (contentType?.starts(with: "text/") ?? false) || contentType == "application/json"
      responseContentLength = resp.expectedContentLength
    }
    completionHandler(.allow)
    client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .allowed)
  }

  func urlSession(_: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    if let error = error {
      client?.urlProtocol(self, didFailWithError: error)
    } else {
      client?.urlProtocolDidFinishLoading(self)
      if responseContentLength > 0 && responseContentLength <= EXDevLauncherRequestLoggerProtocol.MAX_BODY_SIZE,
        let currentRequest = task.currentRequest,
        let requestId = URLProtocol.property(
          forKey: EXDevLauncherRequestLoggerProtocol.REQUEST_ID,
          in: currentRequest
        ) as? String {
        EXDevLauncherNetworkLogger.shared.emitNetworkDidReceiveBody(
          requestId: requestId, responseBody: responseBody as Data, isText: responseIsText)
      }
    }
  }

  func urlSession(
    _: URLSession,
    task _: URLSessionTask,
    willPerformHTTPRedirection response: HTTPURLResponse,
    newRequest request: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void
  ) {
    let redirectRequest: URLRequest
    if let requestId = URLProtocol.property(forKey: EXDevLauncherRequestLoggerProtocol.REQUEST_ID, in: request) as? String {
      // swiftlint:disable force_cast
      let mutableRequest = request as! MutableURLRequest
      // swiftlint:enable force_cast
      URLProtocol.removeProperty(
        forKey: EXDevLauncherRequestLoggerProtocol.REQUEST_ID,
        in: mutableRequest
      )
      URLProtocol.setProperty(
        RedirectResponse(requestId: requestId, redirectResponse: response),
        forKey: EXDevLauncherRequestLoggerProtocol.REDIRECT_RESPONSE,
        in: mutableRequest
      )
      redirectRequest = mutableRequest as URLRequest
    } else {
      redirectRequest = request
    }
    completionHandler(redirectRequest)
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
 `URLRequest.httpBodyData()` extension to read the underlying `httpBodyStream` as Data.
 Only read at maximum `EXDevLauncherRequestLoggerProtocol.MAX_BODY_SIZE` bytes.
 */
extension URLRequest {
  func httpBodyData() -> Data? {
    if let httpBody = self.httpBody {
      return httpBody
    }

    if let contentLength = self.allHTTPHeaderFields?["Content-Length"],
      let contentLengthInt = Int(contentLength),
      contentLengthInt > EXDevLauncherRequestLoggerProtocol.MAX_BODY_SIZE {
      return nil
    }
    guard let stream = self.httpBodyStream else {
      return nil
    }

    let bufferSize: Int = 8192
    let buffer = UnsafeMutablePointer<UInt8>.allocate(capacity: bufferSize)

    stream.open()
    defer {
      buffer.deallocate()
      stream.close()
    }

    var data = Data()
    while stream.hasBytesAvailable {
      let chunkSize = stream.read(buffer, maxLength: bufferSize)
      if data.count + chunkSize > EXDevLauncherRequestLoggerProtocol.MAX_BODY_SIZE {
        return nil
      }
      data.append(buffer, count: chunkSize)
    }

    return data
  }
}
