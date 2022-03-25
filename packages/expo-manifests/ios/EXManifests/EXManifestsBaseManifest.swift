//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation
import UIKit

extension Dictionary where Key == String {
  func optionalValue<T>(forKey: String) -> T? {
    guard let value = self[forKey] else {
      return nil
    }
    precondition(value is T, String(format: "Value for (key = %@) incorrect type", forKey))
    return (value as! T)
  }

  func requiredValue<T>(forKey: String) -> T {
    let value = self[forKey]
    precondition(value != nil, String(format: "Value for (key = %@) should not be null", forKey))
    precondition(value is T, String(format: "Value for (key = %@) incorrect type", forKey))
    return value as! T
  }
}

extension Optional {
  func `let`<U>(_ transform: (_ it: Wrapped) throws -> U?) rethrows -> U? {
    if let x = self {
      return try transform(x)
    }
    return nil
  }
}

@objc public class EXManifestsManifest : NSObject {
  private var rawManifestJSONInternal: Dictionary<String, Any>

  @objc public required init(rawManifestJSON: Dictionary<String, Any>) {
    self.rawManifestJSONInternal = rawManifestJSON
  }

  func description() -> String {
    return self.rawManifestJSONInternal.description
  }

  @objc public func rawManifestJSON() -> Dictionary<String, Any> {
    return self.rawManifestJSONInternal
  }

  // MARK: - Abstract methods

  /**
   A best-effort immutable legacy ID for this experience. Stable through project transfers.
   Should be used for calling Expo and EAS APIs during their transition to easProjectId.
   */
  @available(*, deprecated, message: "Prefer scopeKey or easProjectId depending on use case")
  @objc public func stableLegacyId() -> String {
    preconditionFailure("Must override in concrete class")
  }

  /**
   A stable immutable scoping key for this experience. Should be used for scoping data on the
   client for this project when running in Expo Go.
   */
  @objc public func scopeKey() -> String {
    preconditionFailure("Must override in concrete class")
  }

  /**
   A stable UUID for this EAS project. Should be used to call EAS APIs.
   */
  @objc public func easProjectId() -> String? {
    preconditionFailure("Must override in concrete class")
  }

  @objc public func sdkVersion() -> String? {
    preconditionFailure("Must override in concrete class")
  }

  @objc public func bundleUrl() -> String {
    preconditionFailure("Must override in concrete class")
  }

  func expoGoConfigRootObject() -> Dictionary<String, Any>? {
    preconditionFailure("Must override in concrete class")
  }

