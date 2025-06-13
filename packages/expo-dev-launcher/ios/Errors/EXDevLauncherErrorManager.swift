// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public class EXDevLauncherErrorManager: NSObject {
  internal weak var controller: EXDevLauncherController?

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
      self?.controller?.navigateToLauncher()

      DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
        if let launcherVC = self?.controller?.currentWindow()?.rootViewController as? DevLauncherViewController {
          launcherVC.viewModel.showError(error)
        }
      }
    }
  }

}
