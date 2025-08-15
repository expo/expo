//  Copyright © 2021 650 Industries. All rights reserved.

// this uses abstract class patterns
// swiftlint:disable unavailable_function

import Foundation

#if os(iOS) || os(tvOS)
import UIKit
#endif
/**
 Uses objective-c NSExceptions for field validation. This is to maintain
 backwards compatibility with the previous objective-c implementation so that we don't need to do
 error handling at every callsite. When all the code is swift, we might be able to use these exceptions.
 */
public extension Dictionary where Key == String {
  func optionalValue<T>(forKey: String) -> T? {
    guard let value = self[forKey] else {
      return nil
    }

    if !(value is T) {
      let exception = NSException(
        name: NSExceptionName.internalInconsistencyException,
        reason: "Value for (key = \(forKey)) has incorrect type",
        userInfo: ["key": forKey]
      )
      exception.raise()
    }
    return value as? T
  }

  func requiredValue<T>(forKey: String) -> T {
    let value = self[forKey]

    if value == nil {
      let exception = NSException(
        name: NSExceptionName.internalInconsistencyException,
        reason: "Value for (key = \(forKey)) is null",
        userInfo: ["key": forKey]
      )
      exception.raise()
    }

    if !(value is T) {
      let exception = NSException(
        name: NSExceptionName.internalInconsistencyException,
        reason: "Value for (key = \(forKey)) has incorrect type",
        userInfo: ["key": forKey]
      )
      exception.raise()
    }

    // exception above will preempt force_cast
    // swiftlint:disable:next force_cast
    return value as! T
  }
}

public extension Optional {
  func `let`<U>(_ transform: (_ it: Wrapped) throws -> U?) rethrows -> U? {
    if let x = self {
      return try transform(x)
    }
    return nil
  }
}

@objc(EXManifestsManifest)
@objcMembers
public class Manifest: NSObject {
  private let rawManifestJSONInternal: [String: Any]

  public required init(rawManifestJSON: [String: Any]) {
    rawManifestJSONInternal = rawManifestJSON
  }

  public override var debugDescription: String {
    return rawManifestJSONInternal.description
  }

  public func rawManifestJSON() -> [String: Any] {
    return rawManifestJSONInternal
  }

  // MARK: - Abstract methods

  /**
   A best-effort immutable legacy ID for this experience. Stable through project transfers.
   Should be used for calling Expo and EAS APIs during their transition to easProjectId.
   */
  @available(*, deprecated, message: "Prefer scopeKey or easProjectId depending on use case")
  public func stableLegacyId() -> String {
    preconditionFailure("Must override in concrete class")
  }

  /**
   A stable immutable scoping key for this experience. Should be used for scoping data on the
   client for this project when running in Expo Go.
   */
  public func scopeKey() -> String {
    preconditionFailure("Must override in concrete class")
  }

  /**
   A stable UUID for this EAS project. Should be used to call EAS APIs.
   */
  public func easProjectId() -> String? {
    preconditionFailure("Must override in concrete class")
  }

  /**
   Get the SDK version that should be attempted to be used in Expo Go. If no SDK version can be
   determined, returns null
   */
  public func expoGoSDKVersion() -> String? {
    preconditionFailure("Must override in concrete class")
  }

  public func bundleUrl() -> String {
    preconditionFailure("Must override in concrete class")
  }

  public func expoGoConfigRootObject() -> [String: Any]? {
    preconditionFailure("Must override in concrete class")
  }

  public func expoClientConfigRootObject() -> [String: Any]? {
    preconditionFailure("Must override in concrete class")
  }

  // MARK: - Field Getters
  /**
   The legacy ID of this experience.
   - For Bare manifests, formatted as a UUID.
   - For Legacy manifests, formatted as @owner/slug. Not stable through project transfers.
   - For New manifests, currently incorrect value is UUID.
   Use this in cases where an identifier of the current manifest is needed (experience loading for example).
   Use scopeKey for cases where a stable key is needed to scope data to this experience.
   Use easProjectId for cases where a stable UUID identifier of the experience is needed to identify over EAS APIs.
   Use stableLegacyId for cases where a stable legacy format identifier of the experience is needed
    (experience scoping for example).
   */
  @available(*, deprecated, message: "Prefer scopeKey or projectId depending on use case")
  public func legacyId() -> String {
    return rawManifestJSONInternal.requiredValue(forKey: "id")
  }

  public func revisionId() -> String? {
    return expoClientConfigRootObject()?.optionalValue(forKey: "revisionId")
  }