  func expoClientConfigRootObject() -> Dictionary<String, Any>? {
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
   Use stableLegacyId for cases where a stable legacy format identifier of the experience is needed (experience scoping for example).
   */
  @objc public func legacyId() -> String {
    return self.rawManifestJSONInternal.requiredValue(forKey: "id")
  }

  @objc public func revisionId() -> String? {
    return self.expoClientConfigRootObject()?.optionalValue(forKey: "revisionId")
  }

  @objc public func slug() -> String? {
    return self.expoClientConfigRootObject()?.optionalValue(forKey: "slug")
  }

  @objc public func appKey() -> String? {
    return self.expoClientConfigRootObject()?.optionalValue(forKey: "appKey")
  }

  @objc public func name() -> String? {
    return self.expoClientConfigRootObject()?.optionalValue(forKey: "name")
  }

  @objc public func version() -> String? {
    return self.expoClientConfigRootObject()?.optionalValue(forKey: "version")
  }

  @objc public func notificationPreferences() -> Dictionary<String, Any>? {
    return self.expoClientConfigRootObject()?.optionalValue(forKey: "notification")
  }

  @objc public func updatesInfo() -> Dictionary<String, Any>? {
    return self.expoClientConfigRootObject()?.optionalValue(forKey: "updates")
  }

  @objc public func iosConfig() -> Dictionary<String, Any>? {
    return self.expoClientConfigRootObject()?.optionalValue(forKey: "ios")
  }

  @objc public func hostUri() -> String? {
    return self.expoClientConfigRootObject()?.optionalValue(forKey: "hostUri")
  }

  @objc public func orientation() -> String? {
    return self.expoClientConfigRootObject()?.optionalValue(forKey: "orientation")
  }

  @objc public func experiments() -> Dictionary<String, Any>? {
    return self.expoClientConfigRootObject()?.optionalValue(forKey: "experiments")
  }

  @objc public func developer() -> Dictionary<String, Any>? {
    return self.expoGoConfigRootObject()?.optionalValue(forKey: "developer")
  }

  @objc public func logUrl() -> String? {
    return self.expoGoConfigRootObject()?.optionalValue(forKey: "logUrl")
  }

  @objc public func facebookAppId() -> String? {
    return self.expoClientConfigRootObject()?.optionalValue(forKey: "facebookAppId")
  }

  @objc public func facebookApplicationName() -> String? {
    return self.expoClientConfigRootObject()?.optionalValue(forKey: "facebookDisplayName")
  }

  @objc public func facebookAutoInitEnabled() -> Bool {
    return self.expoClientConfigRootObject()?.optionalValue(forKey: "facebookAutoInitEnabled") ?? false
  }

  // MARK: - Derived Methods

  @objc public func isDevelopmentMode() -> Bool {
    guard let expoGoConfigRootObject = self.expoGoConfigRootObject(),
          let packagerOptsConfig: Dictionary<String, Any>? = expoGoConfigRootObject.optionalValue(forKey: "packagerOpts"),
          let dev = packagerOptsConfig?["dev"] else {
            return false
    }

    return self.developer() != nil && (dev is Bool && dev as! Bool)
  }

  @objc public func isDevelopmentSilentLaunch() -> Bool {
    guard let expoGoConfigRootObject = self.expoGoConfigRootObject(),
          let developmentClientSettings: Dictionary<String, Any>? = expoGoConfigRootObject.optionalValue(forKey: "developmentClient"),
          let silentLaunch = developmentClientSettings?["silentLaunch"] else {
            return false
    }

    return (silentLaunch is Bool && silentLaunch as! Bool)
  }

  @objc public func isUsingDeveloperTool() -> Bool {
    return self.developer()?["tool"] != nil;
  }

  @objc public func userInterfaceStyle() -> String? {
    return self.iosConfig()?.optionalValue(forKey: "userInterfaceStyle") ?? self.expoClientConfigRootObject()?.optionalValue(forKey: "userInterfaceStyle")
  }

  @objc public func iosOrRootBackgroundColor() -> String? {
    return self.iosConfig()?.optionalValue(forKey: "backgroundColor") ?? self.expoClientConfigRootObject()?.optionalValue(forKey: "backgroundColor")

  }

  @objc public func iosSplashBackgroundColor() -> String? {
    return self.expoClientConfigRootObject().let { it in
      EXManifestsManifest.string(fromManifest: it, atPaths: [
        ["ios", "splash", "backgroundColor"],
        ["splash", "backgroundColor"],
      ])
    }
  }

  @objc public func iosSplashImageUrl() -> String? {
    return self.expoClientConfigRootObject().let { it in
      EXManifestsManifest.string(fromManifest: it, atPaths: [
        UIDevice.current.userInterfaceIdiom == UIUserInterfaceIdiom.pad
          ? ["ios", "splash", "tabletImageUrl"] : [],
        ["ios", "splash", "imageUrl"],
        ["splash", "imageUrl"],
      ])
    }
  }

  @objc public func iosSplashImageResizeMode() -> String? {
    return self.expoClientConfigRootObject().let { it in
      EXManifestsManifest.string(fromManifest: it, atPaths: [
        ["ios", "splash", "resizeMode"],
        ["splash", "resizeMode"],
      ])
    }
  }


  @objc public func iosGoogleServicesFile() -> String? {
    return self.iosConfig()?.optionalValue(forKey: "googleServicesFile")
  }

  private static func string(fromManifest: Dictionary<String, Any>, atPaths: [[String]]) -> String? {
    for path in atPaths {
      if let result = self.string(fromManifest: fromManifest, atPath: path) {
        return result
      }
    }
    return nil
  }

  private static func string(fromManifest: Dictionary<String, Any>, atPath: [String]) -> String? {
    var json = fromManifest
    for i in 0..<atPath.count {
      let isLastKey = i == atPath.count - 1
      let key = atPath[i]
      let value = json[key]
      if isLastKey && value is String {
        return value as! String?
      }
      guard let newJson = value else {
        return nil
      }
      json = newJson as! [String: Any]
    }
    return nil
  }
}
