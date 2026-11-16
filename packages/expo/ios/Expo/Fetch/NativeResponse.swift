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
    if state == .bodyCompleted || state == .bodyStreamingCanceled || state == .errorReceived {
      return
    }
    if isInvalidState(.responseReceived, .bodyStreamingStarted) {
      return
    }
    if state == .responseReceived {
      sink.discard()
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

  static func parseHeaders(from httpResponse: HTTPURLResponse) -> [[String]] {
    var result: [[String]] = []
    for (rawKey, rawValue) in httpResponse.allHeaderFields {
      guard let key = rawKey as? String, let value = rawValue as? String else {
        continue
      }
      if key.caseInsensitiveCompare("Set-Cookie") == .orderedSame {
        result.append(contentsOf: splitSetCookieHeader(value).map { [key, $0] })
      } else {
        result.append([key, value])
      }
    }
    return result
  }

  private static func splitSetCookieHeader(_ value: String) -> [String] {
    // URLSession folds repeated headers with commas. A comma in a cookie attribute (notably
    // `Expires`) is not a separator unless the following text starts another cookie pair.
    var result: [String] = []
    var cookieStartIndex = value.startIndex
    var searchIndex = value.startIndex

    while let commaIndex = value[searchIndex...].firstIndex(of: ",") {
      let nextIndex = value.index(after: commaIndex)
      if isCookiePairStart(in: value, at: nextIndex) {
        result.append(
          String(value[cookieStartIndex..<commaIndex]).trimmingCharacters(in: .whitespaces)
        )
        cookieStartIndex = nextIndex
      }
      searchIndex = nextIndex
    }

    result.append(String(value[cookieStartIndex...]).trimmingCharacters(in: .whitespaces))
    return result
  }

  private static func isCookiePairStart(in value: String, at startIndex: String.Index) -> Bool {
    let remainder = value[startIndex...]
    guard let equalsIndex = remainder.firstIndex(of: "=") else {
      return false
    }
    if let delimiterIndex = remainder.firstIndex(where: { $0 == ";" || $0 == "," }),
      delimiterIndex < equalsIndex {
      return false
    }

    let name = String(value[startIndex..<equalsIndex]).trimmingCharacters(in: .whitespaces)
    let separators = CharacterSet(charactersIn: "()<>@,;:\\\"/[]?={} \t")
    return !name.isEmpty && name.unicodeScalars.allSatisfy {
      $0.value >= 0x21 && $0.value <= 0x7e && !separators.contains($0)
    }
  }

  // MARK: - ExpoURLSessionTaskDelegate implementations

  // URLSession runs these callbacks on its own queue, racing `state` / sink access on `dispatchQueue`.
  // Hop every callback onto `dispatchQueue` to serialize the whole state machine on one queue.

  func urlSessionDidStart(_ session: ExpoURLSessionTask) {
    dispatchQueue.async { [weak self] in
      guard let self else {
        return
      }
      if self.isInvalidState(.intialized) {
        return
      }
      self.state = .started
    }
  }

  func urlSession(_ session: ExpoURLSessionTask, didReceive response: URLResponse) {
    dispatchQueue.async { [weak self] in
      guard let self else {
        return
      }
      if self.isInvalidState(.started) {
        return
      }
      self.responseInit = Self.createResponseInit(response: response)
      self.state = .responseReceived
    }
  }

  func urlSession(_ session: ExpoURLSessionTask, didReceive data: Data) {
    dispatchQueue.async { [weak self] in
      guard let self else {
        return
      }
      if self.isInvalidState(.responseReceived, .bodyStreamingStarted, .bodyStreamingCanceled) {
        return
      }

      if self.state == .responseReceived {
        self.sink.appendBufferBody(data: data)
      } else if self.state == .bodyStreamingStarted {
        self.emit(event: "didReceiveResponseData", payload: data)
      }
      // no-op in .bodyStreamingCanceled state
    }
  }

  func urlSession(
    _ session: ExpoURLSessionTask,
    task: URLSessionTask,
    willPerformHTTPRedirection response: HTTPURLResponse,
    newRequest request: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void
  ) {
    dispatchQueue.async { [weak self] in
      guard let self else {
        completionHandler(nil)
        return
      }
      let shouldFollowRedirects = self.redirectMode == .follow
      completionHandler(shouldFollowRedirects ? request : nil)
      self.redirected = shouldFollowRedirects

      if self.redirectMode == .error {
        let error = FetchRedirectException()
        self.error = error
        if self.state == .bodyStreamingStarted {
          self.emit(event: "didFailWithError", payload: error.localizedDescription)
        }
        self.state = .errorReceived
        self.emit(event: "readyForJSFinalization")
      }
    }
  }

  func urlSession(_ session: ExpoURLSessionTask, task: URLSessionTask, didCompleteWithError error: (any Error)?) {
    dispatchQueue.async { [weak self] in
      guard let self else {
        return
      }
      self.handleDidCompleteWithError(session: session, task: task, error: error)
    }
  }

  private func handleDidCompleteWithError(session: ExpoURLSessionTask, task: URLSessionTask, error: (any Error)?) {
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
        self.handleDidCompleteWithError(session: session, task: task, error: error)
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
