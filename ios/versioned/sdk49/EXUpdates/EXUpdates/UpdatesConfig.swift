//  Copyright © 2019 650 Industries. All rights reserved.

// Member variable names here are kept to ease transition to swift. Can rename at end.
// swiftlint:disable identifier_name

import Foundation

@objc(ABI49_0_0EXUpdatesCheckAutomaticallyConfig)
public enum CheckAutomaticallyConfig: Int {
  case Always = 0
  case WifiOnly = 1
  case Never = 2
  case ErrorRecoveryOnly = 3
  var asString: String {
    switch self {
    case .Always:
      return "ALWAYS"
    case .WifiOnly:
      return "WIFI_ONLY"
    case .Never:
      return "NEVER"
    case .ErrorRecoveryOnly:
      return "ERROR_RECOVERY_ONLY"
    }
  }
}

@objc(ABI49_0_0EXUpdatesConfigError)
public enum UpdatesConfigError: Int, Error {
  case ExpoUpdatesConfigPlistError
}

/**
 * Holds global, immutable configuration values for updates, as well as doing some rudimentary
 * validation.
 *
 * In most apps, these configuration values are baked into the build, and this class functions as a
 * utility for reading and memoizing the values.
 *
 * In development clients (including Expo Go) where this configuration is intended to be dynamic at
 * runtime and updates from multiple scopes can potentially be opened, multiple instances of this
 * class may be created over the lifetime of the app, but only one should be active at a time.
 */
@objc(ABI49_0_0EXUpdatesConfig)
@objcMembers
public final class UpdatesConfig: NSObject {
  public static let PlistName = "Expo"

  public static let ABI49_0_0EXUpdatesConfigEnableAutoSetupKey = "ABI49_0_0EXUpdatesAutoSetup"
  public static let ABI49_0_0EXUpdatesConfigEnabledKey = "ABI49_0_0EXUpdatesEnabled"
  public static let ABI49_0_0EXUpdatesConfigScopeKeyKey = "ABI49_0_0EXUpdatesScopeKey"
  public static let ABI49_0_0EXUpdatesConfigUpdateUrlKey = "ABI49_0_0EXUpdatesURL"
  public static let ABI49_0_0EXUpdatesConfigRequestHeadersKey = "ABI49_0_0EXUpdatesRequestHeaders"
  public static let ABI49_0_0EXUpdatesConfigReleaseChannelKey = "ABI49_0_0EXUpdatesReleaseChannel"
  public static let ABI49_0_0EXUpdatesConfigLaunchWaitMsKey = "ABI49_0_0EXUpdatesLaunchWaitMs"
  public static let ABI49_0_0EXUpdatesConfigCheckOnLaunchKey = "ABI49_0_0EXUpdatesCheckOnLaunch"
  public static let ABI49_0_0EXUpdatesConfigSDKVersionKey = "ABI49_0_0EXUpdatesSDKVersion"
  public static let ABI49_0_0EXUpdatesConfigRuntimeVersionKey = "ABI49_0_0EXUpdatesRuntimeVersion"
  public static let ABI49_0_0EXUpdatesConfigHasEmbeddedUpdateKey = "ABI49_0_0EXUpdatesHasEmbeddedUpdate"
  public static let ABI49_0_0EXUpdatesConfigExpectsSignedManifestKey = "ABI49_0_0EXUpdatesExpectsSignedManifest"
  public static let ABI49_0_0EXUpdatesConfigCodeSigningCertificateKey = "ABI49_0_0EXUpdatesCodeSigningCertificate"
  public static let ABI49_0_0EXUpdatesConfigCodeSigningMetadataKey = "ABI49_0_0EXUpdatesCodeSigningMetadata"
  public static let ABI49_0_0EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey = "ABI49_0_0EXUpdatesCodeSigningIncludeManifestResponseCertificateChain"
  public static let ABI49_0_0EXUpdatesConfigCodeSigningAllowUnsignedManifestsKey = "ABI49_0_0EXUpdatesConfigCodeSigningAllowUnsignedManifests"
  public static let ABI49_0_0EXUpdatesConfigEnableExpoUpdatesProtocolV0CompatibilityModeKey = "ABI49_0_0EXUpdatesConfigEnableExpoUpdatesProtocolV0CompatibilityMode"

  public static let ABI49_0_0EXUpdatesConfigCheckOnLaunchValueAlways = "ALWAYS"
  public static let ABI49_0_0EXUpdatesConfigCheckOnLaunchValueWifiOnly = "WIFI_ONLY"
  public static let ABI49_0_0EXUpdatesConfigCheckOnLaunchValueErrorRecoveryOnly = "ERROR_RECOVERY_ONLY"
  public static let ABI49_0_0EXUpdatesConfigCheckOnLaunchValueNever = "NEVER"

  private static let ReleaseChannelDefaultValue = "default"

