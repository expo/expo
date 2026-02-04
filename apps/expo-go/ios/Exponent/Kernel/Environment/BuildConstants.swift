// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc(EXBuildConstants)
@objcMembers
public final class BuildConstants: NSObject {
  public static let sharedInstance = BuildConstants()

  public private(set) var apiServerEndpoint: URL?
  public var sdkVersion: String?
  public var expoRuntimeVersion: String = ""
  public var useEmbeddedSnackRuntime: Bool = false

  private override init() {
    super.init()
    loadConfig()
  }

  private func loadConfig() {
    guard let plistPath = Bundle.main.path(forResource: "EXBuildConstants", ofType: "plist"),
          let config = NSDictionary(contentsOfFile: plistPath) as? [String: Any] else {
      return
    }

    if let apiServerString = config["API_SERVER_ENDPOINT"] as? String {
      apiServerEndpoint = URL(string: apiServerString)
    }

    sdkVersion = config["TEMPORARY_SDK_VERSION"] as? String

    if let runtimeVersion = config["EXPO_RUNTIME_VERSION"] as? String {
      expoRuntimeVersion = runtimeVersion
    }

    useEmbeddedSnackRuntime = config["USE_EMBEDDED_SNACK_RUNTIME"] as? Bool ?? false
  }
}
