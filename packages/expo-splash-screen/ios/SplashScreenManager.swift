import ExpoModulesCore
internal import React
import UIKit

class SplashScreenManager: NSObject, RCTReloadListener {
  @objc static let shared = SplashScreenManager()
  private var loadingView: UIView?
  private var rootView: UIView?
  private var options = SplashScreenOptions()
  var preventAutoHideCalled = false
  private var launchScreenCaptured = false

  private override init() {}

  func initWith(_ rootView: UIView) {
    if RCTRunningInAppExtension() {
      return
    }

    self.rootView = rootView
    SplashScreenPrerender.shared().setAppRootView(rootView)
    if !SplashScreenPrerender.shared().isEnabled {
      showSplashScreen()
    }
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(onAppReady),
      name: Notification.Name("RCTContentDidAppearNotification"),
      object: nil
    )
  }

  @objc private func onAppReady(_ notification: Notification) {
    // The prerender surface posts this notification too; only the app's surface counts.
    if let view = notification.object as? UIView, SplashScreenPrerender.shared().isPrerenderRootView(view) {
      return
    }
    if !preventAutoHideCalled {
      hide()
    }
  }

  func hide() {
    if RCTRunningInAppExtension() {
      return
    }

    let prerender = SplashScreenPrerender.shared()
    let fadeDuration = options.fade ? options.duration / 1000 : 0
    prerender.dismiss(withFadeDuration: fadeDuration)
    if prerender.isEnabled && !launchScreenCaptured {
      // The screen that replaces the splash is, by definition, the one to prerender next time.
      // Capture it once it has settled behind the fade.
      launchScreenCaptured = true
      prerender.captureLaunchScreen(afterDelay: fadeDuration + 0.25)
    }
    DispatchQueue.main.async { [weak self] in
      guard let self, let rootView, isLoadingViewVisible() else {
        return
      }
      let duration = options.duration / 1000
      if options.fade {
        UIView.transition(with: rootView, duration: duration, options: .transitionCrossDissolve) {
          self.loadingView?.isHidden = true
        } completion: { _ in
          self.loadingView?.removeFromSuperview()
          self.loadingView = nil
        }
      } else {
        loadingView?.isHidden = true
        loadingView?.removeFromSuperview()
        loadingView = nil
      }
    }
  }

  func saveLaunchScreen() -> Bool {
    return SplashScreenPrerender.shared().saveLaunchScreen()
  }

  func clearLaunchScreen() {
    SplashScreenPrerender.shared().clearLaunchScreen()
  }

  func setOptions(options: SplashScreenOptions) {
    self.options = options
  }

  private func showSplashScreen() {
    let splashScreenFilename =
      Bundle.main.object(forInfoDictionaryKey: "UILaunchStoryboardName") as? String ?? "SplashScreen"
    // Prevents crashes in brownfield apps where the splash screen storyboard may not be present.
    guard Bundle.main.path(forResource: splashScreenFilename, ofType: "storyboardc") != nil else {
      return
    }

    if let vc = UIStoryboard(name: splashScreenFilename, bundle: nil).instantiateInitialViewController() {
      loadingView = vc.view
      loadingView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]

      if let bounds = self.rootView?.bounds {
        loadingView?.frame = bounds
        loadingView?.center = CGPoint(x: bounds.midX, y: bounds.midY)
      }
      loadingView?.isHidden = false
      if let hostView = rootView as? RCTSurfaceHostingProxyRootView, let loadingView {
        hostView.disableActivityIndicatorAutoHide(true)
        hostView.loadingView = loadingView
      }
    }
  }

  func didReceiveReloadCommand() {
    showSplashScreen()
  }

  private func isLoadingViewVisible() -> Bool {
    guard let loadingView else {
      return false
    }

    return !loadingView.isHidden
  }

  func removeObservers() {
    NotificationCenter.default.removeObserver(
      self,
      name: Notification.Name("RCTContentDidAppearNotification"),
      object: nil
    )
  }
}
