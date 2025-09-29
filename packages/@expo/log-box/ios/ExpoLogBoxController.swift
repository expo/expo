import UIKit
import WebKit
import React

@objc public class ExpoLogBoxScreenProvider: NSObject {
    @objc public static func makeHostingController(message: String) -> UIViewController {
        return ExpoLogBoxController(message: message)
    }
}

struct Colors {
    static let background = UIColor(red: 17/255.0,green: 17/255.0,blue: 19/255.0,alpha: 1.0)
}

class ExpoLogBoxController: UIViewController, ExpoLogBoxNativeActionsProtocol {
    private var message: String
    
    init(message: String) {
        self.message = message
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        self.message = "If you see this message this is an issue in ExpoLogBox."
        super.init(coder: coder)
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = Colors.background
        isModalInPresentation = true

        let webViewWrapper = ExpoLogBoxWebViewWrapper(nativeActions: self, props: [
            "platform": "ios",
            "nativeLogs": [
                self.message,
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

    func reloadRuntime() {
        DispatchQueue.main.async {
            RCTTriggerReloadCommandListeners("ExpoRedBoxSwap:Reload")
        }
        dismiss(animated: true)
    }
    
    func fetchJsonAsync() -> String {
        print("fetchJsonAsync is not implemented")
        return ""
    }
}
