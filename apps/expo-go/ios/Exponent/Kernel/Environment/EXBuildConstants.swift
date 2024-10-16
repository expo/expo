// Copyright 2015-present 650 Industries. All rights reserved.

@objc(EXKernelDevManifestSource)
enum KernelDevManifestSource: Int {
  case none
  case local
  case published
}

@objc(EXBuildConstants)
@objcMembers
public class BuildConstants: NSObject {
  static let sharedInstance = BuildConstants()

  private(set) var isDevKernel: Bool = false
  private(set) var defaultApiKeys: [String: Any] = [:]
  private(set) var kernelDevManifestSource: KernelDevManifestSource = .none
  private(set) var kernelManifestAndAssetRequestHeadersJsonString: String = ""
  private(set) var apiServerEndpoint: URL?
  var sdkVersion: String = ""
  var expoRuntimeVersion: String = ""

  private override init() {
    super.init()
    loadConfig()
  }

  // MARK: - Internal

  private func reset() {
    expoRuntimeVersion = ""
  }

  private func loadConfig() {
    reset()

    let plistPath = Bundle.main.path(forResource: "EXBuildConstants", ofType: "plist")
    let config = plistPath.let { it in
      NSDictionary(contentsOfFile: it)
    } ?? NSDictionary()

    isDevKernel = config["IS_DEV_KERNEL"] as? Bool ?? false
    kernelDevManifestSource = BuildConstants.kernelManifestSource(from: config["DEV_KERNEL_SOURCE"] as? String)

    switch kernelDevManifestSource {
    case .local:
      // local kernel. use manifest and assetRequestHeaders from local server.
      kernelManifestAndAssetRequestHeadersJsonString =
        config["BUILD_MACHINE_KERNEL_MANIFEST"] as? String ?? ""
      break
    case .published:
      // dev published kernel. use published manifest and assetRequestHeaders.
      kernelManifestAndAssetRequestHeadersJsonString =
        config["DEV_PUBLISHED_KERNEL_MANIFEST"] as? String ?? ""
      break
    case .none:
      break
    }

    apiServerEndpoint = URL(string: config["API_SERVER_ENDPOINT"] as? String ?? "")
    sdkVersion = config["TEMPORARY_SDK_VERSION"] as? String ?? ""

    if let expoRuntimeVersionString = config["EXPO_RUNTIME_VERSION"] as? String {
      expoRuntimeVersion = expoRuntimeVersionString
    }

    if let apiKeys = config["DEFAULT_API_KEYS"] as? [String: Any] {
      defaultApiKeys = apiKeys
    }
  }

  private static func kernelManifestSource(from sourceString: String?)
    -> KernelDevManifestSource
  {
    switch sourceString {
    case "LOCAL":
      return .local
    case "PUBLISHED":
      return .published
    default:
      return .none
    }
  }
}
