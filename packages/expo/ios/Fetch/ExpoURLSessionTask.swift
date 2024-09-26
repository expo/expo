// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 An URLSessionDataTask wrapper.
 */
internal final class ExpoURLSessionTask: NSObject, URLSessionTaskDelegate, URLSessionDataDelegate {
  private let delegate: ExpoURLSessionTaskDelegate
  private var task: URLSessionDataTask?

  init(delegate: ExpoURLSessionTaskDelegate) {
    self.delegate = delegate
    super.init()
  }

  func start(
    urlSession: URLSession,
    urlSessionDelegate: URLSessionSessionDelegateProxy,
    url: URL,
    requestInit: NativeRequestInit,
    requestBody: Data?
  ) {
    var request = URLRequest(url: url)
    request.httpMethod = requestInit.method
    if requestInit.credentials == .include {
      request.httpShouldHandleCookies = true
      if let cookies = HTTPCookieStorage.shared.cookies(for: url) {
        request.allHTTPHeaderFields = HTTPCookie.requestHeaderFields(with: cookies)
      }
    } else {
      request.httpShouldHandleCookies = false
    }
    for tuple in requestInit.headers {
      request.addValue(tuple[1], forHTTPHeaderField: tuple[0])
    }
    request.httpBody = requestBody

    let task = urlSession.dataTask(with: request)
    urlSessionDelegate.addDelegate(task: task, delegate: self)
    self.task = task
    task.resume()
    self.delegate.urlSessionDidStart(self)
  }

  func cancel(urlSessionDelegate: URLSessionSessionDelegateProxy) {
    if let task {
      urlSessionDelegate.removeDelegate(task: task)
      task.cancel()
    }
  }

  // MARK: - URLSessionTaskDelegate/URLSessionDataDelegate implementations

  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    willPerformHTTPRedirection response: HTTPURLResponse,
    newRequest request: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void
  ) {
    self.delegate.urlSession(self, didRedirect: response)
    completionHandler(request)
  }

  func urlSession(
    _ session: URLSession,
    dataTask: URLSessionDataTask,
    didReceive response: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    self.delegate.urlSession(self, didReceive: response)
    completionHandler(.allow)
  }

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
    self.delegate.urlSession(self, didReceive: data)
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    self.delegate.urlSession(self, task: task, didCompleteWithError: error)
  }
}

internal protocol ExpoURLSessionTaskDelegate: AnyObject {
  func urlSessionDidStart(_ session: ExpoURLSessionTask)
  func urlSession(_ session: ExpoURLSessionTask, didReceive response: URLResponse)
  func urlSession(_ session: ExpoURLSessionTask, didReceive data: Data)
  func urlSession(_ session: ExpoURLSessionTask, didRedirect response: URLResponse)
  func urlSession(_ session: ExpoURLSessionTask, task: URLSessionTask, didCompleteWithError error: Error?)
}
