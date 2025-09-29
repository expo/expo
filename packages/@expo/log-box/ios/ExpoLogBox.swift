import UIKit
import WebKit
import React

@objc public class ExpoLogBoxScreenProvider: NSObject {
    @objc public static func makeHostingController(message: String) -> UIViewController {
        return WebViewController(message: message)
    }
}

struct Colors {
    static let background = UIColor(red: 17/255.0,green: 17/255.0,blue: 19/255.0,alpha: 1.0)
}

class WebViewController: UIViewController, WKScriptMessageHandler {
    private var webView: WKWebView!
    private var message: String
    
    init(message: String) {
        self.message = message
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        self.message = ""
        super.init(coder: coder)
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = Colors.background
        isModalInPresentation = true

        // Create webView

        let contentController = WKUserContentController()
        
        let initProps: [String: Any] = [
            "names": [
                "fetchJsonAsync",
                "reloadRuntime"
            ],
            "props": [
                "platform": "ios",
                "nativeLogs": [
                    self.message,
                ]
            ]
        ]
        
        guard let initPropsObject = try? JSONSerialization.data(withJSONObject: initProps, options: []),
              let initPropsStringified = String(data: initPropsObject, encoding: .utf8) else {
            print("Failed to serialize initProps.")
            return
        }

        var devServerOrigin: String = "http://localhost:8081"
        let bundleUrl = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "unused.name")
        if let bundleUrl {
            devServerOrigin = "\((bundleUrl as NSURL).scheme ?? "http")://\((bundleUrl as NSURL).host ?? "localhost"):\(String(bundleUrl.port ?? 8081))"
        }

        // Inject global JS variable
        let userScript = WKUserScript(
            source:
                "var process=globalThis.process||{};process.env=process.env||{};process.env.EXPO_DEV_SERVER_ORIGIN='\(devServerOrigin)';" +
                "window.$$EXPO_INITIAL_PROPS = \(initPropsStringified);" +
                "window.ReactNativeWebView = {};" +
                "window.ReactNativeWebView.postMessage = (message) => {console.log('postMessage: ', message);window.webkit.messageHandlers.nativeHandler.postMessage(JSON.parse(message));};",
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )

        contentController.addUserScript(userScript)

        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        
        webView = WKWebView(frame: .zero, configuration: config)
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
        webView.configuration.userContentController.add(self, name: "nativeHandler")
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.isOpaque = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
        
#if EXPO_DEBUG_LOG_BOX
        // TODO: In the @expo/log-box add `yarn dev` which will return the same as
        // http://localhost:8081/_expo/@dom/logbox-polyfill-dom.tsx?file=file:///user/repos/expo/expo/packages/@expo/log-box/src/logbox-polyfill-dom.tsx
        // let myURL = URL(string:"http://localhost:8082/_expo/@dom/logbox-polyfill-dom.tsx?file=file:///Users/krystofwoldrich/repos/expo/expo/packages/@expo/log-box/src/logbox-polyfill-dom.tsx")
        let myURL = URL(string:"http://localhost:8090")
        let myRequest = URLRequest(url: myURL!)
        webView.load(myRequest)
#else
        let bundleURL = Bundle.main.url(forResource: "ExpoLogBox", withExtension: "bundle")
        let bundle = Bundle(url: bundleURL!)
        let url = bundle!.url(forResource: "index", withExtension: "html")
        webView.loadFileURL(url!, allowingReadAccessTo: url!.deletingLastPathComponent())
#endif
    }
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "nativeHandler",
              let messageBody = message.body as? [String: Any],
              let messageType = messageBody["type"] as? String else {
            return
        }
        
        let data = messageBody["data"] as? [String: Any] ?? [:]
        
        // Route to appropriate Swift function
        switch messageType {
        case "$$native_action":
            guard let actionId = data["actionId"] else {
                return
            }

            switch actionId as? String {
                case "reloadRuntime":
                    reloadJS()
                case "fetchJsonAsync":
                    print("fetchJsonAsync call")
                default:
                print("Unknow native action: \(actionId)")
            }
        default:
            print("Unknown message type: \(messageType)")
        }
    }

    func reloadJS() {
        DispatchQueue.main.async {
            RCTTriggerReloadCommandListeners("ExpoRedBoxSwap:Reload")
        }
        dismiss(animated: true)
    }
}
