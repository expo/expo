// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import EXApplication

@objc(EXClientReleaseType)
@objcMembers
public final class ClientReleaseType: NSObject {
  public static func clientReleaseType() -> String {
    // The only scenario in which we care about the app release type is when the App Store release of
    // the Expo development client is run on a real device so the development client knows to restrict
    // projects it can run. We always include expo-application in the App Store release of the
    // development client, so we correctly return "APPLE_APP_STORE" in the aforementioned scenario.
    //
    // In all other scenarios, we don't restrict the projects the client can run and can return either
    // the actual release type or "UNKNOWN" for the same behavior, so it doesn't matter whether
    // expo-application is linked.

    let releaseType = EXProvisioningProfile.main().appReleaseType()

    switch releaseType {
    case .typeUnknown:
      return "UNKNOWN"
    case .simulator:
      return "SIMULATOR"
    case .enterprise:
      return "ENTERPRISE"
    case .dev:
      return "DEVELOPMENT"
    case .adHoc:
      return "ADHOC"
    case .appStore:
      return "APPLE_APP_STORE"
    @unknown default:
      return "UNKNOWN"
    }
  }
}
