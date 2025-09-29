import UIKit
import WebKit
import React

protocol ExpoLogBoxNativeActionsProtocol {
    func reloadRuntime() -> Void
    func fetchJsonAsync() -> String
}

private class ExpoLogBoxNativeActions: ExpoLogBoxNativeActionsProtocol {
    func reloadRuntime() -> Void {
        fatalError()
    }
    func fetchJsonAsync() -> String {
        fatalError()
    }
    static let reloadRuntimeName = "reloadRuntime"
    static let fetchJsonAsyncName = "fetchJsonAsync"
    static let names = [
        reloadRuntimeName,
        fetchJsonAsyncName,
    ]
}

class ExpoLogBoxWebViewWrapper: NSObject, WKScriptMessageHandler {
    private let nativeMessageHandlerName = "nativeHandler"
    private let nativeActions: ExpoLogBoxNativeActionsProtocol
    private let props: [String: Any]
    private let webView: WKWebView
    
    init(nativeActions: ExpoLogBoxNativeActionsProtocol, props: [String: Any]) {
        self.nativeActions = nativeActions
        self.props = props
        self.webView = WKWebView(frame: .zero)
    }
    
    func prepareWebView() -> WKWebView {
        let initProps: [String: Any] = [
            "names": ExpoLogBoxNativeActions.names,
            "props": props
        ]
        
        guard let initPropsObject = try? JSONSerialization.data(withJSONObject: initProps, options: []),
              let initPropsStringified = String(data: initPropsObject, encoding: .utf8) else {
            fatalError("Failed to serialize initProps. This is an issue in ExpoLogBox. Please report it.")
        }

        guard let bundleUrl = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "unused.name"),
              let scheme = bundleUrl.scheme,
              let host = bundleUrl.host,
              let port = bundleUrl.port else {
          fatalError("Failed to extract bundleUrl scheme, host, or port. LogBox should not be initialized without dev server host (a.k.a in Release builds.). This might be an issue in ExpoLogBox. Please report it.")
        }
        let devServerOrigin = "\(scheme)://\(host):\(port)"

        let injectJavascript = """
            var process = globalThis.process || {};
            process.env = process.env || {};
            process.env.EXPO_DEV_SERVER_ORIGIN = '\(devServerOrigin)';
            window.$$EXPO_INITIAL_PROPS = \(initPropsStringified);
            window.ReactNativeWebView = {};
            window.ReactNativeWebView.postMessage = (message) => {
                window.webkit.messageHandlers.\(nativeMessageHandlerName).postMessage(
                    JSON.parse(message)
                );
            };
            """

        webView.configuration.userContentController.addUserScript(WKUserScript(
            source: injectJavascript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))
        if #available(iOS 16.4, *) {
#if EXPO_DEBUG_LOG_BOX || EXPO_DEVELOP_LOG_BOX
            webView.isInspectable = true
#else
            webView.isInspectable = false
#endif
        }
        webView.configuration.userContentController.add(self, name: nativeMessageHandlerName)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.isOpaque = false
        return webView
    }
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == nativeMessageHandlerName,
              let messageBody = message.body as? [String: Any],
              let messageType = messageBody["type"] as? String else {
            return
        }
        
        let data = messageBody["data"] as? [String: Any] ?? [:]
        
        switch messageType {
        case "$$native_action":
            guard let actionId = data["actionId"] else {
                return
            }

            switch actionId as? String {
                case ExpoLogBoxNativeActions.reloadRuntimeName:
                    nativeActions.reloadRuntime()
                case ExpoLogBoxNativeActions.fetchJsonAsyncName:
                    // TODO: return the result to the webview
                    nativeActions.fetchJsonAsync()
                default:
                print("Unknow native action: \(actionId)")
            }
        default:
            print("Unknown message type: \(messageType)")
        }
    }
}
