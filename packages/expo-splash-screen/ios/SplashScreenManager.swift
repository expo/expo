import React
import UIKit
import ExpoModulesCore

public class SplashScreenManager: NSObject {
  @objc public static let shared = SplashScreenManager()
  private var loadingView: UIView?
  private var rootView: UIView?
  private var options = SplashScreenOptions()
  public var preventAutoHideCalled = false

  private override init() {}

  public func initWith(_ rootView: UIView) {
    if RCTRunningInAppExtension() {
      return
    }

    self.rootView = rootView
    if let vc = UIStoryboard(name: "SplashScreen", bundle: nil).instantiateInitialViewController() {
      loadingView = vc.view
      loadingView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]

      if let bounds = self.rootView?.bounds {
        loadingView?.frame = bounds
        loadingView?.center = CGPoint(x: bounds.midX, y: bounds.midY)
      }
      loadingView?.isHidden = false
#if RCT_NEW_ARCH_ENABLED
      if let hostView = rootView as? RCTSurfaceHostingProxyRootView, let loadingView {
        hostView.disableActivityIndicatorAutoHide(true)
        hostView.loadingView = loadingView
      }
#else
      if let loadingView {
        self.rootView?.addSubview(loadingView)
      }
#endif
    }

    NotificationCenter.default.addObserver(self, selector: #selector(onAppReady), name: Notification.Name("RCTContentDidAppearNotification"), object: nil)
  }

  @objc private func onAppReady() {
    if !preventAutoHideCalled {
      hide()
    }
  }

  func hide() {
    if RCTRunningInAppExtension() {
      return
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

  func setOptions(options: SplashScreenOptions) {
    self.options = options
  }

  private func isLoadingViewVisible() -> Bool {
    guard let loadingView else {
      return false
    }

    return !loadingView.isHidden
  }

  func removeObservers() {
    NotificationCenter.default.removeObserver(self, name: Notification.Name("RCTContentDidAppearNotification"), object: nil)
    NotificationCenter.default.removeObserver(self, name: Notification.Name.RCTJavaScriptDidLoad, object: nil)
  }
}
