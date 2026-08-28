// Copyright 2015-present 650 Industries. All rights reserved.

/**
 Shared URLSessionDelegate instance and delegates calls back to ExpoRequestInterceptorProtocol instances.
 */
public final class URLSessionSessionDelegateProxy: NSObject, URLSessionDataDelegate {
  private let dispatchQueue: DispatchQueue
  private var delegateMap: [AnyHashable: URLSessionDataDelegate] = [:]

  public init(dispatchQueue: DispatchQueue) {
    self.dispatchQueue = dispatchQueue
    super.init()
  }

  /**
   `URLSession`'s `nonnull`-audited factories can still return a null task, and bridging one into
   an `AnyHashable` key aborts. Only a raw-pointer compare survives optimization.
   */
  private static func isNonNull(_ task: URLSessionTask) -> Bool {
    return unsafeBitCast(task, to: UnsafeRawPointer?.self) != nil
  }

  public func addDelegate(task: URLSessionTask, delegate: URLSessionDataDelegate) {
    guard Self.isNonNull(task) else {
      return
    }
    self.dispatchQueue.async {
      self.delegateMap[task] = delegate
    }
  }

  public func removeDelegate(task: URLSessionTask) {
    guard Self.isNonNull(task) else {
      return
    }
    self.dispatchQueue.async {
      self.delegateMap.removeValue(forKey: task)
    }
  }

  public func getDelegate(task: URLSessionTask) -> URLSessionDataDelegate? {
    guard Self.isNonNull(task) else {
      return nil
    }
    return self.dispatchQueue.sync {
      return self.delegateMap[task]
    }
  }

  // MARK: - URLSessionDataDelegate implementations

  public func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive: Data) {
    if let delegate = getDelegate(task: dataTask) {
      delegate.urlSession?(
        session,
        dataTask: dataTask,
        didReceive: didReceive)
    }
  }

  public func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError: Error?) {
    if let delegate = getDelegate(task: task) {
      delegate.urlSession?(
        session,
        task: task,
        didCompleteWithError: didCompleteWithError)
    }
    self.removeDelegate(task: task)
  }

  public func urlSession(
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

  public func urlSession(
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

  public func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    didReceive challenge: URLAuthenticationChallenge,
    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
  ) {
    if let delegate = getDelegate(task: task),
      delegate.responds(to: #selector(URLSessionTaskDelegate.urlSession(_:task:didReceive:completionHandler:))) {
      delegate.urlSession?(
        session,
        task: task,
        didReceive: challenge,
        completionHandler: completionHandler)
    } else {
      completionHandler(.performDefaultHandling, nil)
    }
  }

  public func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    didSendBodyData bytesSent: Int64,
    totalBytesSent: Int64,
    totalBytesExpectedToSend: Int64
  ) {
    if let delegate = getDelegate(task: task) {
      delegate.urlSession?(
        session,
        task: task,
        didSendBodyData: bytesSent,
        totalBytesSent: totalBytesSent,
        totalBytesExpectedToSend: totalBytesExpectedToSend)
    }
  }
}
