// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 A SharedObject for response.
 */
internal final class NativeResponse: SharedObject, ExpoURLSessionTaskDelegate, @unchecked Sendable {
  internal let sink: ResponseSink

  private let dispatchQueue: DispatchQueue

  private(set) var state: ResponseState = .intialized {
    didSet {
      dispatchQueue.async { [weak self] in
        guard let self else {
          return
        }
        self.stateChangeOnceListeners.removeAll { $0(self.state) == true }
      }
    }
  }
  private typealias StateChangeListener = (ResponseState) -> Bool
  private var stateChangeOnceListeners: [StateChangeListener] = []

  private(set) var responseInit: NativeResponseInit?
  private(set) var redirected = false
  private(set) var error: Error?
  var redirectMode: NativeRequestRedirect = .follow

  var bodyUsed: Bool {
    return self.sink.bodyUsed
  }

  init(dispatchQueue: DispatchQueue) {
    self.sink = ResponseSink()
    self.dispatchQueue = dispatchQueue
  }

  func startStreaming() -> Data? {
    if isInvalidState(.responseReceived, .bodyCompleted) {
      return nil
    }
    if state == .responseReceived {
      state = .bodyStreamingStarted
      let queuedData = self.sink.finalize()
      emit(event: "didReceiveResponseData", payload: queuedData)
    } else if state == .bodyCompleted {
      let queuedData = self.sink.finalize()
      return queuedData
    }
    return nil
  }

  func cancelStreaming() {
    if isInvalidState(.bodyStreamingStarted) {
      return
    }
    state = .bodyStreamingCanceled
  }

  func emitRequestCanceled() {
    let error = FetchRequestCanceledException()
    self.error = error
    if state == .bodyStreamingStarted {
      emit(event: "didFailWithError", payload: error.localizedDescription)
    }
    state = .errorReceived
    emit(event: "readyForJSFinalization")
  }

  /**
   Waits for given states and when it meets the requirement, executes the callback.
   */
  func waitFor(states: [ResponseState], callback: @escaping @Sendable (ResponseState) -> Void) {
    if states.contains(state) {
      callback(state)
      return
    }
    dispatchQueue.async { [weak self] () in
      guard let self else {
        return
      }
      self.stateChangeOnceListeners.append { newState in
        if states.contains(newState) {
          callback(newState)
          return true
        }
        return false
      }
    }
  }

  /**
   Check valid state machine
   */
  private func isInvalidState(_ validStates: ResponseState...) -> Bool {
    if validStates.contains(state) {
      return false
    }

    let validStatesString = validStates.map { "\($0.rawValue)" }.joined(separator: ",")
    log.error("Invalid state - currentState[\(state.rawValue)] validStates[\(validStatesString)]")
    return true
  }

  /**
   Factory of NativeResponseInit
   */
  private static func createResponseInit(response: URLResponse) -> NativeResponseInit? {
    guard let httpResponse = response as? HTTPURLResponse else {
      return NativeResponseInit(
        headers: [], status: 200, statusText: "", url: response.url?.absoluteString ?? ""
      )
    }

    let status = httpResponse.statusCode
    let statusText = HTTPURLResponse.localizedString(forStatusCode: status)
    let headers = parseHeaders(from: httpResponse)
    let url = httpResponse.url?.absoluteString ?? ""
    return NativeResponseInit(
      headers: headers, status: status, statusText: statusText, url: url
    )
  }

  private static func parseHeaders(from httpResponse: HTTPURLResponse) -> [[String]] {
    var result: [[String]] = []
    for (rawKey, rawValue) in httpResponse.allHeaderFields {
      guard let key = rawKey as? String, let value = rawValue as? String else {
        continue
      }
      if key.caseInsensitiveCompare("Set-Cookie") == .orderedSame, let url = httpResponse.url {
        let cookies = HTTPCookie.cookies(withResponseHeaderFields: [key: value], for: url)
        if cookies.isEmpty {
          result.append([key, value])
        } else {
          for cookie in cookies {
            result.append([key, Self.reconstructSetCookieHeader(from: cookie)])
          }
        }
      } else {
        result.append([key, value])
      }
    }
    return result
  }

