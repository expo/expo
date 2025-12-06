#if canImport(UIKit) && EXPO_UNSTABLE_LOG_BOX

import UIKit
import WebKit
import React

@objc public class ExpoLogBoxScreenProvider: NSObject {
    @objc public static func makeHostingController(message: String?, stack: [RCTJSStackFrame]?) -> UIViewController {
        return ExpoLogBoxController(message: message, stack:stack)
    }
}

struct Colors {
    static let background = UIColor(red: 17/255.0,green: 17/255.0,blue: 19/255.0,alpha: 1.0)
}

class ExpoLogBoxController: UIViewController, ExpoLogBoxNativeActionsProtocol {
    private var message: String
    private var stack: [Dictionary<String, Any>]

    init(message: String?, stack: [RCTJSStackFrame]?) {
        self.message = message ?? "Error without message."
        self.stack = stack?.map { frame in
            return [
                "file": frame.file ?? "unknown",
                "methodName": frame.methodName ?? "unknown",
                "arguments": [],
                "lineNumber": frame.lineNumber,
                "column": frame.column,
                "collapse": frame.collapse,
            ]
        } ?? []
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        self.message = "If you see this message this is an issue in ExpoLogBox."
        self.stack = []
        super.init(coder: coder)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = Colors.background
        isModalInPresentation = true

        let webViewWrapper = ExpoLogBoxWebViewWrapper(nativeActions: self, props: [
            "platform": "ios",
            "nativeLogs": [
                [
                    "message": self.message,
                    "stack": self.stack,
                ],
            ]
        ])
        let webView = webViewWrapper.prepareWebView()
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])

#if EXPO_DEVELOP_LOG_BOX
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

    func onReload() {
        DispatchQueue.main.async {
            RCTTriggerReloadCommandListeners("ExpoRedBoxSwap:Reload")
        }
        dismiss(animated: true)
    }

    func fetchTextAsync(url: String, method: String?, body: String?) async -> String {
        let finalMethod = method ?? "GET"
        let finalBody = body ?? ""

        guard let url = URL(string: url) else {
            print("Invalid URL: \(url)")
            return "{}" // Return empty JSON object for invalid URL
        }

        var request = URLRequest(url: url)
        request.httpMethod = finalMethod.uppercased()

        // Set Content-Type for POST/PUT requests with body
        if !finalBody.isEmpty && (finalMethod.uppercased() == "POST" || finalMethod.uppercased() == "PUT") {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = body!.data(using: .utf8)
        }

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                print("Invalid response status: \(String(describing: response))")
                return "{}"
            }

            guard let jsonString = String(data: data, encoding: .utf8) else {
                print("Failed to convert data to UTF-8 string")
                return "{}"
            }
            return jsonString
        } catch {
            print("Request failed: \(error.localizedDescription)")
            return "{}"
        }
    }
}

#endif
