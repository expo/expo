import React
import Expo

public class AppDelegate: ExpoAppDelegate {
  public override func applicationDidFinishLaunching(_ notification: Notification) {
    self.moduleName = "main"
    self.initialProps = [:]

    return super.applicationDidFinishLaunching(notification)
  }

  public override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