  public let isEnabled: Bool
  public let expectsSignedManifest: Bool
  public let scopeKey: String?
  public let updateUrl: URL?
  public let requestHeaders: [String: String]
  public let releaseChannel: String
  public let launchWaitMs: Int
  public let checkOnLaunch: CheckAutomaticallyConfig
  public let codeSigningConfiguration: CodeSigningConfiguration?

  // used only in Expo Go to prevent loading rollbacks and other directives, which don't make much sense in the context of Expo Go
  public let enableExpoUpdatesProtocolV0CompatibilityMode: Bool

  public let sdkVersion: String?
  public let runtimeVersion: String?

  public let hasEmbeddedUpdate: Bool

  internal required init(
    isEnabled: Bool,
    expectsSignedManifest: Bool,
    scopeKey: String?,
    updateUrl: URL?,
    requestHeaders: [String: String],
    releaseChannel: String,
    launchWaitMs: Int,
    checkOnLaunch: CheckAutomaticallyConfig,
    codeSigningConfiguration: CodeSigningConfiguration?,
    sdkVersion: String?,
    runtimeVersion: String?,
    hasEmbeddedUpdate: Bool,
    enableExpoUpdatesProtocolV0CompatibilityMode: Bool
  ) {
    self.isEnabled = isEnabled
    self.expectsSignedManifest = expectsSignedManifest
    self.scopeKey = scopeKey
    self.updateUrl = updateUrl
    self.requestHeaders = requestHeaders
    self.releaseChannel = releaseChannel
    self.launchWaitMs = launchWaitMs
    self.checkOnLaunch = checkOnLaunch
    self.codeSigningConfiguration = codeSigningConfiguration
    self.sdkVersion = sdkVersion
    self.runtimeVersion = runtimeVersion
    self.hasEmbeddedUpdate = hasEmbeddedUpdate
    self.enableExpoUpdatesProtocolV0CompatibilityMode = enableExpoUpdatesProtocolV0CompatibilityMode
  }

  public func isMissingRuntimeVersion() -> Bool {
    return (runtimeVersion?.isEmpty ?? true) && (sdkVersion?.isEmpty ?? true)
  }

  public static func configWithExpoPlist(mergingOtherDictionary: [String: Any]?) throws -> UpdatesConfig {
    guard let configPath = Bundle.main.path(forResource: PlistName, ofType: "plist") else {
      throw UpdatesConfigError.ExpoUpdatesConfigPlistError
    }
    return try configWithExpoPlist(configPlistPath: configPath, mergingOtherDictionary: mergingOtherDictionary)
  }

  public static func configWithExpoPlist(configPlistPath: String, mergingOtherDictionary: [String: Any]?) throws -> UpdatesConfig {
    // swiftlint:disable:next legacy_objc_type
    guard let configNSDictionary = NSDictionary(contentsOfFile: configPlistPath) as? [String: Any] else {
      throw UpdatesConfigError.ExpoUpdatesConfigPlistError
    }

    var dictionary: [String: Any] = configNSDictionary
    if let mergingOtherDictionary = mergingOtherDictionary {
      dictionary = dictionary.merging(mergingOtherDictionary, uniquingKeysWith: { _, new in new })
    }

    return UpdatesConfig.config(fromDictionary: dictionary)
  }

  public static func config(fromDictionary config: [String: Any]) -> UpdatesConfig {
    let isEnabled = config.optionalValue(forKey: ABI49_0_0EXUpdatesConfigEnabledKey) ?? false
    let expectsSignedManifest = config.optionalValue(forKey: ABI49_0_0EXUpdatesConfigExpectsSignedManifestKey) ?? false
    let updateUrl: URL? = config.optionalValue(forKey: ABI49_0_0EXUpdatesConfigUpdateUrlKey).let { it in
      URL(string: it)
    }

    var scopeKey: String? = config.optionalValue(forKey: ABI49_0_0EXUpdatesConfigScopeKeyKey)
    if scopeKey == nil,
      let updateUrl = updateUrl {
      scopeKey = UpdatesConfig.normalizedURLOrigin(url: updateUrl)
    }

    let requestHeaders: [String: String] = config.optionalValue(forKey: ABI49_0_0EXUpdatesConfigRequestHeadersKey) ?? [:]
    let releaseChannel = config.optionalValue(forKey: ABI49_0_0EXUpdatesConfigReleaseChannelKey) ?? ReleaseChannelDefaultValue
    let launchWaitMs = config.optionalValue(forKey: ABI49_0_0EXUpdatesConfigLaunchWaitMsKey).let { (it: Any) in
      // The only way I can figure out how to detect numbers is to do a is NSNumber (is any Numeric didn't work).
      // This might be able to change when we switch out the plist decoder above
      // swiftlint:disable:next legacy_objc_type
      if let it = it as? NSNumber {
        return it.intValue
      } else if let it = it as? String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .none
        return formatter.number(from: it)?.intValue
      }
      return nil
    } ?? 0

