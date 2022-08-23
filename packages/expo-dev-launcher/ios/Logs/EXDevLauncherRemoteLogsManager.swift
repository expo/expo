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

  func sendSync() {
    let messageJson = [
      "type": "log",
      "level": "error",
      "mode": "BRIDGE",
      "data": [batch.joined(separator: "\n")]
    ] as [String : Any]
    guard let data = try? JSONSerialization.data(withJSONObject: messageJson, options: []) else {
      batch.removeAll()
      return
    }

    batch.removeAll()

    if #available(iOS 13.0, *) {
      let group = DispatchGroup()
      group.enter()

      let task = URLSession.shared.webSocketTask(with: self.url)
      task.resume()

      guard let dataString = String(data: data, encoding: .utf8) else {
        group.leave()
        return
      }
      let message = URLSessionWebSocketTask.Message.string(dataString)
      task.send(message) { error in
        group.leave()
      }
      _ = group.wait(timeout: DispatchTime.now() + .seconds(2))
    }
  }
}
