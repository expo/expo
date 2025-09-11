// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import SwiftUI
import UIKit

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
    if let launcherVC = controller?.currentWindow()?.rootViewController as? DevLauncherViewController {
      DispatchQueue.main.async {
        launcherVC.viewModel.showError(error)
      }
      return
    }

    DispatchQueue.main.async { [weak self] in
      guard let window = self?.controller?.currentWindow(),
        let rootVC = window.rootViewController else {
        return
      }

      self?.dismissCurrentErrorView()

      let errorView = ErrorView(
        error: error,
        onReload: {
          self?.dismissCurrentErrorView()
          guard let appUrl = self?.controller?.appManifestURLWithFallback() else {
            return
          }
          self?.controller?.loadApp(appUrl, onSuccess: nil, onError: nil)
        },
        onGoHome: {
          self?.dismissCurrentErrorView()
          self?.controller?.navigateToLauncher()
        }
      )

      let hostingController = UIHostingController(rootView: errorView)
      self?.currentErrorViewController = hostingController

      rootVC.addChild(hostingController)
      hostingController.view.frame = rootVC.view.bounds
      hostingController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      rootVC.view.addSubview(hostingController.view)
      hostingController.didMove(toParent: rootVC)
    }
  }

  private func dismissCurrentErrorView() {
    guard let vc = currentErrorViewController else {
      return
    }

    vc.willMove(toParent: nil)
    vc.view.removeFromSuperview()
    vc.removeFromParent()
    currentErrorViewController = nil
  }
}
