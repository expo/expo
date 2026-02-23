// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import ExpoFileSystem

/**
 A SharedObject for request.
 */
internal final class NativeRequest: SharedObject, @unchecked Sendable {
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
    self.response.redirectMode = requestInit.redirect
    self.task.start(
      urlSession: urlSession,
      urlSessionDelegate: urlSessionDelegate,
      url: url,
      requestInit: requestInit,
      requestBody: requestBody
    )
  }

  func startWithFile(
    urlSession: URLSession,
    urlSessionDelegate: URLSessionSessionDelegateProxy,
    url: URL,
    requestInit: NativeRequestInit,
    file: FileSystemFile
  ) {
    self.response.redirectMode = requestInit.redirect
    self.task.startWithFile(
      urlSession: urlSession,
      urlSessionDelegate: urlSessionDelegate,
      url: url,
      requestInit: requestInit,
      fileURL: file.url
    )
  }

  func cancel(urlSessionDelegate: URLSessionSessionDelegateProxy) {
    self.task.cancel(urlSessionDelegate: urlSessionDelegate)
    self.response.emitRequestCanceled()
  }
}
