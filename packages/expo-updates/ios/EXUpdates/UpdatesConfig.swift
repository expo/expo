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
  public var asString: String {
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

public enum UpdatesConfigError: Error, Sendable, LocalizedError {
  case ExpoUpdatesConfigPlistError
  case ExpoUpdatesConfigMissingURLError
  case ExpoUpdatesMissingRuntimeVersionError

  public var errorDescription: String? {
    switch self {
    case .ExpoUpdatesConfigPlistError:
      return "Expo.plist not found in bundle or invalid"
    case .ExpoUpdatesConfigMissingURLError:
      return "Config for expo-updates missing URL"
    case .ExpoUpdatesMissingRuntimeVersionError:
      return "Config for expo-updates missing runtime version"
    }
  }
}

public enum UpdatesConfigurationValidationResult {
  case Valid
  case InvalidNotEnabled
  case InvalidPlistError
  case InvalidMissingURL
  case InvalidMissingRuntimeVersion
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

  public static let EXUpdatesConfigEnabledKey = "EXUpdatesEnabled"
  public static let EXUpdatesConfigScopeKeyKey = "EXUpdatesScopeKey"
  public static let EXUpdatesConfigUpdateUrlKey = "EXUpdatesURL"
  public static let EXUpdatesConfigRequestHeadersKey = "EXUpdatesRequestHeaders"
  public static let EXUpdatesConfigLaunchWaitMsKey = "EXUpdatesLaunchWaitMs"
  public static let EXUpdatesConfigCheckOnLaunchKey = "EXUpdatesCheckOnLaunch"
  public static let EXUpdatesConfigRuntimeVersionKey = "EXUpdatesRuntimeVersion"
  public static let EXUpdatesConfigHasEmbeddedUpdateKey = "EXUpdatesHasEmbeddedUpdate"
  public static let EXUpdatesConfigCodeSigningCertificateKey = "EXUpdatesCodeSigningCertificate"
  public static let EXUpdatesConfigCodeSigningMetadataKey = "EXUpdatesCodeSigningMetadata"
  public static let EXUpdatesConfigCodeSigningIncludeManifestResponseCertificateChainKey = "EXUpdatesCodeSigningIncludeManifestResponseCertificateChain"
  public static let EXUpdatesConfigCodeSigningAllowUnsignedManifestsKey = "EXUpdatesConfigCodeSigningAllowUnsignedManifests"
  public static let EXUpdatesConfigEnableExpoUpdatesProtocolV0CompatibilityModeKey = "EXUpdatesConfigEnableExpoUpdatesProtocolV0CompatibilityMode"
  public static let EXUpdatesConfigDisableAntiBrickingMeasures = "EXUpdatesDisableAntiBrickingMeasures"

  public static let EXUpdatesConfigCheckOnLaunchValueAlways = "ALWAYS"
  public static let EXUpdatesConfigCheckOnLaunchValueWifiOnly = "WIFI_ONLY"
  public static let EXUpdatesConfigCheckOnLaunchValueErrorRecoveryOnly = "ERROR_RECOVERY_ONLY"
  public static let EXUpdatesConfigCheckOnLaunchValueNever = "NEVER"

  public static let EXUpdatesConfigRuntimeVersionReadFingerprintFileSentinel = "file:fingerprint"

  public let scopeKey: String
  public let updateUrl: URL
  public let requestHeaders: [String: String]
  public let launchWaitMs: Int
  public let checkOnLaunch: CheckAutomaticallyConfig
  public let codeSigningConfiguration: CodeSigningConfiguration?
  // used only in Expo Go to prevent loading rollbacks and other directives, which don't make much sense in the context of Expo Go
  public let enableExpoUpdatesProtocolV0CompatibilityMode: Bool
  public let runtimeVersion: String
  public let hasEmbeddedUpdate: Bool
  public let disableAntiBrickingMeasures: Bool

  internal required init(
    scopeKey: String,
    updateUrl: URL,
    requestHeaders: [String: String],
    launchWaitMs: Int,
    checkOnLaunch: CheckAutomaticallyConfig,
    codeSigningConfiguration: CodeSigningConfiguration?,
    runtimeVersion: String,
    hasEmbeddedUpdate: Bool,
    enableExpoUpdatesProtocolV0CompatibilityMode: Bool,
    disableAntiBrickingMeasures: Bool
  ) {
    self.scopeKey = scopeKey
    self.updateUrl = updateUrl
    self.requestHeaders = requestHeaders
    self.launchWaitMs = launchWaitMs
    self.checkOnLaunch = checkOnLaunch
    self.codeSigningConfiguration = codeSigningConfiguration
    self.runtimeVersion = runtimeVersion
    self.hasEmbeddedUpdate = hasEmbeddedUpdate
    self.enableExpoUpdatesProtocolV0CompatibilityMode = enableExpoUpdatesProtocolV0CompatibilityMode
    self.disableAntiBrickingMeasures = disableAntiBrickingMeasures
  }

  private static func configDictionaryWithExpoPlist(mergingOtherDictionary: [String: Any]?) throws -> [String: Any] {
    guard let configPlistPath = Bundle.main.path(forResource: PlistName, ofType: "plist") else {
      throw UpdatesConfigError.ExpoUpdatesConfigPlistError
    }

    // swiftlint:disable:next legacy_objc_type
    guard let configNSDictionary = NSDictionary(contentsOfFile: configPlistPath) as? [String: Any] else {
      throw UpdatesConfigError.ExpoUpdatesConfigPlistError
    }

    var dictionary: [String: Any] = configNSDictionary
    if let mergingOtherDictionary = mergingOtherDictionary {
      dictionary = dictionary.merging(mergingOtherDictionary, uniquingKeysWith: { _, new in new })
    }

    return dictionary
  }

  private static func getRuntimeVersion(mergingOtherDictionary: [String: Any]?) -> String? {
    guard let dictionary = try? configDictionaryWithExpoPlist(mergingOtherDictionary: mergingOtherDictionary) else {
      return nil
    }

    return getRuntimeVersion(fromDictionary: dictionary)
  }

  private static func getRuntimeVersion(fromDictionary config: [String: Any]) -> String? {
    let runtimeVersion: String? = config.optionalValue(forKey: EXUpdatesConfigRuntimeVersionKey)
    guard let runtimeVersion = runtimeVersion, !runtimeVersion.isEmpty else {
      return nil
    }

    if runtimeVersion == EXUpdatesConfigRuntimeVersionReadFingerprintFileSentinel {
      let frameworkBundle = Bundle(for: UpdatesConfig.self)
      guard let resourceUrl = frameworkBundle.resourceURL,
        let bundle = Bundle(url: resourceUrl.appendingPathComponent("EXUpdates.bundle")),
        let path = bundle.path(forResource: "fingerprint", ofType: nil),
        let fingerprint = try? String(contentsOfFile: path) else {
        return nil
      }
      return fingerprint
    }

    return runtimeVersion
  }

  public static func getUpdatesConfigurationValidationResult(
    mergingOtherDictionary: [String: Any]?,
    configOverride: UpdatesConfigOverride? = UpdatesConfigOverride.load()
  ) -> UpdatesConfigurationValidationResult {
    guard let dictionary = try? configDictionaryWithExpoPlist(mergingOtherDictionary: mergingOtherDictionary) else {
      return UpdatesConfigurationValidationResult.InvalidPlistError
    }

    guard dictionary.optionalValue(forKey: EXUpdatesConfigEnabledKey) ?? true else {
      return UpdatesConfigurationValidationResult.InvalidNotEnabled
    }

    let updateUrl = getUpdateUrl(fromDictionary: dictionary, configOverride: configOverride)
    guard updateUrl != nil else {
      return UpdatesConfigurationValidationResult.InvalidMissingURL
    }

    guard getRuntimeVersion(mergingOtherDictionary: mergingOtherDictionary) != nil else {
      return UpdatesConfigurationValidationResult.InvalidMissingRuntimeVersion
    }

    return UpdatesConfigurationValidationResult.Valid
  }

  public static func configWithExpoPlist(mergingOtherDictionary: [String: Any]?) throws -> UpdatesConfig {
    let dictionary = try configDictionaryWithExpoPlist(mergingOtherDictionary: mergingOtherDictionary)
    return try UpdatesConfig.config(fromDictionary: dictionary)
  }

  public static func config(fromDictionary config: [String: Any]) throws -> UpdatesConfig {
    return try UpdatesConfig.config(fromDictionary: config, configOverride: UpdatesConfigOverride.load())
  }

  internal static func config(
    fromDictionary config: [String: Any],
    configOverride: UpdatesConfigOverride?
  ) throws -> UpdatesConfig {
    guard let updateUrl = getUpdateUrl(fromDictionary: config, configOverride: configOverride) else {
      throw UpdatesConfigError.ExpoUpdatesConfigMissingURLError
    }
    let scopeKey = config.optionalValue(forKey: EXUpdatesConfigScopeKeyKey) ?? UpdatesConfig.normalizedURLOrigin(url: updateUrl)

    let requestHeaders = getRequestHeaders(fromDictionary: config, configOverride: configOverride)
    let launchWaitMs = config.optionalValue(forKey: EXUpdatesConfigLaunchWaitMsKey).let { (it: Any) in
      // The only way I can figure out how to detect numbers is to do a is NSNumber (is any Numeric didn't work).
      // This might be able to change when we switch out the plist decoder above
      // swiftlint:disable:next legacy_objc_type
      if let it = it as? NSNumber {
        return it.intValue
      }
      if let it = it as? String {
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

    guard let runtimeVersion = getRuntimeVersion(fromDictionary: config) else {
      throw UpdatesConfigError.ExpoUpdatesMissingRuntimeVersionError
    }

    let hasEmbeddedUpdate = getHasEmbeddedUpdate(fromDictionary: config, configOverride: configOverride)

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
      scopeKey: scopeKey,
      updateUrl: updateUrl,
      requestHeaders: requestHeaders,
      launchWaitMs: launchWaitMs,
      checkOnLaunch: checkOnLaunch,
      codeSigningConfiguration: codeSigningConfiguration,
      runtimeVersion: runtimeVersion,
      hasEmbeddedUpdate: hasEmbeddedUpdate,
      enableExpoUpdatesProtocolV0CompatibilityMode: enableExpoUpdatesProtocolV0CompatibilityMode,
      disableAntiBrickingMeasures: getDisableAntiBrickingMeasures(fromDictionary: config)
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

  private static func getDisableAntiBrickingMeasures(fromDictionary config: [String: Any]) -> Bool {
    return config.optionalValue(forKey: EXUpdatesConfigDisableAntiBrickingMeasures) ?? false
  }

  private static func getHasEmbeddedUpdate(
    fromDictionary config: [String: Any],
    configOverride: UpdatesConfigOverride?
  ) -> Bool {
    if getDisableAntiBrickingMeasures(fromDictionary: config) && configOverride != nil {
      return false
    }
    return config.optionalValue(forKey: EXUpdatesConfigHasEmbeddedUpdateKey) ?? true
  }

  private static func getUpdateUrl(
    fromDictionary config: [String: Any],
    configOverride: UpdatesConfigOverride?
  ) -> URL? {
    if getDisableAntiBrickingMeasures(fromDictionary: config),
      let updateUrl = configOverride?.updateUrl {
      return updateUrl
    }
    return config.optionalValue(forKey: EXUpdatesConfigUpdateUrlKey).let { it in
      URL(string: it)
    }
  }

  private static func getRequestHeaders(
    fromDictionary config: [String: Any],
    configOverride: UpdatesConfigOverride?
  ) -> [String: String] {
    if getDisableAntiBrickingMeasures(fromDictionary: config),
      let requestHeaders = configOverride?.requestHeaders {
      return requestHeaders
    }
    return config.optionalValue(forKey: EXUpdatesConfigRequestHeadersKey) ?? [:]
  }
}

// swiftlint:enable identifier_name
