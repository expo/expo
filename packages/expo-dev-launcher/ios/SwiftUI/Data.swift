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
  
  init(buildInfo: [AnyHashable: Any], updatesConfig: [AnyHashable: Any]) {
    // Get appId and runtimeVersion from either source
    self.appId = (updatesConfig["appId"] as? String) ?? (buildInfo["appId"] as? String) ?? ""
    self.runtimeVersion = (updatesConfig["runtimeVersion"] as? String) ?? (buildInfo["runtimeVersion"] as? String) ?? ""
    
    // usesEASUpdates comes from updatesConfig
    self.usesEASUpdates = updatesConfig["usesEASUpdates"] as? Bool ?? false
    self.projectUrl = updatesConfig["projectUrl"] as? String
  }
}
