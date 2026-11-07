// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 An URLSessionDataTask wrapper.
 */
internal final class ExpoURLSessionTask: NSObject, URLSessionTaskDelegate, URLSessionDataDelegate, @unchecked Sendable {
  private let delegate: ExpoURLSessionTaskDelegate
  private var task: URLSessionDataTask?
  private var networkReporter: ExpoNetworkReporter?

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
    let request = NSMutableURLRequest(url: url)
    URLProtocol.setProperty(requestInit.redirect == .follow, forKey: "shouldFollowRedirects", in: request)
    request.httpMethod = requestInit.method
    request.timeoutInterval = 0
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

    if url.scheme == "http" || url.scheme == "https" {
      let networkReporter = ExpoNetworkReporter(devToolsRequestId: requestInit.devToolsRequestId)
      networkReporter.mark(request)
      self.networkReporter = networkReporter
    }

    let task = urlSession.dataTask(with: request as URLRequest)
    urlSessionDelegate.addDelegate(task: task, delegate: self)
    self.task = task
    networkReporter?.willSendRequest(request as URLRequest)
    task.resume()
    self.delegate.urlSessionDidStart(self)
  }

  func cancel(urlSessionDelegate: URLSessionSessionDelegateProxy) {
    if let task {
      urlSessionDelegate.removeDelegate(task: task)
      task.cancel()
      networkReporter?.didFailLoading(cancelled: true)
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
    self.delegate.urlSession(
      self,
      task: task,
      willPerformHTTPRedirection: response,
      newRequest: request,
      completionHandler: completionHandler)
  }

  func urlSession(
    _ session: URLSession,
    dataTask: URLSessionDataTask,
    didReceive response: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    networkReporter?.didReceiveResponse(response)
    self.delegate.urlSession(self, didReceive: response)
    completionHandler(.allow)
  }

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
    networkReporter?.didReceiveData(data)
    self.delegate.urlSession(self, didReceive: data)
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    if let error {
      networkReporter?.didFailLoading(cancelled: (error as? URLError)?.code == .cancelled)
    } else {
      networkReporter?.didFinishLoading(encodedDataLength: Int(task.countOfBytesReceived))
    }
    self.delegate.urlSession(self, task: task, didCompleteWithError: error)
  }
}

internal protocol ExpoURLSessionTaskDelegate: AnyObject, Sendable {
  func urlSessionDidStart(_ session: ExpoURLSessionTask)
  func urlSession(_ session: ExpoURLSessionTask, didReceive response: URLResponse)
  func urlSession(_ session: ExpoURLSessionTask, didReceive data: Data)
  func urlSession(
    _ session: ExpoURLSessionTask,
    task: URLSessionTask,
    willPerformHTTPRedirection response: HTTPURLResponse,
    newRequest request: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void
  )
  func urlSession(_ session: ExpoURLSessionTask, task: URLSessionTask, didCompleteWithError error: Error?)
}
