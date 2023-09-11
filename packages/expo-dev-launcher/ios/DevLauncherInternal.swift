import ExpoModulesCore
import EXDevMenu
import React

private let LAUNCHER_NAVIGATION_STATE_KEY = "expo.modules.devlauncher.navigation-state"
private let ON_NEW_DEEP_LINK_EVENT = "expo.modules.devlauncher.onnewdeeplink"

public class DevLauncherInternal: Module, EXDevLauncherPendingDeepLinkListener {
  public func definition() -> ModuleDefinition {
    Name("ExpoDevLauncherInternal")
    Events(ON_NEW_DEEP_LINK_EVENT)

    Constants {
      var isDevice = true
      #if targetEnvironment(simulator)
        isDevice = false
      #endif

      return [
        "clientUrlScheme": findClientUrlScheme,
        "installationID": EXDevLauncherController.sharedInstance().installationIDHelper().getOrCreateInstallationID(),
        "isDevice": isDevice,
        "updatesConfig": EXDevLauncherController.sharedInstance().getUpdatesConfig()
      ]
    }

    OnStartObserving {
      EXDevLauncherController.sharedInstance().pendingDeepLinkRegistry.subscribe(self)
    }

    OnStopObserving {
      EXDevLauncherController.sharedInstance().pendingDeepLinkRegistry.unsubscribe(self)
    }

    AsyncFunction("getPendingDeepLink") {
      return EXDevLauncherController.sharedInstance().pendingDeepLinkRegistry.pendingDeepLink?.absoluteString
    }

    AsyncFunction("getCrashReport") {
      return EXDevLauncherErrorRegistry().consumeException()?.toDict()
    }

    AsyncFunction("loadApp") { (urlString: String, promise: Promise) in
      guard let url = sanitizeUrlString(urlString) else {
        throw InvalidURLException()
      }
      let controller = EXDevLauncherController.sharedInstance()

      controller.loadApp(url, onSuccess: { promise.resolve(nil) }, onError: { error in
        promise.reject(CannotLoadAppException(error.localizedDescription))
      })
    }

    AsyncFunction("getRecentlyOpenedApps") {
      return EXDevLauncherController.sharedInstance().recentlyOpenedAppsRegistry.recentlyOpenedApps()
    }

    AsyncFunction("clearRecentlyOpenedApps") {
      EXDevLauncherController.sharedInstance().clearRecentlyOpenedApps()
    }

    AsyncFunction("getBuildInfo") {
      return EXDevLauncherController.sharedInstance().getBuildInfo()
    }

    AsyncFunction("copyToClipboard") { (content: String) in
      EXDevLauncherController.sharedInstance().copy(toClipboard: content)
    }

    AsyncFunction("loadFontsAsync") {
      DevMenuManager.shared.loadFonts()
    }

    AsyncFunction("saveNavigationState") { (serializedNavigationState: String) in
      UserDefaults.standard.set(serializedNavigationState, forKey: LAUNCHER_NAVIGATION_STATE_KEY)
    }

    AsyncFunction("getNavigationState") {
      return UserDefaults.standard.string(forKey: LAUNCHER_NAVIGATION_STATE_KEY) ?? ""
    }

    AsyncFunction("clearNavigationState") {
      UserDefaults.standard.removeObject(forKey: LAUNCHER_NAVIGATION_STATE_KEY)
    }

    AsyncFunction("loadUpdate") { (updateUrlString: String, projectUrlString: String, promise: Promise) in
      guard let updatesUrl = sanitizeUrlString(updateUrlString) else {
        throw InvalidURLException()
      }
      let controller = EXDevLauncherController.sharedInstance()
      let projectUrl = sanitizeUrlString(projectUrlString)

      controller.loadApp(updatesUrl, withProjectUrl: projectUrl, onSuccess: { promise.resolve(nil) }, onError: { error in
        promise.reject(CannotLoadAppException(error.localizedDescription))
      })
    }
  }

  public func onNewPendingDeepLink(_ deepLink: URL) {
    sendEvent(ON_NEW_DEEP_LINK_EVENT, ["url": deepLink.absoluteString])
  }
}

private func sanitizeUrlString(_ urlString: String) -> URL? {
  var sanitizedUrl = urlString.trimmingCharacters(in: .whitespacesAndNewlines)
  // If the url does contain a scheme use "http://"
  if !sanitizedUrl.contains("://") {
    sanitizedUrl = "http://" + sanitizedUrl
  }

  return URL(string: sanitizedUrl)
}

private func findClientUrlScheme() -> String? {
  guard let urlTypes = Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes") as? [[String: Any]] else {
    return nil
  }

  var clientUrlScheme: String?

  for urlType in urlTypes {
    guard let urlSchemes = urlType["CFBundleURLSchemes"] as? [String] else {
      continue
    }

    for urlScheme in urlSchemes {
      // Find a scheme with a prefix or fall back to the first scheme defined.
      if urlScheme.hasPrefix("exp+") || clientUrlScheme == nil {
        clientUrlScheme = urlScheme
      }
    }
  }

  return clientUrlScheme
}
