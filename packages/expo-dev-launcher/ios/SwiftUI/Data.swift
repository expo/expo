import Network

struct DiscoveryResult: Hashable {
  let name: String?
  let endpoint: NWEndpoint

  var hashValue: Int {
    return endpoint.hashValue
  }

  static func == (lhs: Self, rhs: Self) -> Bool {
    return lhs.name == rhs.name && lhs.endpoint == rhs.endpoint
  }
}

struct BranchWithUpdates {
  let id: String
  let name: String
  let updates: [Update]
  let hasCompatibleUpdates: Bool
}

struct DevServer {
  let url: String
  let description: String
  let source: String
}

struct BuildInfo {
  let appId: String
  let runtimeVersion: String
  let usesEASUpdates: Bool
  let projectUrl: String?
  let sdkVersion: String?

  init(buildInfo: [AnyHashable: Any], updatesConfig: [AnyHashable: Any]) {
    self.appId = (updatesConfig["appId"] as? String) ?? (buildInfo["appId"] as? String) ?? ""
    self.runtimeVersion = (updatesConfig["runtimeVersion"] as? String) ?? (buildInfo["runtimeVersion"] as? String) ?? ""
    self.usesEASUpdates = updatesConfig["usesEASUpdates"] as? Bool ?? false
    self.projectUrl = updatesConfig["projectUrl"] as? String
    self.sdkVersion = buildInfo["sdkVersion"] as? String
  }
}

struct RecentlyOpenedApp: Identifiable {
  let id = UUID().uuidString
  let name: String
  let url: String
  let timestamp: Date
  let isEasUpdate: Bool?
}
