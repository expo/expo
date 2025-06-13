struct AppInfo {
  let appName: String
  let appVersion: String
  let runtimeVersion: String?
  let sdkVersion: String?
  let hostUrl: String?
  let appIcon: String?
  let engine: String?
}

struct DevSettings {
  let isElementInspectorAvailable: Bool
  let isHotLoadingAvailable: Bool
  let isPerfMonitorAvailable: Bool
  let isJSInspectorAvailable: Bool
  let isHotLoadingEnabled: Bool
}
