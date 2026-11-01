import Foundation

#if DEBUG
enum ExpoBundleResolver {
  static func isMatchingMetro(_ server: URL, projectRoot: String) async -> Bool {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.timeoutIntervalForRequest = 1
    configuration.timeoutIntervalForResource = 1
    let session = URLSession(configuration: configuration)
    defer { session.invalidateAndCancel() }
    do {
      let (data, response) = try await session.data(from: server.appendingPathComponent("status"))
      guard let response = response as? HTTPURLResponse, response.statusCode == 200 else {
        return false
      }
      let serverRoot = response.value(forHTTPHeaderField: "X-React-Native-Project-Root")?.removingPercentEncoding
      return String(data: data, encoding: .utf8) == "packager-status:running" && serverRoot == projectRoot
    } catch {
      return false
    }
  }
}
#endif
