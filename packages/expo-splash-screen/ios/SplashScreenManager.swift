import React
import UIKit

public class SplashScreenManager: NSObject {
  @objc public static let shared = SplashScreenManager()
  private var loadingView: UIView?
  private var rootView: UIView?
  private var options = SplashScreenOptions()
  private var nativeHidden = false

  private override init() {}

  public func initWithStoryboard(view: RCTRootView) {
    if RCTRunningInAppExtension() {
      return
    }

    Timer.scheduledTimer(withTimeInterval: 0.35, repeats: false) { _ in
      self.nativeHidden = true
    }

    rootView = view
    if let vc = UIStoryboard(name: "SplashScreen", bundle: nil).instantiateInitialViewController() {
      loadingView = vc.view
      loadingView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]

      if let bounds = rootView?.bounds {
        loadingView?.frame = bounds
        loadingView?.center = CGPoint(x: bounds.midX, y: bounds.midY)
      }
      loadingView?.isHidden = false
      if let loadingView {
        rootView?.addSubview(loadingView)
      }
    }
  }

  func hide() {
    if RCTRunningInAppExtension() || !nativeHidden {
      return
    }

    DispatchQueue.main.async { [self] in
      guard let rootView, isLoadingViewVisible() else {
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
}