  public func getMetadata() -> [String: Any]? {
    return rawManifestJSONInternal.optionalValue(forKey: "metadata")
  }

  public func slug() -> String? {
    return expoClientConfigRootObject()?.optionalValue(forKey: "slug")
  }

  public func appKey() -> String? {
    return expoClientConfigRootObject()?.optionalValue(forKey: "appKey")
  }

  public func isVerified() -> Bool {
    return rawManifestJSONInternal.optionalValue(forKey: "isVerified") ?? false
  }

  public func name() -> String? {
    return expoClientConfigRootObject()?.optionalValue(forKey: "name")
  }

  public func version() -> String? {
    return expoClientConfigRootObject()?.optionalValue(forKey: "version")
  }

  public func notificationPreferences() -> [String: Any]? {
    return expoClientConfigRootObject()?.optionalValue(forKey: "notification")
  }

  public func updatesInfo() -> [String: Any]? {
    return expoClientConfigRootObject()?.optionalValue(forKey: "updates")
  }

  public func iosConfig() -> [String: Any]? {
    return expoClientConfigRootObject()?.optionalValue(forKey: "ios")
  }

  public func hostUri() -> String? {
    return expoClientConfigRootObject()?.optionalValue(forKey: "hostUri")
  }

  public func orientation() -> String? {
    return expoClientConfigRootObject()?.optionalValue(forKey: "orientation")
  }

  public func experiments() -> [String: Any]? {
    return expoClientConfigRootObject()?.optionalValue(forKey: "experiments")
  }

  public func developer() -> [String: Any]? {
    return expoGoConfigRootObject()?.optionalValue(forKey: "developer")
  }

  public func facebookAppId() -> String? {
    return expoClientConfigRootObject()?.optionalValue(forKey: "facebookAppId")
  }

  public func facebookApplicationName() -> String? {
    return expoClientConfigRootObject()?.optionalValue(forKey: "facebookDisplayName")
  }

  public func facebookAutoInitEnabled() -> Bool {
    return expoClientConfigRootObject()?.optionalValue(forKey: "facebookAutoInitEnabled") ?? false
  }

  // MARK: - Derived Methods
  public func isDevelopmentMode() -> Bool {
    guard let expoGoConfigRootObject = expoGoConfigRootObject(),
      let packagerOptsConfig: [String: Any]? = expoGoConfigRootObject.optionalValue(forKey: "packagerOpts"),
      let dev = packagerOptsConfig?["dev"] else {
      return false
    }

    if developer() == nil {
      return false
    }

    guard let dev = dev as? Bool else {
      return false
    }
    return dev
  }

  public func isDevelopmentSilentLaunch() -> Bool {
    guard let expoGoConfigRootObject = expoGoConfigRootObject(),
      let developmentClientSettings: [String: Any]? =
        expoGoConfigRootObject.optionalValue(forKey: "developmentClient"),
      let silentLaunch = developmentClientSettings?["silentLaunch"] else {
      return false
    }

    guard let silentLaunch = silentLaunch as? Bool else {
      return false
    }
    return silentLaunch
  }

  public func isUsingDeveloperTool() -> Bool {
    return developer()?["tool"] != nil
  }

  public func userInterfaceStyle() -> String? {
    return iosConfig()?.optionalValue(forKey: "userInterfaceStyle") ??
    (expoClientConfigRootObject()?.optionalValue(forKey: "userInterfaceStyle"))
  }

  public func iosOrRootBackgroundColor() -> String? {
    return iosConfig()?.optionalValue(forKey: "backgroundColor") ??
    (expoClientConfigRootObject()?.optionalValue(forKey: "backgroundColor"))
  }

  public func iosSplashBackgroundColor() -> String? {
    return expoClientConfigRootObject().let { it in
      Manifest.string(fromManifest: it, atPaths: [
        ["ios", "splash", "backgroundColor"],
        ["splash", "backgroundColor"]
      ])
    }
  }

  public func iosAppIconUrl() -> String? {
    return expoClientConfigRootObject().let { it in
      Manifest.string(fromManifest: it, atPath: ["iconUrl"])
    }
  }

  public func iosSplashImageUrl() -> String? {
    var paths = [["ios", "splash", "imageUrl"], ["splash", "imageUrl"]]
#if os(iOS) || os(tvOS)
    if UIDevice.current.userInterfaceIdiom == UIUserInterfaceIdiom.pad {
      paths.insert(contentsOf: [
        ["ios", "splash", "tabletImageUrl"],
        ["splash", "tabletImageUrl"]
      ], at: 0)
    }
#endif
    return expoClientConfigRootObject().let { it in
      Manifest.string(fromManifest: it, atPaths: paths)
    }
  }

