// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

#if os(iOS)
import SafariServices

internal class WebBrowserSession: NSObject, SFSafariViewControllerDelegate, UIAdaptivePresentationControllerDelegate {
  let viewController: SFSafariViewController
  let onDismiss: (String) -> Void
  let didPresent: () -> Void

  init(url: URL, options: WebBrowserOptions, onDismiss: @escaping (String) -> Void, didPresent: @escaping () -> Void) {
    self.onDismiss = onDismiss
    self.didPresent = didPresent

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
    if UIDevice.current.userInterfaceIdiom == .pad {
      let viewFrame = currentViewController?.view.frame
      viewController.popoverPresentationController?.sourceRect = CGRect(
        x: viewFrame?.midX ?? 0,
        y: viewFrame?.maxY ?? 0,
        width: 0,
        height: 0
      )
      viewController.popoverPresentationController?.sourceView = currentViewController?.view
    }

    currentViewController?.present(viewController, animated: true) {
      self.didPresent()
    }
  }

  func dismiss(completion: ((String) -> Void)? = nil) {
    viewController.dismiss(animated: true) {
      let type = "dismiss"
      self.finish(type: type)
      completion?(type)
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

#elseif os(macOS)
import AppKit
import WebKit

internal class WebBrowserSession: NSObject, WKNavigationDelegate, WKUIDelegate, NSWindowDelegate {
  private let url: URL
  private let options: WebBrowserOptions
  let onDismiss: (String) -> Void
  let didPresent: () -> Void

  private var window: NSWindow?
  private var webView: WKWebView?

  init(url: URL, options: WebBrowserOptions, onDismiss: @escaping (String) -> Void, didPresent: @escaping () -> Void) {
    self.url = url
    self.options = options
    self.onDismiss = onDismiss
    self.didPresent = didPresent
    super.init()
  }

  func open() {
    let configuration = WKWebViewConfiguration()

    let webView = WKWebView(frame: .zero, configuration: configuration)
    webView.navigationDelegate = self
    webView.uiDelegate = self
    self.webView = webView

    let window = NSWindow(
      contentRect: self.options.presentationStyle.toContentRect(),
      styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
      backing: .buffered,
      defer: false
    )

    window.contentView = webView
    window.center()
    window.isReleasedWhenClosed = false
    window.delegate = self
    self.window = window

    webView.load(URLRequest(url: url))

    window.makeKeyAndOrderFront(nil)
    didPresent()
  }

  func dismiss(completion: ((String) -> Void)? = nil) {
    window?.close()
    let type = "dismiss"
    finish(type: type)
    completion?(type)
  }

  // MARK: - WKNavigationDelegate
  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation) {
    webView.evaluateJavaScript("document.title") { [weak self] result, _ in
      if let title = result as? String, !title.isEmpty {
        self?.window?.title = title
      }
    }
  }

  // MARK: - NSWindowDelegate
  func windowWillClose(_ notification: Notification) {
    finish(type: "cancel")
  }

  // MARK: - Private
  private func finish(type: String) {
    onDismiss(type)
  }
}
#endif
