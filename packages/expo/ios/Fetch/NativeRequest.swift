// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 A SharedRef for request.
 */
internal final class NativeRequest: SharedRef<ExpoURLSessionTask> {
  internal let response: NativeResponse

  init(response: NativeResponse) {
    self.response = response
    super.init(ExpoURLSessionTask(delegate: self.response))
  }

  func start(
    urlSession: URLSession,
    urlSessionDelegate: URLSessionSessionDelegateProxy,
    url: URL,
    requestInit: NativeRequestInit,
    requestBody: Data?
  ) {
    self.ref.start(
      urlSession: urlSession,
      urlSessionDelegate: urlSessionDelegate,
      url: url,
      requestInit: requestInit,
      requestBody: requestBody
    )
  }

  func cancel(urlSessionDelegate: URLSessionSessionDelegateProxy) {
    self.ref.cancel(urlSessionDelegate: urlSessionDelegate)
    self.response.emitRequestCanceled()
  }
}

/**
 Enum for RequestInit.credentials.
 */
internal enum NativeRequestCredentials: String, Enumerable {
  case include
  case omit
}

/**
 Record for RequestInit.
 */
internal struct NativeRequestInit: Record {
  @Field
  var credentials: NativeRequestCredentials = .include

  @Field
  var headers: [[String]] = []

  @Field
  var method: String = "GET"
}
