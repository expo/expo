// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI

@objcMembers
final class PerfMonitorHostingController: UIHostingController<PerfMonitorView> {
  var contentSizeDidChange: ((NSValue) -> Void)?

  init(viewModel: PerfMonitorViewModel) {
    super.init(rootView: PerfMonitorView(viewModel: viewModel))
    configure()
  }

  @available(*, unavailable)
  required init?(coder aDecoder: NSCoder) {
    fatalError("Not implemented")
  }

  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    notifySizeChange()
  }

  private func configure() {
    view.backgroundColor = .clear
    notifySizeChange()
  }

  private func notifySizeChange() {
    let size = preferredContentSize == .zero ? view.intrinsicContentSize : preferredContentSize
    guard size != .zero else {
      return
    }
    contentSizeDidChange?(NSValue(cgSize: size))
  }
}
