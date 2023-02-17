/**
 A `URLSession` interceptor to log requests and send events to the `EXDevLauncherNetworkLogger`
 */
@objc
class EXDevLauncherRequestLoggerProtocol: URLProtocol, URLSessionDataDelegate {
  private static let REQUEST_ID = "EXDevLauncherRequestLoggerProtocol.requestId"
  private lazy var urlSession = URLSession(
    configuration: URLSessionConfiguration.default,
    delegate: self,
    delegateQueue: nil
  )
  private var dataTask_: URLSessionDataTask!

  // MARK: URLProtocol implementations

  override public class func canInit(with request: URLRequest) -> Bool {
    guard let scheme = request.url?.scheme else { return false }
    if !["http", "https"].contains(scheme) {
      return false
    }
    let isNewRequest = URLProtocol.property(
      forKey: EXDevLauncherRequestLoggerProtocol.REQUEST_ID,
      in: request
    ) == nil
    return isNewRequest
  }

  override public init(
    request: URLRequest,
    cachedResponse: CachedURLResponse?,
    client: URLProtocolClient?
  ) {
    super.init(request: request, cachedResponse: cachedResponse, client: client)
    let mutableRequest = (request as NSURLRequest).mutableCopy() as! NSMutableURLRequest
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

  override public class func canonicalRequest(for request: URLRequest) -> URLRequest {
    request
  }

  override public func startLoading() {
    dataTask_.resume()
  }

  override public func stopLoading() {
    dataTask_.cancel()
  }

  // MARK: URLSessionDataDelegate implementations

  public func urlSession(_: URLSession, dataTask _: URLSessionDataTask, didReceive data: Data) {
    client?.urlProtocol(self, didLoad: data)
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
         forKey: EXDevLauncherRequestLoggerProtocol.REQUEST_ID,
         in: currentRequest
       ) as? String
    {
      EXDevLauncherNetworkLogger.shared.emitNetworkResponse(
        request: request,
        requestId: requestId,
        response: resp
      )
    }
    completionHandler(.allow)
    client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .allowed)
  }

  public func urlSession(_: URLSession, task _: URLSessionTask,
                         didCompleteWithError error: Error?)
  {
    if let error = error {
      client?.urlProtocol(self, didFailWithError: error)
    } else {
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
    let redirectRequest: URLRequest
    if URLProtocol
      .property(forKey: EXDevLauncherRequestLoggerProtocol.REQUEST_ID, in: request) != nil
    {
      let mutableRequest = (request as NSURLRequest).mutableCopy() as! NSMutableURLRequest
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
