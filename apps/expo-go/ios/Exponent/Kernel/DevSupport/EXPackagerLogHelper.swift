// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import React

@objc enum EXPackagerLogLevel: Int {
  case info
  case warn
  case error

  var stringValue: String {
    switch self {
    case .info:
      return "info"
    case .warn:
      return "warn"
    case .error:
      return "error"
    }
  }
}

@objc class EXPackagerLogHelper: NSObject, SRWebSocketDelegate {
  private var connected: Bool = false
  private var socket: SRWebSocket?
  private var bundleURL: URL
  private var pendingMessage: String?
  private var logLevel: EXPackagerLogLevel
  private let operationQueue = OperationQueue()
  private var onComplete: (() -> Void)?

  @objc init(bundleURL: URL, level: EXPackagerLogLevel) {
    self.bundleURL = bundleURL
    self.logLevel = level
    self.operationQueue.qualityOfService = .utility
  }

  deinit {
    socket?.close()
    self.socket = nil
    connected = false
  }

  @objc func sendMessage(_ message: String, withCompletion completion: @escaping () -> Void) {
    pendingMessage = message
    onComplete = completion
    if !connected {
      createSocket()
    } else {
      sendPendingMessage()
    }
  }

  @objc static func logInfo(_ message: String, withBundleUrl url: URL) {
    log(message, withBundleUrl: url, level: .info)
  }

  @objc static func logWarning(_ message: String, withBundleUrl url: URL) {
    log(message, withBundleUrl: url, level: .warn)
  }

  @objc static func logError(_ message: String, withBundleUrl url: URL) {
    log(message, withBundleUrl: url, level: .error)
  }

  @objc static func log(_ message: String, withBundleUrl url: URL, level: EXPackagerLogLevel) {
    var strongHelper: EXPackagerLogHelper? = EXPackagerLogHelper(bundleURL: url, level: level)
    strongHelper?.sendMessage(message) {
      strongHelper = nil
    }
  }

  func webSocketDidOpen(_ webSocket: SRWebSocket) {
    connected = true
    sendPendingMessage()
  }

  func webSocket(_ webSocket: SRWebSocket, didFailWithError error: Error) {
    // Ignored
  }

  func webSocket(_ webSocket: SRWebSocket, didCloseWithCode code: Int, reason: String?, wasClean: Bool) {
    socket = nil
    connected = false
  }

  private func sendPendingMessage() {
    guard let message = pendingMessage else {
      return
    }

    guard let socket = socket else {
      return
    }

    let payload: [String: Any] = [
      "type": "log",
      "level": logLevel.stringValue,
      "data": [message]
    ]

    pendingMessage = nil

    do {
      let jsonData = try JSONSerialization.data(withJSONObject: payload)
      if let jsonString = String(data: jsonData, encoding: .utf8) {
        try socket.send(string: jsonString)
      }
    } catch {
      // Swallow errors
    }

    socket.close()
    self.socket = nil
    connected = false

    if let onComplete = onComplete {
      onComplete()
      self.onComplete = nil
    }
  }

  private func createSocket() {
    let serverHost = bundleURL.host ?? "localhost"
    let serverPort = bundleURL.port ?? Int(kRCTBundleURLProviderDefaultPort)
    let scheme = (bundleURL.scheme == "exps" || bundleURL.scheme == "https") ? "https" : "http"

    var components = URLComponents()
    components.host = serverHost
    components.scheme = scheme
    components.port = serverPort
    components.path = "/hot"

    if let url = components.url {
      socket = SRWebSocket(url: url)
    } else {
      return
    }

    socket?.delegate = self
    socket?.delegateDispatchQueue = operationQueue.underlyingQueue
    socket?.open()
  }
}
