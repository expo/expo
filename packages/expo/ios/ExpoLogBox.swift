import SwiftUI
import WebKit

@objc public class SwiftUIScreenProvider: NSObject {
    @objc public static func makeHostingController() -> UIViewController {
        if #available(iOS 26.0, *) {
            let view = MySwiftUIView()
            let controller =  UIHostingController(rootView: view)
            return controller
        } else {
            // TODO: Should we only use UIKit WebView?
            // Fallback on earlier versions
            let view = EmptyView();
            let controller = UIHostingController(rootView: view)
            return controller
        }
    }
}

@available(iOS 26.0, *)
struct MySwiftUIView: View {
    @State private var page = WebPage();

    var body: some View {
        let bundleName = "ExpoLogBox"
        let htmlFileName = "index"
        let bundleURL = Bundle.main.url(forResource: bundleName, withExtension: "bundle")
        let bundle = Bundle(url: bundleURL!)
        let path = bundle!.path(forResource: htmlFileName, ofType: "html")
        let html = try? String(contentsOfFile: path!)
        
        WebView(page)
            //.scrollBounceBehavior(.always) //TODO: How to make the sheet dismiss on pull down?
            .webViewBackForwardNavigationGestures(.disabled)
            .onAppear {
                page.load(html: html!)
            }
    }
}
