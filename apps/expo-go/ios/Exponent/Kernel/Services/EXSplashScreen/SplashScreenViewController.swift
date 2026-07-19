import UIKit
import Expo

@objc(EXSplashScreenViewController)
class SplashScreenViewController: NSObject {
  var splashScreenView: UIView?
  let rootView: UIView
  var autoHideEnabled: Bool
  var splashScreenShown: Bool
  var appContentAppeared: Bool

  @objc init(with rootView: UIView, splashScreenView: UIView) {
    self.rootView = rootView
    self.splashScreenView = splashScreenView
    autoHideEnabled = true
    splashScreenShown = false
    appContentAppeared = false
  }

  @objc func show(with success: (() -> Void)?, failure: ((String) -> Void)?) {
    show(with: success)
  }

  private func show(with success: (() -> Void)?) {
    splashScreenView?.frame = rootView.bounds
    if let splashScreenView {
      rootView.addSubview(splashScreenView)
    }
    splashScreenShown = true
    if let success {
      success()
    }
  }

  @objc func preventAutoHide(with success: (Bool) -> Void, failure: (String) -> Void) {
    if !autoHideEnabled {
      success(true)
      return
    }

    autoHideEnabled = false
    success(true)
  }

  @objc func hide(with success: @escaping (Bool) -> Void, failure: (String) -> Void) {
    if !splashScreenShown {
      success(false)
      return
    }

    hide(with: success)
  }

  private func hide(with success: ((Bool) -> Void)?) {
  UIView.animate(
    withDuration: 0.5,
    delay: 0.0,
    options: [.curveEaseInOut],
    animations: { [weak self] in
      self?.splashScreenView?.alpha = 0.0
    },
    completion: { [weak self] finished in
      if finished {
        self?.splashScreenView?.removeFromSuperview()
      }
    })
    splashScreenShown = false
    autoHideEnabled = true
    if let success {
      success(true)
    }
  }

  @objc func needsHideOnAppContentDidAppear() -> Bool {
    if !appContentAppeared && autoHideEnabled {
      appContentAppeared = true
      return true
    }
    return false
  }

  @objc func needsShowOnAppContentWillReload() -> Bool {
    if !appContentAppeared {
      autoHideEnabled = true
      appContentAppeared = false
      return true
    }
    return false
  }
}
