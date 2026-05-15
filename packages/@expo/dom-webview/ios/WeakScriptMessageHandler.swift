// Copyright 2015-present 650 Industries. All rights reserved.

import WebKit

/// `WKUserContentController.add(_:name:)` strongly retains its handler; route
/// through this proxy to keep the delegate weak.
internal final class WeakScriptMessageHandler: NSObject, WKScriptMessageHandler {
  private weak var delegate: WKScriptMessageHandler?

  init(delegate: WKScriptMessageHandler) {
    self.delegate = delegate
    super.init()
  }

  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    delegate?.userContentController(userContentController, didReceive: message)
  }
}
