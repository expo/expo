import Foundation

class EXDevLauncherRemoteLogsManager {
  private var batch: [[String: Any]] = []
  private let url: URL
  
  init(withUrl url: URL) {
    self.url = url
  }
  
  func deferError(exception: NSException) {
    batch.append([
      "level": "error",
      "body": [
        "message": exception.description,
        "stack": exception.callStackSymbols.joined(separator: "\n")
      ],
      "includesStack": true
    ])
  }
  
  func deferError(message: String) {
    batch.append([
      "level": "error",
      "body": message,
      "includesStack": false
    ])
  }
  
  func sendSync() {
    guard let data = try? JSONSerialization.data(withJSONObject: batch, options: []) else {
      batch.removeAll()
      return
    }
    
    batch.removeAll()
    
    var request = URLRequest.init(url: self.url)
    request.httpMethod = "POST"
    request.httpBody = data
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue(UIDevice.current.identifierForVendor?.uuidString ?? UIDevice.current.name , forHTTPHeaderField: "Device-Id")
    request.setValue(UIDevice.current.name, forHTTPHeaderField: "Device-Name")
    
    let group = DispatchGroup()
    group.enter()
    URLSession.shared.dataTask(with: request) { data, response, error in
      group.leave()
    }.resume()
    group.wait(timeout: DispatchTime.now() + .seconds(2))
  }
}
