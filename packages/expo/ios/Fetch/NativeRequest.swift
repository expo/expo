// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 A SharedObject for request.
 */
internal final class NativeRequest: SharedObject {
  internal let response: NativeResponse
  internal let task: ExpoURLSessionTask

  init(response: NativeResponse) {
    self.response = response
    self.task = ExpoURLSessionTask(delegate: self.response)
  }

  func start(
    urlSession: URLSession,
    urlSessionDelegate: URLSessionSessionDelegateProxy,
    url: URL,
    requestInit: NativeRequestInit,
    requestBody: Data?
  ) {
    self.task.start(
      urlSession: urlSession,
      urlSessionDelegate: urlSessionDelegate,
      url: url,
      requestInit: requestInit,
      requestBody: requestBody
    )
  }

  func cancel(urlSessionDelegate: URLSessionSessionDelegateProxy) {
    self.task.cancel(urlSessionDelegate: urlSessionDelegate)
    self.response.emitRequestCanceled()
  }
}
