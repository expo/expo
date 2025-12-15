#if os(iOS) || os(tvOS)
import UIKit

public class ReloadScreenManager: Reloadable {
  private var currentConfiguration: ReloadScreenConfiguration?
  private var currentReloadScreen: ReloadScreenView?
  private var overlayWindow: UIWindow?
  private var isShowing = false

  init() {
    NotificationCenter.default.addObserver(self, selector: #selector(hide), name: Notification.Name("RCTContentDidAppearNotification"), object: nil)
  }

  public func setConfiguration(_ options: ReloadScreenOptions?) {
    currentConfiguration = ReloadScreenConfiguration(options: options)
  }

  public func show() {
    if isShowing {
      return
    }

    do {
      try showReloadScreen()
      isShowing = true
    } catch {
      isShowing = false
    }
  }

  @objc
  public func hide() {
    if !isShowing {
      return
    }

    hideReloadScreen()
    isShowing = false
  }

  private func showReloadScreen() throws {
    let config = currentConfiguration ?? ReloadScreenConfiguration(options: nil)

    if let windowScene = UIApplication.shared.connectedScenes
      .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
      overlayWindow = UIWindow(windowScene: windowScene)
    } else {
      overlayWindow = UIWindow(frame: UIScreen.main.bounds)
    }

    guard let window = overlayWindow else {
      throw ReloadOverlayException()
    }

    window.windowLevel = UIWindow.Level.alert + 1
    window.backgroundColor = UIColor.clear
    window.isHidden = false

    let reloadScreenView = ReloadScreenView(frame: window.bounds)
    reloadScreenView.updateConfiguration(config)

    let viewController = UIViewController()
    viewController.view = reloadScreenView

    window.rootViewController = viewController
    window.makeKeyAndVisible()

    currentReloadScreen = reloadScreenView
  }

  private func hideReloadScreen() {
    guard let window = overlayWindow else {
      return
    }

    let config = currentConfiguration ?? ReloadScreenConfiguration(options: nil)

    if config.fade {
      UIView.animate(withDuration: 0.3) {
        window.alpha = 0.0
      } completion: { _ in
        window.isHidden = true
        window.rootViewController = nil
        self.overlayWindow = nil
        self.currentReloadScreen = nil
      }
    } else {
      window.isHidden = true
      window.rootViewController = nil
      overlayWindow = nil
      currentReloadScreen = nil
    }
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }
}
#else
typealias ReloadScreenManager = ReloadScreenManagerMacOS
#endif
