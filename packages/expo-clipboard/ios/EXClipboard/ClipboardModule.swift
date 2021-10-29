// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

let onClipboardChanged = "onClipboardChanged"

public class ClipboardModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoClipboard")

    method("getStringAsync") { () -> String in
      return UIPasteboard.general.string ?? ""
    }

    method("setString") { (content: String?) in
      UIPasteboard.general.string = content ?? ""
    }

    events(onClipboardChanged)

    onStartObserving {
      NotificationCenter.default.removeObserver(self, name: UIPasteboard.changedNotification, object: nil)
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.clipboardChangedListener),
        name: UIPasteboard.changedNotification,
        object: nil
      )
    }

    onStopObserving {
      NotificationCenter.default.removeObserver(self, name: UIPasteboard.changedNotification, object: nil)
    }
  }

  @objc
  func clipboardChangedListener() {
    sendEvent(onClipboardChanged, [
      "content": UIPasteboard.general.string ?? ""
    ])
  }
}
