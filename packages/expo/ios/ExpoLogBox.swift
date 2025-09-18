import UIKit
import WebKit

@objc public class SwiftUIScreenProvider: NSObject {
    @objc public static func makeHostingController(message: String) -> UIViewController {
        return WebViewController(message: message)
    }
}


struct Colors {
    static let background = UIColor(red: 17/255.0,green: 17/255.0,blue: 19/255.0,alpha: 1.0)
}

class WebViewController: UIViewController {
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

        let jsonData = try? JSONSerialization.data(withJSONObject: [self.message])
        let jsonString = String(data: jsonData!, encoding: .utf8)
        // jsonString looks like ["Hello \"Swift\" user\nNew line"]
        // Extract the first element (safe JS string literal)
        let safeValue = jsonString!.dropFirst().dropLast()
        
        
        // Inject global JS variable
        let userScript = WKUserScript(
            source:
                "var process=globalThis.process||{};process.env=process.env||{};process.env.EXPO_DEV_SERVER_ORIGIN='http://localhost:8081';" +
                "var __expoLogBoxNativeData = { rawMessage: \(safeValue) };",
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
        let myURL = URL(string:"http://localhost:8082")
        let myRequest = URLRequest(url: myURL!)
        webView.load(myRequest)
#else
        let bundleURL = Bundle.main.url(forResource: "ExpoLogBox", withExtension: "bundle")
        let bundle = Bundle(url: bundleURL!)
        let url = bundle!.url(forResource: "index", withExtension: "html")
        webView.loadFileURL(url!, allowingReadAccessTo: url!.deletingLastPathComponent())
#endif
    }
}
