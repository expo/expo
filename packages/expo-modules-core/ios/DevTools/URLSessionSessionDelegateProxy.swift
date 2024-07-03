// Copyright 2015-present 650 Industries. All rights reserved.

/**
 Shared URLSessionDelegate instance and delete calls back to ExpoRequestInterceptorProtocol instances.
 */
internal final class URLSessionSessionDelegateProxy: NSObject, URLSessionDataDelegate {
  private let dispatchQueue: DispatchQueue
  private var delegateMap: [AnyHashable: URLSessionDataDelegate] = [:]

  init(dispatchQueue: DispatchQueue) {
    self.dispatchQueue = dispatchQueue
    super.init()
  }

  func addDelegate(task: URLSessionTask, delegate: URLSessionDataDelegate) {
    self.dispatchQueue.async {
      self.delegateMap[task] = delegate
    }
  }

  func removeDelegate(task: URLSessionTask) {
    self.dispatchQueue.async {
      self.delegateMap.removeValue(forKey: task)
    }
  }

  func getDelegate(task: URLSessionTask) -> URLSessionDataDelegate? {
    return self.dispatchQueue.sync {
      return self.delegateMap[task]
    }
  }

  // MARK: - URLSessionDataDelegate implementations

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive: Data) {
    if let delegate = getDelegate(task: dataTask) {
      delegate.urlSession?(
        session,
        dataTask: dataTask,
        didReceive: didReceive)
    }
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError: Error?) {
    if let delegate = getDelegate(task: task) {
      delegate.urlSession?(
        session,
        task: task,
        didCompleteWithError: didCompleteWithError)
    }
    self.removeDelegate(task: task)
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
}
