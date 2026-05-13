// Copyright 2015-present 650 Industries. All rights reserved.

internal import React
import ExpoModulesCore
import WebKit

internal final class DomWebView: ExpoView, UIScrollViewDelegate, WKUIDelegate, WKNavigationDelegate, WKScriptMessageHandler, RCTAutoInsetsProtocol {
  // Created on first prop sync — `WKWebViewConfiguration` is copied at init,
  // so init-only props need to land before `WKWebView()` is called.
  private(set) var webView: WKWebView?
  // swiftlint:disable:next implicitly_unwrapped_optional
  private(set) var id: WebViewId!

  private var source: DomWebViewSource?
  private var injectedJS: WKUserScript?
  private var injectedJSBeforeContentLoaded: WKUserScript?
  private var injectedObjectJsonScript: WKUserScript?
  private var needsResetupScripts = false

  // MARK: - WKWebViewConfiguration props (init-only)

  var allowsInlineMediaPlayback: Bool = true
  var mediaPlaybackRequiresUserAction: Bool = true
  var allowsPictureInPictureMediaPlayback: Bool = true
  var allowsAirPlayForMediaPlayback: Bool = true

  // MARK: - Bridge props

  var useExpoModulesBridge: Bool = false {
    didSet { needsResetupScripts = true }
  }

  // MARK: - WKWebView / UIScrollView props (mutable post-creation)

