// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 A SharedObject for response.
 */
internal final class NativeResponse: SharedObject, ExpoURLSessionTaskDelegate {
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

  var bodyUsed: Bool {
    return self.sink.bodyUsed
  }

  init(dispatchQueue: DispatchQueue) {
    self.sink = ResponseSink()
    self.dispatchQueue = dispatchQueue
  }

  func startStreaming() {
    if isInvalidState(.responseReceived, .bodyCompleted) {
      return
    }
    if state == .responseReceived {
      state = .bodyStreamingStarted
      let queuedData = self.sink.finalize()
      emit(event: "didReceiveResponseData", arguments: queuedData)
    } else if state == .bodyCompleted {
      let queuedData = self.sink.finalize()
      emit(event: "didReceiveResponseData", arguments: queuedData)
      emit(event: "didComplete")
    }
  }

  func cancelStreaming() {
    if isInvalidState(.bodyStreamingStarted) {
      return
    }
    state = .bodyStreamingCanceled
  }

  func emitRequestCanceled() {
    error = FetchRequestCanceledException()
    state = .errorReceived
  }

  /**
   Waits for given states and when it meets the requirement, executes the callback.
   */
  func waitFor(states: [ResponseState], callback: @escaping (ResponseState) -> Void) {
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
      log.error("Invalid response type")
      return nil
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
      emit(event: "didReceiveResponseData", arguments: data)
    }
    // no-op in .bodyStreamingCanceled state
  }

  func urlSession(_ session: ExpoURLSessionTask, didRedirect response: URLResponse) {
    redirected = true
  }

  func urlSession(_ session: ExpoURLSessionTask, didCompleteWithError error: (any Error)?) {
    if isInvalidState(.started, .responseReceived, .bodyStreamingStarted, .bodyStreamingCanceled) {
      return
    }

    if state == .bodyStreamingStarted {
      if let error {
        emit(event: "didFailWithError", arguments: error.localizedDescription)
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
  }
}
