/**
 A `URLSession` interceptor to log requests and send events to the `EXDevLauncherNetworkLogger`
 */
@objc
class EXDevLauncherRequestLoggerProtocol: URLProtocol, URLSessionDataDelegate {
  private static let REQUEST_ID = "EXDevLauncherRequestLoggerProtocol.requestId"
  private static let MAX_BODY_SIZE = 1_048_576
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
    let requestId = UUID().uuidString
    URLProtocol.setProperty(
      requestId,
      forKey: EXDevLauncherRequestLoggerProtocol.REQUEST_ID,
      in: mutableRequest
    )
    EXDevLauncherNetworkLogger.shared.emitNetworkWillBeSent(
      request: mutableRequest as URLRequest,
      requestId: requestId
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
    if URLProtocol.property(forKey: EXDevLauncherRequestLoggerProtocol.REQUEST_ID, in: request) != nil {
      // swiftlint:disable force_cast
      let mutableRequest = request as! MutableURLRequest
      // swiftlint:enable force_cast
      URLProtocol.removeProperty(
        forKey: EXDevLauncherRequestLoggerProtocol.REQUEST_ID,
        in: mutableRequest
      )
      redirectRequest = mutableRequest as URLRequest
    } else {
      redirectRequest = request
    }
    completionHandler(redirectRequest)
    client?.urlProtocol(self, wasRedirectedTo: redirectRequest, redirectResponse: response)
  }
}
