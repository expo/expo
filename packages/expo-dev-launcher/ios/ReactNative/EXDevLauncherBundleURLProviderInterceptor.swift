// Copyright 2015-present 650 Industries. All rights reserved.

// swiftlint:disable type_name
@objc
public class EXDevLauncherBundleURLProviderInterceptor: NSObject {
  @objc
  public static var isInstalled: Bool = false {
    willSet {
      if isInstalled != newValue {
        swizzle()
      }
    }
  }

  static private func swizzle() {
    EXDevLauncherUtils.swizzle(
      selector: #selector(RCTBundleURLProvider.guessPackagerHost),
      withSelector: #selector(RCTBundleURLProvider.EXDevLauncher_guessPackagerHost),
      forClass: RCTBundleURLProvider.self
    )
  }
}

extension RCTBundleURLProvider {
  @objc
  func EXDevLauncher_guessPackagerHost() -> String? {
    // We set the packager host by hand.
    // So we don't want to guess the packager host, cause it can take a lot of time.
    return nil
  }
}
// swiftlint:enable type_name
