// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import UIKit

@objc(EXErrorViewDelegate)
protocol ErrorViewDelegate: AnyObject {
  @objc(errorViewDidSelectRetry:)
  func errorViewDidSelectRetry(_ errorView: KernelErrorView)
}

@objc(EXErrorView)
final class KernelErrorView: UIView {
  @objc var type: FatalErrorType = .loading {
    didSet { render() }
  }
  @objc var error: NSError? {
    didSet {
      render()
      if error !== oldValue {
        reportToDevServer()
      }
    }
  }
  @objc var appRecord: EXKernelAppRecord? {
    didSet { render() }
  }
  @objc weak var delegate: ErrorViewDelegate?

  private var hostingController: UIHostingController<ErrorScreenView>?

  override init(frame: CGRect) {
    super.init(frame: frame)
    backgroundColor = UIColor(named: "backgroundDefault")
    let hostingController = UIHostingController(rootView: makeScreen())
    hostingController.view.backgroundColor = .clear
    hostingController.view.translatesAutoresizingMaskIntoConstraints = false
    addSubview(hostingController.view)
    NSLayoutConstraint.activate([
      hostingController.view.leadingAnchor.constraint(equalTo: leadingAnchor),
      hostingController.view.trailingAnchor.constraint(equalTo: trailingAnchor),
      hostingController.view.topAnchor.constraint(equalTo: topAnchor),
      hostingController.view.bottomAnchor.constraint(equalTo: bottomAnchor)
    ])
    self.hostingController = hostingController
  }

  required init?(coder: NSCoder) {
    return nil
  }

  private var content: ErrorScreenContent {
    ErrorScreenContent.make(
      error: error,
      type: type,
      manifestName: appRecord?.appLoader.manifest?.name(),
      manifestUrl: appRecord?.appLoader.manifestUrl.absoluteString,
      header: error.flatMap { EXManifestResource.formatHeader($0) }
    )
  }

  private func makeScreen() -> ErrorScreenView {
    let mismatchUsername = error?.userInfo[EXAccountMismatchUsernameKey] as? String
    return ErrorScreenView(
      content: content,
      onRetry: { [weak self] in
        guard let self else { return }
        self.delegate?.errorViewDidSelectRetry(self)
      },
      onGoHome: {
        EXKernel.sharedInstance().browserController?.moveHomeToVisible()
      },
      accountActionTitle: mismatchUsername.flatMap { ExpoGoHomeBridge.shared.accountMismatchActionTitle(forUsername: $0) },
      onAccountAction: { [weak self] in
        guard let mismatchUsername else { return }
        Task { @MainActor in
          guard let self,
                await ExpoGoHomeBridge.shared.resolveAccountMismatch(forUsername: mismatchUsername, from: self.presentingViewController) else {
            return
          }
          self.delegate?.errorViewDidSelectRetry(self)
        }
      }
    )
  }

  private var presentingViewController: UIViewController? {
    sequence(first: self as UIResponder, next: { $0.next }).first { $0 is UIViewController } as? UIViewController
  }

  private func render() {
    hostingController?.rootView = makeScreen()
  }

  private func reportToDevServer() {
    let content = self.content
    guard let manifestUrl = appRecord?.appLoader.manifestUrl,
          let message = ErrorScreenLogMessage.make(
            header: content.header,
            detail: content.detail,
            fixInstructions: content.fixInstructions
          ) else {
      return
    }
    EXPackagerLogHelper.logError(message, withBundleUrl: manifestUrl)
  }
}
