import Foundation

class EXDevLauncherRemoteLogsManager {
  private var batch: [String] = []
  private let url: URL

  init(withUrl url: URL) {
    self.url = url
  }

  func deferError(exception: NSException) {
    batch.append("\(exception.name.rawValue): \(exception.reason ?? exception.description)")
    batch.append("  \(exception.callStackSymbols.joined(separator: "\n  "))")
  }

  func deferError(message: String) {
    batch.append(message)
  }

  static func reportError(_ message: String, toServerAt serverUrl: URL) {
    guard let url = webSocketUrl(forServerUrl: serverUrl) else {
      return
    }
    // `sendSync` blocks for up to 2 seconds when the dev server is unreachable.
    DispatchQueue.global(qos: .utility).async {
      let logsManager = EXDevLauncherRemoteLogsManager(withUrl: url)
      logsManager.deferError(message: message)
      logsManager.sendSync()
    }
  }

  static func webSocketUrl(forServerUrl serverUrl: URL) -> URL? {
    // URL structure replicates
    // https://github.com/facebook/react-native/blob/0.69-stable/Libraries/Utilities/HMRClient.js#L164
    // but URLSessionWebSocketTask will crash if the scheme is not `ws` or `wss`
    guard let host = serverUrl.host, host != "u.expo.dev" else {
      return nil
    }
    guard let socketUrl = URL(string: "hot", relativeTo: serverUrl),
      var components = URLComponents(url: socketUrl, resolvingAgainstBaseURL: true) else {
      return nil
    }
    components.scheme = serverUrl.scheme == "https" ? "wss" : "ws"
    return components.url
  }

  static func payload(message: String) -> [String: Any] {
    // message format comes from
    // https://github.com/facebook/react-native/blob/0.69-stable/Libraries/Utilities/HMRClient.js#L119-L134
    return [
      "type": "log",
      "level": "error",
      "mode": "ios",
      "data": [message]
    ]
  }

  func sendSync() {
    // `data` is an array whose members are simply concatenated with a space before printing to
    // the console, so we join messages with a newline and send an array consisting of just a
    // single item.
    let messageJson = Self.payload(message: batch.joined(separator: "\n"))
    guard let data = try? JSONSerialization.data(withJSONObject: messageJson, options: []) else {
      batch.removeAll()
      return
    }

    batch.removeAll()

    let group = DispatchGroup()
    group.enter()

    let task = URLSession.shared.webSocketTask(with: self.url)
    task.resume()

    guard let dataString = String(data: data, encoding: .utf8) else {
      group.leave()
      return
    }
    let message = URLSessionWebSocketTask.Message.string(dataString)
    task.send(message) { _ in
      group.leave()
    }
    _ = group.wait(timeout: DispatchTime.now() + .seconds(2))
  }
}
