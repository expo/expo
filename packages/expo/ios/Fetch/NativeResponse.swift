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
    let headers = httpResponse.allHeaderFields.reduce(into: [[String]]()) { result, header in
      if let key = header.key as? String, let value = header.value as? String {
        result.append([key, value])
      }
    }
    let url = httpResponse.url?.absoluteString ?? ""
    return NativeResponseInit(
      headers: headers, status: status, statusText: statusText, url: url
    )
  }

  // MARK: - ExpoURLSessionTaskDelegate implementations

  // URLSession invokes these callbacks on its own serial delegate queue while
  // `startStreaming`/`cancelStreaming` run on `dispatchQueue`. `state` and the
  // sink are unsynchronized, so routing a chunk could race a concurrent state
  // transition: the chunk lands in an already-finalized sink, or `didComplete`
  // overtakes the flushed data and the stream closes empty even though the
  // request succeeded. Hopping every callback onto `dispatchQueue` — where the
  // JS-driven methods already run — serializes the whole state machine on one
  // queue.

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
