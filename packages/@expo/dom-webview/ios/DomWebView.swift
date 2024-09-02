// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import WebKit

internal final class DomWebView: ExpoView, UIScrollViewDelegate, WKUIDelegate, WKScriptMessageHandler {
  // swiftlint:disable implicitly_unwrapped_optional
  private var webView: WKWebView!
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
      let request = RCTConvert.nsurlRequest(source.toDictionary()),
      webView.url?.absoluteURL != request.url {
      webView.load(request)
    }
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

  func setScrollEnabled(_ enabled: Bool) {
    webView.scrollView.isScrollEnabled = enabled
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

    // swiftlint:disable line_length
    let addExpoDomWebViewObjectScript = """
    class Deferred {
      constructor() {
        this.promise = new Promise((resolve, reject) => {
          this.resolveCallback = resolve;
          this.rejectCallback = reject;
        });
      }

      resolve(value) {
        this.resolveCallback(value);
      }

      reject(reason) {
        this.rejectCallback(reason);
      }

      getPromise() {
        return this.promise;
      }
    }

    class EventEmitterProxy {
      constructor(moduleName) {
        this.moduleName = moduleName;
      }

      addListener = (eventName, listener) => {
        if (!this.listeners) {
          this.listeners = new Map();
        }
        if (!this.listeners?.has(eventName)) {
          this.listeners?.set(eventName, new Set());
        }
        this.listeners?.get(eventName)?.add(listener);

        const moduleName = this.moduleName;
        const nativeListenerId = window.ExpoDomWebView.nextEventListenerId++;
        listener.$$nativeListenerId = nativeListenerId;

        const source = `
          globalThis.expo.$$DomWebViewEventListenerMap ||= {};
          globalThis.expo.$$DomWebViewEventListenerMap['${eventName}'] ||= new Map();
          const listener = (...args) => {
            const serializeArgs = args.map((arg) => JSON.stringify(arg)).join(',');
            const script = 'window.ExpoDomWebView.eventEmitterProxy.${moduleName}.emit("${eventName}", ' + serializeArgs + ')';
            globalThis.expo.modules.ExpoDomWebViewModule.evalJsForWebViewAsync(\(webViewId), script);
          };
          globalThis.expo.$$DomWebViewEventListenerMap['${eventName}'].set(${nativeListenerId}, listener);
          globalThis.expo.modules.${moduleName}.addListener('${eventName}', listener);
        `;
        window.ExpoDomWebView.eval(source);

        return {
          remove: () => {
            this.removeListener(eventName, listener);
          },
        };
      };

      removeListener = (eventName, listener) => {
        const moduleName = this.moduleName;
        const nativeListenerId = listener.$$nativeListenerId;
        if (listener.$$nativeListenerId != null) {
          const source = `(function() {
            const nativeListener = globalThis.expo.$$DomWebViewEventListenerMap['${eventName}'].get(${nativeListenerId});
            if (nativeListener != null) {
              globalThis.expo.modules.${moduleName}.removeListener('${eventName}', nativeListener);
              globalThis.expo.$$DomWebViewEventListenerMap['${eventName}'].delete(${nativeListenerId});
            }
            })();
            true;
          `;
          window.ExpoDomWebView.eval(source);
        }
        this.listeners?.get(eventName)?.delete(listener);
      };

      removeAllListeners = (eventName) => {
        const moduleName = this.moduleName;
        const source = `
          globalThis.expo.$$DomWebViewEventListenerMap['${eventName}'].clear();
          globalThis.expo.modules.${moduleName}.removeAllListeners('${eventName}');
        `;
        window.ExpoDomWebView.eval(source);
        this.listeners?.get(eventName)?.clear();
      };

      emit = (eventName, ...args) => {
        const listeners = new Set(this.listeners?.get(eventName));

        listeners.forEach((listener) => {
          // When the listener throws an error, don't stop the execution of subsequent listeners and
          // don't propagate the error to the `emit` function. The motivation behind this is that
          // errors thrown from a module or user's code shouldn't affect other modules' behavior.
          try {
            listener(...args);
          } catch (error) {
            console.error(error);
          }
        });
      };
    }

    class ExpoDomWebView {
      constructor() {
        this.nextDeferredId = 0;
        this.nextSharedObjectId = 0;
        this.nextEventListenerId = 0; // for globalThis.expo.$$DomWebViewEventListenerMap in native land
        this.deferredMap = new Map();
        this.sharedObjectFinalizationRegistry = new FinalizationRegistry((sharedObjectId) => {
          this.eval(`globalThis.expo.sharedObjectRegistry.delete(${sharedObjectId})`);
        });
      }

      eval(source) {
        const { deferredId, deferred } = this.createDeferred();
        const args = JSON.stringify({ source, deferredId });
        const EVAL_PROMPT_HEADER = '__EXPO_DOM_WEBVIEW_JS_EVAL__';
        const result = JSON.parse(window.prompt(EVAL_PROMPT_HEADER + args));
        if (result.isPromise) {
          return deferred.getPromise();
        }
        this.removeDeferred(deferredId);
        return result.value;
      }

      createDeferred() {
        const deferred = new Deferred();
        const deferredId = this.nextDeferredId;
        this.deferredMap.set(deferredId, deferred);
        this.nextDeferredId += 1;
        return { deferredId, deferred };
      }

      resolveDeferred(deferredId, value) {
        const deferred = this.deferredMap.get(deferredId);
        if (deferred) {
          deferred.resolve(value);
          this.deferredMap.delete(deferredId);
        }
      }

      rejectDeferred(deferredId, reason) {
        const deferred = this.deferredMap.get(deferredId);
        if (deferred) {
          deferred.reject(reason);
          this.deferredMap.delete(deferredId);
        }
      }

      removeDeferred(deferredId) {
        this.deferredMap.delete(deferredId);
      }
    }

    window.ExpoDomWebView = new ExpoDomWebView();

    function serializeArgs(args) {
      return args
        .map((arg) => {
          if (typeof arg === 'object' && arg.sharedObjectId != null) {
            return `globalThis.expo.sharedObjectRegistry.get(${arg.sharedObjectId})`;
          }
          return JSON.stringify(arg);
        })
        .join(',');
    }

    function createSharedObjectProxy(sharedObjectId) {
      return new Proxy({}, {
        get: (target, prop) => {
          const name = String(prop);
          if (name === 'sharedObjectId') {
            return sharedObjectId;
          }
          return function (...args) {
            const serializedArgs = serializeArgs(args);
            const source = `globalThis.expo.sharedObjectRegistry.get(${sharedObjectId})?.${name}?.call(globalThis.expo.sharedObjectRegistry.get(${sharedObjectId}),${serializedArgs})`;
            return window.ExpoDomWebView.eval(source);
          };
        },
      });
    }

    function createConstructorProxy(moduleName, property, propertyName) {
      return new Proxy(function () {}, {
        construct(target, args) {
          const serializedArgs = serializeArgs(args);
          const sharedObjectId = window.ExpoDomWebView.nextSharedObjectId++;
          const sharedObjectProxy = createSharedObjectProxy(sharedObjectId);
          window.ExpoDomWebView.sharedObjectFinalizationRegistry.register(sharedObjectProxy, sharedObjectId);
          const source = `globalThis.expo.sharedObjectRegistry ||= new Map(); globalThis.expo.sharedObjectRegistry.set(${sharedObjectId}, new ${property}(${serializedArgs}));`;
          window.ExpoDomWebView.eval(source);
          return sharedObjectProxy;
        }
      });
    }

    function createPropertyProxy(propertyTypeCache, moduleName, propertyName) {
      const property = `globalThis.expo.modules.${moduleName}.${propertyName}`;
      let propertyType = propertyTypeCache[propertyName];
      if (!propertyType) {
        const typeCheck = `${property}?.prototype?.__expo_shared_object_id__ != null ? 'sharedObject' : typeof ${property}`;
        propertyType = window.ExpoDomWebView.eval(typeCheck);
        propertyTypeCache[propertyName] = propertyType;
      }
      if (propertyType === 'sharedObject') {
        return createConstructorProxy(moduleName, property, propertyName);
      }
      if (propertyType === 'function') {
        return function (...args) {
          const serializedArgs = serializeArgs(args);
          const source = `${property}(${serializedArgs})`;
          return window.ExpoDomWebView.eval(source);
        };
      }
      return window.ExpoDomWebView.eval(property);
    }

    function createExpoModuleProxy(moduleName) {
      const propertyTypeCache = {};
      return new Proxy(
        {},
        {
          get: (target, prop) => {
            const name = String(prop);
            if (['addListener', 'removeListener', 'removeAllListeners'].includes(name)) {
              return window.ExpoDomWebView.eventEmitterProxy[moduleName][name];
            }
            return createPropertyProxy(propertyTypeCache, moduleName, name);
          },
        }
      );
    }

    const expoModules = {};
    const eventEmitterProxy = {};
    window.ExpoDomWebView.eval('Object.keys(globalThis.expo.modules)').forEach((name) => {
      expoModules[name] = createExpoModuleProxy(name);
      eventEmitterProxy[name] = new EventEmitterProxy(name);
    });
    window.ExpoDomWebView.expoModulesProxy = expoModules;
    window.ExpoDomWebView.eventEmitterProxy = eventEmitterProxy;

    true;
    """
    // swiftlint:enable line_length
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
      let wrappedSource = """
      (function() {
      const result = \(source);
      if (result instanceof Promise) {
        result
          .then((resolved) => {
            const resolvedString = JSON.stringify(resolved);
            const script = 'window.ExpoDomWebView.resolveDeferred(\(deferredId), ' + resolvedString + ')';
            globalThis.expo.modules.ExpoDomWebViewModule.evalJsForWebViewAsync(\(webViewId), script);
          })
          .catch((error) => {
            const errorString = JSON.stringify(error);
            const script = 'window.ExpoDomWebView.rejectDeferred(\(deferredId), ' + errorString + ')';
            globalThis.expo.modules.ExpoDomWebViewModule.evalJsForWebViewAsync(\(webViewId), script);
          });
        return JSON.stringify({ isPromise: true, value: null });
      } else {
        return JSON.stringify({ isPromise: false, value: result });
      }
      })();
      """
      do {
        let result = try runtime.eval(wrappedSource)
        completionHandler(result.getString())
      } catch {
        completionHandler("\(error)")
      }
    }
  }
}
