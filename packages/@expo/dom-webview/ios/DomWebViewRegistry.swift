// Copyright 2015-present 650 Industries. All rights reserved.

// DispatchQueue below. CocoaPods compiles this module alongside an underlying
// ObjC module that pulls Foundation in implicitly; a SwiftPM Swift-only target
// does not, so import it explicitly.
import Foundation

private let lockQueue = DispatchQueue(label: "expo.modules.domWebView.RegistryQueue")

internal typealias WebViewId = Int

internal final class DomWebViewRegistry {
  static var shared = DomWebViewRegistry()

  private var registry: [WebViewId: WeakDomWebViewRef] = [:]
  private var nextWebViewId: WebViewId = 0

  func get(webViewId: WebViewId) -> DomWebView? {
    return lockQueue.sync {
      return self.registry[webViewId]?.ref
    }
  }

  func add(webView: DomWebView) -> WebViewId {
    return lockQueue.sync {
      let webViewId = self.nextWebViewId
      self.registry[webViewId] = WeakDomWebViewRef(ref: webView)
      self.nextWebViewId += 1
      return webViewId
    }
  }

  @discardableResult
  func remove(webViewId: WebViewId) -> DomWebView? {
    return lockQueue.sync {
      return self.registry.removeValue(forKey: webViewId)?.ref
    }
  }

  func reset() {
    lockQueue.sync {
      self.registry.removeAll()
      self.nextWebViewId = 0
    }
  }
}
