//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI
import WebKit

struct LearnTabView: View {
  var body: some View {
    DocsWebView(url: URL(string: "https://docs.expo.dev")!)
      .ignoresSafeArea(edges: .bottom)
      .navigationBarHidden(true)
  }
}

struct DocsWebView: UIViewRepresentable {
  let url: URL

  func makeCoordinator() -> Coordinator {
    Coordinator()
  }

  func makeUIView(context: Context) -> WKWebView {
    let configuration = WKWebViewConfiguration()
    configuration.allowsInlineMediaPlayback = true
    configuration.mediaTypesRequiringUserActionForPlayback = .all

    let webView = WKWebView(frame: .zero, configuration: configuration)
    webView.navigationDelegate = context.coordinator
    webView.load(URLRequest(url: url))
    return webView
  }

  func updateUIView(_ webView: WKWebView, context: Context) {
  }

  class Coordinator: NSObject, WKNavigationDelegate {
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
      guard let url = navigationAction.request.url, let host = url.host?.lowercased() else {
        decisionHandler(.cancel)
        return
      }

      if host == "expo.dev" || host.hasSuffix(".expo.dev") {
        decisionHandler(.allow)
      } else {
        decisionHandler(.cancel)
      }
    }
  }
}
