import UIKit

@objc(EXManagedAppSplashScreenViewController)
class ManagedSplashScreenViewController: SplashScreenViewController {
  var warningTimer: Timer?
  let warningHud = EXProgressHUD()

  @objc override init(with rootView: UIView, splashScreenView: UIView) {
    super.init(with: rootView, splashScreenView: splashScreenView)
    self.splashScreenView?.isUserInteractionEnabled = false
  }

  override func hide(with success: @escaping (Bool) -> Void, failure: (String) -> Void) {
    super.hide(with: { [weak self] _ in
      if let warningTimer = self?.warningTimer {
        warningTimer.invalidate()
      }

      success(true)
    }, failure: failure)
  }

  @objc func startSplashScreenVisibleTimer() {
    warningTimer = Timer(timeInterval: 20.0, target: self, selector: #selector(showSplashScreenVisibleWarning), userInfo: nil, repeats: false)
  }

  @objc func showSplashScreenVisibleWarning() {
#if DEBUG
    warningHud.showWarning(splashScreenView)
#endif
  }
}
