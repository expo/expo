import UIKit
import WebKit
import React

protocol ExpoLogBoxNativeActionsProtocol {
    func reloadRuntime() -> Void
    func fetchJsonAsync(url: String, method: String?, body: String?) async -> String
}

private class ExpoLogBoxNativeActions: ExpoLogBoxNativeActionsProtocol {
    func reloadRuntime() -> Void {
        fatalError()
    }
    func fetchJsonAsync(url: String, method: String?, body: String?) async -> String {
        fatalError()
    }
    static let reloadRuntimeName = "reloadRuntime"
    static let fetchJsonAsyncName = "fetchJsonAsync"
    static let names = [
        reloadRuntimeName,
        fetchJsonAsyncName,
    ]
}

private struct Constants {
    static let DOM_EVENT = "$$dom_event"
    static let NATIVE_ACTION_RESULT = "$$native_action_result"
    static let NATIVE_ACTION = "$$native_action"
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

        let devServerOrigin: String? = {
            guard let bundleUrl = RCTBundleURLProvider.sharedSettings()
                    .jsBundleURL(forBundleRoot: "unused.name"),
                  let scheme = bundleUrl.scheme,
                  let host = bundleUrl.host,
                  let port = bundleUrl.port
            else {
                return nil
            }
            return "\(scheme)://\(host):\(port)"
        }()
        let devServerOriginJsValue: String = devServerOrigin.map { "'\($0)'" } ?? "undefined"

        let injectJavascript = """
            var process = globalThis.process || {};
            process.env = process.env || {};
            process.env.EXPO_DEV_SERVER_ORIGIN = \(devServerOriginJsValue);
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
        Task.detached {
            await self.handleWebViewMessageAsync(message: message)
        }
    }

    func handleWebViewMessageAsync(message: WKScriptMessage) async {
        guard message.name == nativeMessageHandlerName,
              let messageBody = message.body as? [String: Any],
              let messageType = messageBody["type"] as? String else {
            return
        }

        let data = messageBody["data"] as? [String: Any] ?? [:]

        if (messageType == Constants.NATIVE_ACTION) {
            guard let actionId = data["actionId"] as? String,
                  let uid = data["uid"] as? String,
                  let args = data["args"] as? [Any] else {
                print("ExpoLogBoxDomRuntimeError native actions is missing actionId or uid.")
                return
            }

            do {
                switch actionId {
                    case ExpoLogBoxNativeActions.reloadRuntimeName:
                        nativeActions.reloadRuntime()
                    case ExpoLogBoxNativeActions.fetchJsonAsyncName:
                        guard let url = args[0] as? String,
                              let options = args[1] as? [String: Any] else {
                            print("ExpoLogBox fetchJsonAsync action is missing url or options.")
                            return
                        }

                        let method = options["method"] as? String
                        let body = options["body"] as? String
                        let result = await nativeActions.fetchJsonAsync(url: url, method: method, body: body)
                        sendReturn(result: result, uid: uid, actionId: actionId)
                    default:
                        print("Unknown native action: \(actionId)")
                }
            } catch {
                sendReturn(error: error, uid: uid, actionId: actionId)
            }
        } else {
            print("Unknown message type: \(messageType)")
        }
    }

    func sendReturn(result: Any, uid: String, actionId: String) {
        sendReturn(data: [
            "type": Constants.NATIVE_ACTION_RESULT,
            "data": [
              "uid": uid,
              "actionId": actionId,
              "result": result,
            ],
        ])
    }

    func sendReturn(error: Any, uid: String, actionId: String) {
        sendReturn(data: [
            "type": Constants.NATIVE_ACTION_RESULT,
            "data": [
              "uid": uid,
              "actionId": actionId,
              "error": [
                "message": "\(error)",
              ],
            ],
        ])
    }

    func sendReturn(data: [String: Any]) {
        guard let jsonData = try? JSONSerialization.data(
            withJSONObject: [ "detail": data ],
            options: []
        ), let jsonDataStringified = String(data: jsonData, encoding: .utf8) else {
            print("ExpoLogBox failed to stringify native action result.")
            return
        }
        sendReturn(value: jsonDataStringified)
    }

    func sendReturn(value: String) {
        let injectedJavascript = """
            ;
            (function() {
                try {
                    console.log("received", \(value));
                    window.dispatchEvent(new CustomEvent("\(Constants.DOM_EVENT)", \(value)));
                } catch (e) {}
            })();
            true;
            """
        webView.evaluateJavaScript(injectedJavascript) { _, error in
            if let error = error {
                print("ExpoLogBox NativeActions return value injection error: \(error.localizedDescription)")
            }
        }
    }
}
