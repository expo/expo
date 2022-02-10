// Copyright 2022-present 650 Industries. All rights reserved.

import SafariServices
import ExpoModulesCore

internal class WebBrowserSession: NSObject, SFSafariViewControllerDelegate {
  let viewController: SFSafariViewController
  var promise: Promise?
  var isOpen: Bool {
    promise != nil
  }

  init(url: URL, options: WebBrowserOptions) {
    let configuration = SFSafariViewController.Configuration()
    configuration.barCollapsingEnabled = options.enableBarCollapsing
    configuration.entersReaderIfAvailable = options.readerMode

    viewController = SFSafariViewController(url: url, configuration: configuration)
    viewController.dismissButtonStyle = options.dismissButtonStyle.toSafariDismissButtonStyle()
    viewController.preferredBarTintColor = options.toolbarColor
    viewController.preferredControlTintColor = options.controlsColor

    super.init()
    viewController.delegate = self

    // By setting the modal presentation style to OverFullScreen, we disable the "Swipe to dismiss"
    // gesture that is causing a bug where sometimes `safariViewControllerDidFinish` is not called.
    // There are bugs filed already about it on OpenRadar.
    viewController.modalPresentationStyle = .overFullScreen
  }

  func open(_ promise: Promise) {
    var currentViewController = UIApplication.shared.keyWindow?.rootViewController
    while currentViewController?.presentedViewController != nil {
      currentViewController = currentViewController?.presentedViewController
    }
    currentViewController?.present(viewController, animated: true, completion: nil)

    self.promise = promise
  }

  func dismiss() {
    viewController.dismiss(animated: true) { [weak self] in
      self?.finish(type: "dismiss")
    }
  }

  // MARK: - SFSafariViewControllerDelegate

  func safariViewControllerDidFinish(_ controller: SFSafariViewController) {
    finish(type: "cancel")
  }

  // MARK: - Private

  private func finish(type: String) {
    promise?.resolve(["type": type])
    promise = nil
  }
}