    let checkOnLaunch = config.optionalValue(forKey: ABI49_0_0EXUpdatesConfigCheckOnLaunchKey).let { (it: String) in
      switch it {
      case ABI49_0_0EXUpdatesConfigCheckOnLaunchValueNever:
        return CheckAutomaticallyConfig.Never
      case ABI49_0_0EXUpdatesConfigCheckOnLaunchValueErrorRecoveryOnly:
        return CheckAutomaticallyConfig.ErrorRecoveryOnly
      case ABI49_0_0EXUpdatesConfigCheckOnLaunchValueWifiOnly:
        return CheckAutomaticallyConfig.WifiOnly
      case ABI49_0_0EXUpdatesConfigCheckOnLaunchValueAlways:
        return CheckAutomaticallyConfig.Always
      default:
        return CheckAutomaticallyConfig.Always
      }
    } ?? CheckAutomaticallyConfig.Always

    let sdkVersion: String? = config.optionalValue(forKey: ABI49_0_0EXUpdatesConfigSDKVersionKey)
    let runtimeVersion: String? = config.optionalValue(forKey: ABI49_0_0EXUpdatesConfigRuntimeVersionKey)
    let hasEmbeddedUpdate = config.optionalValue(forKey: ABI49_0_0EXUpdatesConfigHasEmbeddedUpdateKey) ?? true

    let codeSigningConfiguration = config.optionalValue(forKey: ABI49_0_0EXUpdatesConfigCodeSigningCertificateKey).let { (certificateString: String) in
      let codeSigningMetadata: [String: String] = config.requiredValue(forKey: ABI49_0_0EXUpdatesConfigCodeSigningMetadataKey)
      let codeSigningIncludeManifestResponseCertificateChain: Bool = config.optionalValue(
        forKey: ABI49_0_0EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey
      ) ?? false
      let codeSigningAllowUnsignedManifests: Bool = config.optionalValue(forKey: ABI49_0_0EXUpdatesConfigCodeSigningAllowUnsignedManifestsKey) ?? false

      return (try? UpdatesConfig.codeSigningConfigurationForCodeSigningCertificate(
        certificateString,
        codeSigningMetadata: codeSigningMetadata,
        codeSigningIncludeManifestResponseCertificateChain: codeSigningIncludeManifestResponseCertificateChain,
        codeSigningAllowUnsignedManifests: codeSigningAllowUnsignedManifests
      )).require("Invalid code signing configuration")
    }

    let enableExpoUpdatesProtocolV0CompatibilityMode = config.optionalValue(forKey: ABI49_0_0EXUpdatesConfigEnableExpoUpdatesProtocolV0CompatibilityModeKey) ?? false

    return UpdatesConfig(
      isEnabled: isEnabled,
      expectsSignedManifest: expectsSignedManifest,
      scopeKey: scopeKey,
      updateUrl: updateUrl,
      requestHeaders: requestHeaders,
      releaseChannel: releaseChannel,
      launchWaitMs: launchWaitMs,
      checkOnLaunch: checkOnLaunch,
      codeSigningConfiguration: codeSigningConfiguration,
      sdkVersion: sdkVersion,
      runtimeVersion: runtimeVersion,
      hasEmbeddedUpdate: hasEmbeddedUpdate,
      enableExpoUpdatesProtocolV0CompatibilityMode: enableExpoUpdatesProtocolV0CompatibilityMode
    )
  }

  private static func codeSigningConfigurationForCodeSigningCertificate(
    _ codeSigningCertificate: String,
    codeSigningMetadata: [String: String],
    codeSigningIncludeManifestResponseCertificateChain: Bool,
    codeSigningAllowUnsignedManifests: Bool
  ) throws -> CodeSigningConfiguration? {
    return try CodeSigningConfiguration(
      embeddedCertificateString: codeSigningCertificate,
      metadata: codeSigningMetadata,
      includeManifestResponseCertificateChain: codeSigningIncludeManifestResponseCertificateChain,
      allowUnsignedManifests: codeSigningAllowUnsignedManifests
    )
  }

  public static func normalizedURLOrigin(url: URL) -> String {
    let scheme = url.scheme.require("updateUrl must have a valid scheme")
    let host = url.host.require("updateUrl must have a valid host")
    var portOuter: Int? = url.port
    if let port = portOuter,
      Int(port) > -1,
      port == UpdatesConfig.defaultPortForScheme(scheme: scheme) {
      portOuter = nil
    }

    guard let port = portOuter,
      Int(port) > -1 else {
      return "\(scheme)://\(host)"
    }

    return "\(scheme)://\(host):\(Int(port))"
  }

  private static func defaultPortForScheme(scheme: String?) -> Int? {
    switch scheme {
    case "http":
      return 80
    case "ws":
      return 80
    case "https":
      return 443
    case "wss":
      return 443
    case "ftp":
      return 21
    default:
      return nil
    }
  }
}
