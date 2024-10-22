import React
import UIKit

public class SplashScreenManager: NSObject {
  @objc public static let shared = SplashScreenManager()
  private var loadingView: UIView?
  private var rootView: UIView?
  private var options = SplashScreenOptions()

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
      if let loadingView {
        self.rootView?.addSubview(loadingView)
      }
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
}
