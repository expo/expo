import Foundation

struct DevServer: Identifiable {
  let id = UUID().uuidString
  let url: String
  let description: String
  let source: String
}

extension DevServer {
  static let mock = DevServer(
    url: "http://localhost:8081",
    description: "Metro bundler",
    source: "local"
  )
  
  static let mockList = [
    DevServer(url: "http://localhost:8081", description: "Metro bundler", source: "local"),
    DevServer(url: "http://localhost:19000", description: "Expo CLI", source: "local"),
    DevServer(url: "http://localhost:19001", description: "Expo Dev Server", source: "local")
  ]
}