  var webviewDebuggingEnabled: Bool = false {
    didSet {
      if #available(iOS 16.4, *) {
        webView?.isInspectable = webviewDebuggingEnabled
      }
    }
  }

  var decelerationRate: UIScrollView.DecelerationRate = .normal

  var bounces: Bool = true {
    didSet { webView?.scrollView.bounces = bounces }
  }
  var scrollEnabled: Bool = true {
    didSet { webView?.scrollView.isScrollEnabled = scrollEnabled }
  }
  var pagingEnabled: Bool = false {
    didSet { webView?.scrollView.isPagingEnabled = pagingEnabled }
  }
  var directionalLockEnabled: Bool = true {
    didSet { webView?.scrollView.isDirectionalLockEnabled = directionalLockEnabled }
  }
  var showsHorizontalScrollIndicator: Bool = true {
    didSet { webView?.scrollView.showsHorizontalScrollIndicator = showsHorizontalScrollIndicator }
  }
  var showsVerticalScrollIndicator: Bool = true {
    didSet { webView?.scrollView.showsVerticalScrollIndicator = showsVerticalScrollIndicator }
  }
  var automaticallyAdjustsScrollIndicatorInsets: Bool = true {
    didSet {
      webView?.scrollView.automaticallyAdjustsScrollIndicatorInsets = automaticallyAdjustsScrollIndicatorInsets
    }
  }
  var contentInsetAdjustmentBehavior: UIScrollView.ContentInsetAdjustmentBehavior = .automatic {
    didSet {
      // Preserve contentOffset so safe-area re-application doesn't jump the page.
      guard let scrollView = webView?.scrollView else { return }
      let contentOffset = scrollView.contentOffset
      scrollView.contentInsetAdjustmentBehavior = contentInsetAdjustmentBehavior
      scrollView.contentOffset = contentOffset
    }
  }

  // MARK: - RCTAutoInsetsProtocol storage

  @objc var contentInset: UIEdgeInsets = .zero {
    didSet { refreshContentInset() }
  }
  @objc var automaticallyAdjustContentInsets: Bool = true {
    didSet { refreshContentInset() }
  }

  internal typealias SyncCompletionHandler = (String?) -> Void

  private static let EVAL_PROMPT_HEADER = "__EXPO_DOM_WEBVIEW_JS_EVAL__"
  private static let POST_MESSAGE_HANDLER_NAME = "ReactNativeWebView"

  private let onMessage = EventDispatcher()
  private let onContentProcessDidTerminate = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    super.backgroundColor = .clear
    self.id = DomWebViewRegistry.shared.add(webView: self)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    webView?.frame = bounds
  }

  override var backgroundColor: UIColor? {
    didSet { applyBackgroundColor() }
  }

  private func applyBackgroundColor() {
    let color = backgroundColor
    self.isOpaque = (color ?? UIColor.clear).cgColor.alpha == 1.0
    webView?.isOpaque = self.isOpaque
    webView?.scrollView.backgroundColor = color
    webView?.backgroundColor = color
  }

  deinit {
    webView?.uiDelegate = nil
    webView?.navigationDelegate = nil
    webView?.scrollView.delegate = nil
    webView?.configuration.userContentController.removeAllScriptMessageHandlers()
    DomWebViewRegistry.shared.remove(webViewId: self.id)
  }

  // MARK: - Public methods

  func reload() {
    if webView == nil {
      setupWebView()
    }

    let scriptsChanged = needsResetupScripts
    if needsResetupScripts {
      resetupScripts()
      needsResetupScripts = false
    }

    if let source,
      let request = RCTConvert.nsurlRequest(source.toDictionary(appContext: appContext)),
      webView?.url?.absoluteURL != request.url {
      load(request: request)
    } else if scriptsChanged, webView?.url != nil {
      // User scripts only run at .atDocumentStart; reload to pick up the new ones.
      webView?.reload()
    }
  }

  func forceReload() {
    if webView?.url != nil {
      webView?.reload()
      return
    }
    guard let source,
      let request = RCTConvert.nsurlRequest(source.toDictionary(appContext: appContext)) else {
      return
    }
    if webView == nil {
      setupWebView()
    }
    load(request: request)
  }

  private func load(request: URLRequest) {
    if let url = request.url, url.isFileURL {
      // Grant read access to the bundle so DOM components can load sibling assets.
      webView?.loadFileURL(url, allowingReadAccessTo: URL(fileURLWithPath: "/"))
    } else {
      webView?.load(request)
    }
  }

  func scrollTo(offset: CGPoint, animated: Bool) {
    webView?.scrollView.setContentOffset(offset, animated: animated)
  }

  func injectJavaScript(_ script: String) {
    DispatchQueue.main.async { [weak self] in
      self?.webView?.evaluateJavaScript(script)
    }
  }

  func setSource(_ source: DomWebViewSource) {
    self.source = source
  }

  func setInjectedJS(_ script: String?) {
    if let script, !script.isEmpty {
      injectedJS = WKUserScript(source: script, injectionTime: .atDocumentEnd, forMainFrameOnly: false)
    } else {
      injectedJS = nil
    }
    needsResetupScripts = true
  }

  func setInjectedJSBeforeContentLoaded(_ script: String?) {
    if let script, !script.isEmpty {
      injectedJSBeforeContentLoaded = WKUserScript(source: script, injectionTime: .atDocumentStart, forMainFrameOnly: false)
    } else {
      injectedJSBeforeContentLoaded = nil
    }
    needsResetupScripts = true
  }

  func setInjectedJavaScriptObject(_ source: String?) {
    if let source, !source.isEmpty {
      let script = """
      window.ReactNativeWebView = window.ReactNativeWebView || {};
      window.ReactNativeWebView.injectedObjectJson = function () {
        return `\(source)`;
      }
      true;
      """
      injectedObjectJsonScript = WKUserScript(source: script, injectionTime: .atDocumentStart, forMainFrameOnly: true)
    } else {
      injectedObjectJsonScript = nil
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
    if !prompt.hasPrefix(Self.EVAL_PROMPT_HEADER) || !useExpoModulesBridge {
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

  // MARK: - RCTAutoInsetsProtocol implementations

  @objc func refreshContentInset() {
    guard let webView else { return }
    RCTView.autoAdjustInsets(for: self, with: webView.scrollView, updateOffset: true)
  }

  // MARK: - WKNavigationDelegate implementations

  func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
    log.warn("WebView content process terminated")
    onContentProcessDidTerminate(createBaseEventPayload())
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

  private func setupWebView() {
    let config = WKWebViewConfiguration()
    config.userContentController = WKUserContentController()
    config.allowsInlineMediaPlayback = allowsInlineMediaPlayback
    config.allowsPictureInPictureMediaPlayback = allowsPictureInPictureMediaPlayback
    config.allowsAirPlayForMediaPlayback = allowsAirPlayForMediaPlayback
    config.mediaTypesRequiringUserActionForPlayback = mediaPlaybackRequiresUserAction ? .all : []

    let webView = WKWebView(frame: bounds, configuration: config)
    webView.uiDelegate = self
    webView.navigationDelegate = self

    let scrollView = webView.scrollView
    scrollView.delegate = self
    scrollView.bounces = bounces
    scrollView.isScrollEnabled = scrollEnabled
    scrollView.isPagingEnabled = pagingEnabled
    scrollView.isDirectionalLockEnabled = directionalLockEnabled
    scrollView.showsHorizontalScrollIndicator = showsHorizontalScrollIndicator
    scrollView.showsVerticalScrollIndicator = showsVerticalScrollIndicator
    scrollView.automaticallyAdjustsScrollIndicatorInsets = automaticallyAdjustsScrollIndicatorInsets
    scrollView.contentInsetAdjustmentBehavior = contentInsetAdjustmentBehavior

    if #available(iOS 16.4, *) {
      webView.isInspectable = webviewDebuggingEnabled
    }

    self.webView = webView
    addSubview(webView)

    applyBackgroundColor()
    refreshContentInset()
    resetupScripts()
    needsResetupScripts = false
  }

  private func createBaseEventPayload() -> [String: Any] {
    return [
      "url": webView?.url?.absoluteString ?? "",
      "title": webView?.title ?? ""
    ]
  }

  private func resetupScripts() {
    guard let userContentController = webView?.configuration.userContentController else {
      return
    }
    userContentController.removeAllUserScripts()
    userContentController.removeAllScriptMessageHandlers()

    userContentController.add(WeakScriptMessageHandler(delegate: self), name: Self.POST_MESSAGE_HANDLER_NAME)

    if let injectedJS {
      userContentController.addUserScript(injectedJS)
    }
    if let injectedJSBeforeContentLoaded {
      userContentController.addUserScript(injectedJSBeforeContentLoaded)
    }
    if let injectedObjectJsonScript {
      userContentController.addUserScript(injectedObjectJsonScript)
    }

    let addRNWObjectScript = """
    window.ReactNativeWebView ||= {};
    window.ReactNativeWebView.postMessage = function postMessage(data) {
      window.webkit.messageHandlers.\(Self.POST_MESSAGE_HANDLER_NAME).postMessage(String(data));
    };
    true;
    """
    userContentController.addUserScript(WKUserScript(source: addRNWObjectScript, injectionTime: .atDocumentStart, forMainFrameOnly: false))

    if useExpoModulesBridge {
      let addDomWebViewBridgeScript = """
      window.ExpoDomWebViewBridge = {
        eval: function eval(params) {
          return window.prompt('\(Self.EVAL_PROMPT_HEADER)' + params);
        },
      };
      true;
      """
      userContentController.addUserScript(WKUserScript(source: addDomWebViewBridgeScript, injectionTime: .atDocumentStart, forMainFrameOnly: false))

      guard let webViewId = self.id else {
        return
      }

      let addExpoDomWebViewObjectScript = "\(INSTALL_GLOBALS_SCRIPT);true;"
        .replacingOccurrences(of: "\"%%WEBVIEW_ID%%\"", with: String(webViewId))
      userContentController.addUserScript(WKUserScript(source: addExpoDomWebViewObjectScript, injectionTime: .atDocumentStart, forMainFrameOnly: false))
    }
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
    try? appContext.runtime.schedule {
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
