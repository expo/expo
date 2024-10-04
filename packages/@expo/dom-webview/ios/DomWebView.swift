// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import WebKit

internal final class DomWebView: ExpoView, UIScrollViewDelegate, WKUIDelegate, WKScriptMessageHandler {
  // swiftlint:disable implicitly_unwrapped_optional
  private(set) var webView: WKWebView!
  private(set) var id: WebViewId!
  // swiftlint:enable implicitly_unwrapped_optional

  private var source: DomWebViewSource?
  private var injectedJSBeforeContentLoaded: WKUserScript?
  var webviewDebuggingEnabled = false
  var decelerationRate: UIScrollView.DecelerationRate = .normal

  internal typealias SyncCompletionHandler = (String?) -> Void

  private var needsResetupScripts = false

  private static let EVAL_PROMPT_HEADER = "__EXPO_DOM_WEBVIEW_JS_EVAL__"
  private static let POST_MESSAGE_HANDLER_NAME = "ReactNativeWebView"

  private let onMessage = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    super.backgroundColor = .clear
    self.id = DomWebViewRegistry.shared.add(webView: self)
    webView = createWebView()
    resetupScripts()
    addSubview(webView)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    webView.frame = bounds
  }

  override var backgroundColor: UIColor? {
    get { webView.backgroundColor }
    set {
      let isOpaque = (newValue ?? UIColor.clear).cgColor.alpha == 1.0
      self.isOpaque = isOpaque
      webView.isOpaque = isOpaque
      webView.scrollView.backgroundColor = newValue
      webView.backgroundColor = newValue
    }
  }

  override func removeFromSuperview() {
    webView.removeFromSuperview()
    webView = nil
    DomWebViewRegistry.shared.remove(webViewId: self.id)
    super.removeFromSuperview()
  }

  // MARK: - Public methods

  func reload() {
    if #available(iOS 16.4, *) {
      webView.isInspectable = webviewDebuggingEnabled
    }

    if needsResetupScripts {
      resetupScripts()
      needsResetupScripts = false
    }

    if let source,
      let request = RCTConvert.nsurlRequest(source.toDictionary(appContext: appContext)),
      webView.url?.absoluteURL != request.url {
      webView.load(request)
    }
  }

  func scrollTo(offset: CGPoint, animated: Bool) {
    webView.scrollView.setContentOffset(offset, animated: animated)
  }

  func injectJavaScript(_ script: String) {
    DispatchQueue.main.async { [weak self] in
      self?.webView.evaluateJavaScript(script)
    }
  }

  func setSource(_ source: DomWebViewSource) {
    self.source = source
  }

  func setInjectedJSBeforeContentLoaded(_ script: String?) {
    if let script, !script.isEmpty {
      injectedJSBeforeContentLoaded = WKUserScript(source: script, injectionTime: .atDocumentStart, forMainFrameOnly: false)
    } else {
      injectedJSBeforeContentLoaded = nil
    }
    needsResetupScripts = true
  }

  // MARK: - UIScrollViewDelegate implementations

  func scrollViewWillBeginDragging(_ scrollView: UIScrollView) {
    scrollView.decelerationRate = decelerationRate
  }

  // MARK: - WKUIDelegate implementations

  func webView(
    _ webView: WKWebView,
    runJavaScriptTextInputPanelWithPrompt prompt: String,
    defaultText: String?,
    initiatedByFrame frame: WKFrameInfo,
    completionHandler: @escaping SyncCompletionHandler
  ) {
    if !prompt.hasPrefix(Self.EVAL_PROMPT_HEADER) {
      completionHandler(nil)
      return
    }
    let script = String(prompt.dropFirst(Self.EVAL_PROMPT_HEADER.count))
    if let data = script.data(using: .utf8),
      let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
      let deferredId = json["deferredId"] as? Int,
      let source = json["source"] as? String {
      nativeJsiEvalSync(deferredId: deferredId, source: source, completionHandler: completionHandler)
    } else {
      completionHandler("Invalid parameters for nativeJsiEvalSync")
    }
  }

  // MARK: - WKScriptMessageHandler implementations

  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    if message.name == Self.POST_MESSAGE_HANDLER_NAME {
      var payload = createBaseEventPayload()
      payload["data"] = message.body
      onMessage(payload)
      return
    }
  }

  // MARK: - Internals

  private func createWebView() -> WKWebView {
    let config = WKWebViewConfiguration()
    config.userContentController = WKUserContentController()
    let webView = WKWebView(frame: .zero, configuration: config)
    webView.uiDelegate = self
    webView.backgroundColor = .clear
    webView.scrollView.delegate = self
    return webView
  }

  private func createBaseEventPayload() -> [String: Any] {
    return [
      "url": webView.url?.absoluteString ?? "",
      "title": webView.title ?? ""
    ]
  }

  private func resetupScripts() {
    let userContentController = webView.configuration.userContentController
    userContentController.removeAllUserScripts()
    userContentController.removeAllScriptMessageHandlers()

    userContentController.add(self, name: Self.POST_MESSAGE_HANDLER_NAME)

    if let injectedJSBeforeContentLoaded {
      userContentController.addUserScript(injectedJSBeforeContentLoaded)
    }

    let addDomWebViewBridgeScript = """
    window.ExpoDomWebViewBridge = {
      eval: function eval(params) {
        return window.prompt('\(Self.EVAL_PROMPT_HEADER)' + params);
      },
    };
    true;
    """
    userContentController.addUserScript(WKUserScript(source: addDomWebViewBridgeScript, injectionTime: .atDocumentStart, forMainFrameOnly: false))

    let addRNWObjectScript = """
    window.ReactNativeWebView ||= {};
    window.ReactNativeWebView.postMessage = function postMessage(data) {
      window.webkit.messageHandlers.\(Self.POST_MESSAGE_HANDLER_NAME).postMessage(String(data));
    };
    true;
    """
    userContentController.addUserScript(WKUserScript(source: addRNWObjectScript, injectionTime: .atDocumentStart, forMainFrameOnly: false))

    guard let webViewId = self.id else {
      return
    }

    let addExpoDomWebViewObjectScript = "\(INSTALL_GLOBALS_SCRIPT);true;"
      .replacingOccurrences(of: "\"%%WEBVIEW_ID%%\"", with: String(webViewId))
    userContentController.addUserScript(WKUserScript(source: addExpoDomWebViewObjectScript, injectionTime: .atDocumentStart, forMainFrameOnly: false))
  }

  private func nativeJsiEvalSync(deferredId: Int, source: String, completionHandler: @escaping SyncCompletionHandler) {
    guard let appContext else {
      completionHandler("Missing AppContext")
      return
    }
    guard let webViewId = self.id else {
      completionHandler("Missing webViewId")
      return
    }
    guard let runtime = try? appContext.runtime else {
      completionHandler("Missing JS Runtime")
      return
    }
    appContext.executeOnJavaScriptThread {
      let wrappedSource = NATIVE_EVAL_WRAPPER_SCRIPT
        .replacingOccurrences(of: "\"%%DEFERRED_ID%%\"", with: String(deferredId))
        .replacingOccurrences(of: "\"%%WEBVIEW_ID%%\"", with: String(webViewId))
        .replacingOccurrences(of: "\"%%SOURCE%%\"", with: source)
      do {
        let result = try runtime.eval(wrappedSource)
        completionHandler(result.getString())
      } catch {
        completionHandler("\(error)")
      }
    }
  }
}