  public func iosSplashImageResizeMode() -> String? {
    return expoClientConfigRootObject().let { it in
      Manifest.string(fromManifest: it, atPaths: [
        ["ios", "splash", "resizeMode"],
        ["splash", "resizeMode"]
      ])
    }
  }

  public func iosGoogleServicesFile() -> String? {
    return iosConfig()?.optionalValue(forKey: "googleServicesFile")
  }

  public func supportsRTL() -> Bool {
    guard let expoClientConfigRootObject = expoClientConfigRootObject(),
      let extra: [String: Any]? = expoClientConfigRootObject.optionalValue(forKey: "extra"),
      let supportsRTL: Bool = extra?.optionalValue(forKey: "supportsRTL") else {
      return false
    }

    return supportsRTL
  }

  public func forcesRTL() -> Bool {
    guard let expoClientConfigRootObject = expoClientConfigRootObject(),
      let extra: [String: Any]? = expoClientConfigRootObject.optionalValue(forKey: "extra"),
      let forcesRTL: Bool = extra?.optionalValue(forKey: "forcesRTL") else {
      return false
    }

    return forcesRTL
  }

  public func jsEngine() -> String {
    let jsEngine = expoClientConfigRootObject().let { it in
      Manifest.string(fromManifest: it, atPaths: [
        ["ios", "jsEngine"],
        ["jsEngine"]
      ])
    }

    guard let jsEngine = jsEngine else {
      let sdkMajorVersion = expoGoSDKMajorVersion()
      if sdkMajorVersion > 0 && sdkMajorVersion < 48 {
        return "jsc"
      }
      return "hermes"
    }
    return jsEngine
  }

  /**
   Queries the dedicated package properties in `plugins`
   */
  public func getPluginProperties(packageName: String) -> [String: Any]? {
    typealias PluginWithProps = (String, [String: Any])
    typealias PluginWithoutProps = String
    enum PluginType {
      case withProps (PluginWithProps)
      case withoutProps (PluginWithoutProps)

      private static func fromRawValue(_ optionalValue: Any?) -> PluginType? {
        guard let value = optionalValue else {
          return nil
        }
        if let valueArray = value as? [Any],
          let name = valueArray[0] as? String {
          if valueArray.count > 1 {
            guard let props = valueArray[1] as? [String: Any] else {
              return .withoutProps((name))
            }
            return .withProps((name, props))
          }
          return .withoutProps((name))
        }
        if let value = value as? String {
          return .withoutProps(value)
        }
        let exception = NSException(
          name: NSExceptionName.internalInconsistencyException,
          reason: "Value for (key = plugins) has incorrect type",
          userInfo: ["key": "plugins"]
        )
        exception.raise()
        return nil
      }

      static func fromRawArrayValue(_ value: [Any]) -> [PluginType]? {
        return value.compactMap { fromRawValue($0) }
      }
    }

    guard let pluginsRawValue = expoClientConfigRootObject()?.optionalValue(forKey: "plugins") as [Any]?,
      let plugins = PluginType.fromRawArrayValue(pluginsRawValue) else {
      return nil
    }

    let firstMatchedPlugin = plugins.compactMap { item in
      if case .withProps(let tuple) = item, tuple.0 == packageName {
        return tuple
      }
      return nil
    }.first

    return firstMatchedPlugin?.1
  }

  private func expoGoSDKMajorVersion() -> Int {
    let sdkVersion = expoGoSDKVersion()
    let components = sdkVersion?.components(separatedBy: ".")
    guard let components = components else {
      return 0
    }
    if components.count == 3 {
      return Int(components[0]) ?? 0
    }
    return 0
  }

  private static func string(fromManifest: [String: Any], atPaths: [[String]]) -> String? {
    for path in atPaths {
      if let result = string(fromManifest: fromManifest, atPath: path) {
        return result
      }
    }
    return nil
  }

  private static func string(fromManifest: [String: Any], atPath: [String]) -> String? {
    var json = fromManifest
    for i in 0..<atPath.count {
      let isLastKey = i == atPath.count - 1
      let key = atPath[i]
      let value = json[key]
      if isLastKey, let value = value as? String {
        return value
      }
      guard let newJson = value else {
        return nil
      }
      // swiftlint:disable:next force_cast
      json = newJson as! [String: Any]
    }
    return nil
  }
}

// swiftlint:enable unavailable_function
