// Copyright 2022-present 650 Industries. All rights reserved.

import SafariServices
import ExpoModulesCore

internal class WebBrowserSession: NSObject, SFSafariViewControllerDelegate, UIAdaptivePresentationControllerDelegate {
  let viewController: SFSafariViewController
  let onDismiss: (String) -> Void

  init(url: URL, options: WebBrowserOptions, onDismiss: @escaping (String) -> Void) {
    self.onDismiss = onDismiss

    let configuration = SFSafariViewController.Configuration()
    configuration.barCollapsingEnabled = options.enableBarCollapsing
    configuration.entersReaderIfAvailable = options.readerMode

    viewController = SFSafariViewController(url: url, configuration: configuration)
    viewController.modalPresentationStyle = options.presentationStyle.toPresentationStyle()
    viewController.dismissButtonStyle = options.dismissButtonStyle.toSafariDismissButtonStyle()
    viewController.preferredBarTintColor = options.toolbarColor
    viewController.preferredControlTintColor = options.controlsColor

    super.init()
    viewController.delegate = self
    viewController.presentationController?.delegate = self
  }

  func open() {
    var currentViewController = UIApplication.shared.keyWindow?.rootViewController
    while currentViewController?.presentedViewController != nil {
      currentViewController = currentViewController?.presentedViewController
    }
    currentViewController?.present(viewController, animated: true, completion: nil)
  }

  func dismiss() {
    viewController.dismiss(animated: true) {
      self.finish(type: "dismiss")
    }
  }

  // MARK: - SFSafariViewControllerDelegate

  func safariViewControllerDidFinish(_ controller: SFSafariViewController) {
    finish(type: "cancel")
  }
  
  // MARK: - UIAdaptivePresentationControllerDelegate

  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    finish(type: "cancel")
  }

  // MARK: - Private

  private func finish(type: String) {
    onDismiss(type)
  }
}