  /**
   Reconstructs a `Set-Cookie` header value from a parsed `HTTPCookie`.
   */
  private static func reconstructSetCookieHeader(from cookie: HTTPCookie) -> String {
    var components: [String] = ["\(cookie.name)=\(cookie.value)"]
    if !cookie.path.isEmpty {
      components.append("Path=\(cookie.path)")
    }
    if !cookie.domain.isEmpty {
      components.append("Domain=\(cookie.domain)")
    }
    if !cookie.isSessionOnly, let expiresDate = cookie.expiresDate {
      components.append("Expires=\(Self.cookieDateFormatter.string(from: expiresDate))")
    }
    if cookie.isSecure {
      components.append("Secure")
    }
    if cookie.isHTTPOnly {
      components.append("HttpOnly")
    }
    if let sameSite = cookie.sameSitePolicy?.rawValue {
      components.append("SameSite=\(sameSite)")
    }
    return components.joined(separator: "; ")
  }

  private static let cookieDateFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(identifier: "GMT")
    formatter.dateFormat = "EEE, dd MMM yyyy HH:mm:ss 'GMT'"
    return formatter
  }()

  // MARK: - ExpoURLSessionTaskDelegate implementations

  func urlSessionDidStart(_ session: ExpoURLSessionTask) {
    if isInvalidState(.intialized) {
      return
    }
    state = .started
  }

  func urlSession(_ session: ExpoURLSessionTask, didReceive response: URLResponse) {
    if isInvalidState(.started) {
      return
    }
    responseInit = Self.createResponseInit(response: response)
    state = .responseReceived
  }

  func urlSession(_ session: ExpoURLSessionTask, didReceive data: Data) {
    if isInvalidState(.responseReceived, .bodyStreamingStarted, .bodyStreamingCanceled) {
      return
    }

    if state == .responseReceived {
      self.sink.appendBufferBody(data: data)
    } else if state == .bodyStreamingStarted {
      emit(event: "didReceiveResponseData", payload: data)
    }
    // no-op in .bodyStreamingCanceled state
  }

  func urlSession(
    _ session: ExpoURLSessionTask,
    task: URLSessionTask,
    willPerformHTTPRedirection response: HTTPURLResponse,
    newRequest request: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void
  ) {
    let shouldFollowRedirects = self.redirectMode == .follow
    completionHandler(shouldFollowRedirects ? request : nil)
    self.redirected = shouldFollowRedirects

    if self.redirectMode == .error {
      let error = FetchRedirectException()
      self.error = error
      if state == .bodyStreamingStarted {
        emit(event: "didFailWithError", payload: error.localizedDescription)
      }
      state = .errorReceived
      emit(event: "readyForJSFinalization")
    }
  }

  func urlSession(_ session: ExpoURLSessionTask, task: URLSessionTask, didCompleteWithError error: (any Error)?) {
    if isInvalidState(.started, .responseReceived, .bodyStreamingStarted, .bodyStreamingCanceled) {
      return
    }

    if state == .started,
      let urlError = error as? URLError,
      urlError.code.rawValue == CFNetworkErrors.cfurlErrorFileDoesNotExist.rawValue,
      let url = task.currentRequest?.url,
      url.scheme == "file" {
      // When requesting a local file that does not exist,
      // the `urlSession(_:didReceive:)` method will not be called.
      // Instead of throwing an exception, we generate a 404 response.
      responseInit = NativeResponseInit(
        headers: [], status: 404, statusText: "File not found", url: url.absoluteString)

      // First, set the state to .responseReceived, and then to .errorReceived in the next loop.
      // This simulates the state transition similar to HTTP requests.
      state = .responseReceived
      dispatchQueue.async { [weak self] in
        guard let self else {
          return
        }
        self.urlSession(session, task: task, didCompleteWithError: error)
      }
      return
    }

    if state == .bodyStreamingStarted {
      if let error {
        emit(event: "didFailWithError", payload: error.localizedDescription)
      } else {
        emit(event: "didComplete")
      }
    }

    if let error {
      self.error = error
      state = .errorReceived
    } else {
      state = .bodyCompleted
    }

    emit(event: "readyForJSFinalization")
  }
}
