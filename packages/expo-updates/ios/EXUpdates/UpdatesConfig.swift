//  Copyright © 2019 650 Industries. All rights reserved.

// Member variable names here are kept to ease transition to swift. Can rename at end.
// swiftlint:disable identifier_name

import Foundation

@objc(EXUpdatesCheckAutomaticallyConfig)
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

@objc(EXUpdatesConfigError)
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
@objc(EXUpdatesConfig)
@objcMembers
public final class UpdatesConfig: NSObject {
  public static let PlistName = "Expo"

  public static let EXUpdatesConfigEnableAutoSetupKey = "EXUpdatesAutoSetup"
  public static let EXUpdatesConfigEnabledKey = "EXUpdatesEnabled"
  public static let EXUpdatesConfigScopeKeyKey = "EXUpdatesScopeKey"
  public static let EXUpdatesConfigUpdateUrlKey = "EXUpdatesURL"
  public static let EXUpdatesConfigRequestHeadersKey = "EXUpdatesRequestHeaders"
  public static let EXUpdatesConfigReleaseChannelKey = "EXUpdatesReleaseChannel"
  public static let EXUpdatesConfigLaunchWaitMsKey = "EXUpdatesLaunchWaitMs"
  public static let EXUpdatesConfigCheckOnLaunchKey = "EXUpdatesCheckOnLaunch"
  public static let EXUpdatesConfigSDKVersionKey = "EXUpdatesSDKVersion"
  public static let EXUpdatesConfigRuntimeVersionKey = "EXUpdatesRuntimeVersion"
  public static let EXUpdatesConfigHasEmbeddedUpdateKey = "EXUpdatesHasEmbeddedUpdate"
  public static let EXUpdatesConfigExpectsSignedManifestKey = "EXUpdatesExpectsSignedManifest"
  public static let EXUpdatesConfigCodeSigningCertificateKey = "EXUpdatesCodeSigningCertificate"
  public static let EXUpdatesConfigCodeSigningMetadataKey = "EXUpdatesCodeSigningMetadata"
  public static let EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey = "EXUpdatesCodeSigningIncludeManifestResponseCertificateChain"
  public static let EXUpdatesConfigCodeSigningAllowUnsignedManifestsKey = "EXUpdatesConfigCodeSigningAllowUnsignedManifests"
  public static let EXUpdatesConfigEnableExpoUpdatesProtocolV0CompatibilityModeKey = "EXUpdatesConfigEnableExpoUpdatesProtocolV0CompatibilityMode"

  public static let EXUpdatesConfigCheckOnLaunchValueAlways = "ALWAYS"
  public static let EXUpdatesConfigCheckOnLaunchValueWifiOnly = "WIFI_ONLY"
  public static let EXUpdatesConfigCheckOnLaunchValueErrorRecoveryOnly = "ERROR_RECOVERY_ONLY"
  public static let EXUpdatesConfigCheckOnLaunchValueNever = "NEVER"

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
    let isEnabled = config.optionalValue(forKey: EXUpdatesConfigEnabledKey) ?? true
    let expectsSignedManifest = config.optionalValue(forKey: EXUpdatesConfigExpectsSignedManifestKey) ?? false
    let updateUrl: URL? = config.optionalValue(forKey: EXUpdatesConfigUpdateUrlKey).let { it in
      URL(string: it)
    }

    var scopeKey: String? = config.optionalValue(forKey: EXUpdatesConfigScopeKeyKey)
    if scopeKey == nil,
      let updateUrl = updateUrl {
      scopeKey = UpdatesConfig.normalizedURLOrigin(url: updateUrl)
    }

    let requestHeaders: [String: String] = config.optionalValue(forKey: EXUpdatesConfigRequestHeadersKey) ?? [:]
    let releaseChannel = config.optionalValue(forKey: EXUpdatesConfigReleaseChannelKey) ?? ReleaseChannelDefaultValue
    let launchWaitMs = config.optionalValue(forKey: EXUpdatesConfigLaunchWaitMsKey).let { (it: Any) in
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

    let checkOnLaunch = config.optionalValue(forKey: EXUpdatesConfigCheckOnLaunchKey).let { (it: String) in
      switch it {
      case EXUpdatesConfigCheckOnLaunchValueNever:
        return CheckAutomaticallyConfig.Never
      case EXUpdatesConfigCheckOnLaunchValueErrorRecoveryOnly:
        return CheckAutomaticallyConfig.ErrorRecoveryOnly
      case EXUpdatesConfigCheckOnLaunchValueWifiOnly:
        return CheckAutomaticallyConfig.WifiOnly
      case EXUpdatesConfigCheckOnLaunchValueAlways:
        return CheckAutomaticallyConfig.Always
      default:
        return CheckAutomaticallyConfig.Always
      }
    } ?? CheckAutomaticallyConfig.Always

    let sdkVersion: String? = config.optionalValue(forKey: EXUpdatesConfigSDKVersionKey)
    let runtimeVersion: String? = config.optionalValue(forKey: EXUpdatesConfigRuntimeVersionKey)
    let hasEmbeddedUpdate = config.optionalValue(forKey: EXUpdatesConfigHasEmbeddedUpdateKey) ?? true

    let codeSigningConfiguration = config.optionalValue(forKey: EXUpdatesConfigCodeSigningCertificateKey).let { (certificateString: String) in
      let codeSigningMetadata: [String: String] = config.requiredValue(forKey: EXUpdatesConfigCodeSigningMetadataKey)
      let codeSigningIncludeManifestResponseCertificateChain: Bool = config.optionalValue(
        forKey: EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey
      ) ?? false
      let codeSigningAllowUnsignedManifests: Bool = config.optionalValue(forKey: EXUpdatesConfigCodeSigningAllowUnsignedManifestsKey) ?? false

      return (try? UpdatesConfig.codeSigningConfigurationForCodeSigningCertificate(
        certificateString,
        codeSigningMetadata: codeSigningMetadata,
        codeSigningIncludeManifestResponseCertificateChain: codeSigningIncludeManifestResponseCertificateChain,
        codeSigningAllowUnsignedManifests: codeSigningAllowUnsignedManifests
      )).require("Invalid code signing configuration")
    }

    let enableExpoUpdatesProtocolV0CompatibilityMode = config.optionalValue(forKey: EXUpdatesConfigEnableExpoUpdatesProtocolV0CompatibilityModeKey) ?? false

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
