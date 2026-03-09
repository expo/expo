// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import SwiftUI
import ExpoModulesCore


@objc
public class EXDevLauncherErrorManager: NSObject {
  internal weak var controller: EXDevLauncherController?
  private var currentErrorViewController: UIHostingController<ErrorView>?

  @objc
  public init(controller: EXDevLauncherController) {
    self.controller = controller
    EXDevLauncherRedBoxInterceptor.isInstalled = true
  }

  @objc
  public func showError(_ error: EXDevLauncherAppError) {
#if !os(macOS)
    let launcherVC = controller?.currentWindow()?.rootViewController
#else
    let launcherVC = controller?.currentWindow()?.contentViewController
#endif
    if let launcherVC = launcherVC as? DevLauncherViewController {
      DispatchQueue.main.async {
        launcherVC.viewModel.showError(error)
      }
      return
    }

    DispatchQueue.main.async { [weak self] in
#if !os(macOS)
      guard let window = self?.controller?.currentWindow(),
        let rootVC = window.rootViewController else {
        return
      }
#else
      guard let window = self?.controller?.currentWindow(),
        let rootVC = window.contentViewController else {
        return
      }
#endif

      self?.dismissCurrentErrorView()

      let errorView = ErrorView(
        error: error,
        onReload: { [weak self] in
          guard let self else { return }
          self.dismissCurrentErrorView()
          guard let appUrl = self.controller?.appManifestURLWithFallback() else {
            self.controller?.navigateToLauncher()
            return
          }
          self.controller?.loadApp(appUrl, onSuccess: nil, onError: nil)
        },
        onGoHome: { [weak self] in
          guard let self else { return }
          self.dismissCurrentErrorView()
          self.controller?.navigateToLauncher()
        }
      )

      let hostingController = UIHostingController(rootView: errorView)
      self?.currentErrorViewController = hostingController

      rootVC.addChild(hostingController)
      hostingController.view.frame = rootVC.view.bounds
#if !os(macOS)
      hostingController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
#else
      hostingController.view.autoresizingMask = [.width, .height]
#endif
      rootVC.view.addSubview(hostingController.view)
#if !os(macOS)
      hostingController.didMove(toParent: rootVC)
#endif
    }
  }

  private func dismissCurrentErrorView() {
    guard let vc = currentErrorViewController else {
      return
    }

#if !os(macOS)
    vc.willMove(toParent: nil)
#endif
    vc.view.removeFromSuperview()
    vc.removeFromParent()
    currentErrorViewController = nil
  }
}
