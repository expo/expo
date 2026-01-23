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

  func makeUIView(context: Context) -> WKWebView {
    let configuration = WKWebViewConfiguration()
    configuration.allowsInlineMediaPlayback = true
    configuration.mediaTypesRequiringUserActionForPlayback = .all

    let webView = WKWebView(frame: .zero, configuration: configuration)
    webView.load(URLRequest(url: url))
    return webView
  }

  func updateUIView(_ webView: WKWebView, context: Context) {
  }
}
