import UIKit
import WebKit

@objc public class SwiftUIScreenProvider: NSObject {
    @objc public static func makeHostingController() -> UIViewController {
        return WebViewController()
    }
}

class WebViewController: UIViewController {

    private var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        // Create webView
        let config = WKWebViewConfiguration()
        webView = WKWebView(frame: .zero, configuration: config)
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)

        // Constrain to fill entire view
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        let bundleURL = Bundle.main.url(forResource: "ExpoLogBox", withExtension: "bundle")
        let bundle = Bundle(url: bundleURL!)
        let url = bundle!.url(forResource: "index", withExtension: "html")
        
        // Load a URL
        webView.loadFileURL(url!, allowingReadAccessTo: url!.deletingLastPathComponent())
    }
}
