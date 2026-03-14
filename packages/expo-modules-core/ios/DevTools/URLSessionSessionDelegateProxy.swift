// Copyright 2015-present 650 Industries. All rights reserved.

/**
 Protocol for handling authentication challenges from URLSession.
 Native modules can implement this to provide credentials for challenges
 like client certificate authentication (mTLS).
 */
public protocol URLSessionAuthenticationChallengeDelegate: AnyObject {
  func credential(for challenge: URLAuthenticationChallenge) -> URLCredential?
}

/**
 Shared URLSessionDelegate instance and delete calls back to ExpoRequestInterceptorProtocol instances.
 */
public final class URLSessionSessionDelegateProxy: NSObject, URLSessionDataDelegate {
  private let dispatchQueue: DispatchQueue
  private var delegateMap: [AnyHashable: URLSessionDataDelegate] = [:]

  public weak var authenticationChallengeDelegate: URLSessionAuthenticationChallengeDelegate?

  public init(dispatchQueue: DispatchQueue) {
    self.dispatchQueue = dispatchQueue
    super.init()
  }

  public func addDelegate(task: URLSessionTask, delegate: URLSessionDataDelegate) {
    self.dispatchQueue.async {
      self.delegateMap[task] = delegate
    }
  }

  public func removeDelegate(task: URLSessionTask) {
    self.dispatchQueue.async {
      self.delegateMap.removeValue(forKey: task)
    }
  }

  public func getDelegate(task: URLSessionTask) -> URLSessionDataDelegate? {
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
    // 1. Check per-task delegate first
    if let delegate = getDelegate(task: task),
      delegate.responds(to: #selector(URLSessionTaskDelegate.urlSession(_:task:didReceive:completionHandler:))) {
      delegate.urlSession?(
        session,
        task: task,
        didReceive: challenge,
        completionHandler: completionHandler)
      return
    }

    // 2. Check authentication challenge delegate
    if let credential = authenticationChallengeDelegate?.credential(for: challenge) {
      completionHandler(.useCredential, credential)
      return
    }

    // 3. Check URLCredentialStorage for stored credentials
    if let credential = URLCredentialStorage.shared.defaultCredential(for: challenge.protectionSpace) {
      completionHandler(.useCredential, credential)
      return
    }

    // 4. Fall back to default handling
    completionHandler(.performDefaultHandling, nil)
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
