import Foundation
import WebKit

public class ExpoWKPDFRenderer: NSObject, WKNavigationDelegate {
  let htmlString: String
  let pageSize: CGSize
  let renderer: ExpoWKViewPrintPDFRenderer
  var htmlNavigation: WKNavigation?

  lazy var webView: WKWebView = createWebView()

  let onRenderingFinished: (_: Data?, _: Int, _: Error?, _ task: ExpoWKPDFRenderer) -> Void

  public init(
    htmlString: String,
    pageSize: CGSize,
    printableRect: CGRect,
    completionHandler: @escaping (_: Data?, _: Int, _: Error?, _ task: ExpoWKPDFRenderer) -> Void
  ) {
    self.htmlString = htmlString
    self.pageSize = pageSize
    onRenderingFinished = completionHandler
    renderer = ExpoWKViewPrintPDFRenderer(pageSize: pageSize, printableRect: printableRect)
  }

  public func pdfWithHtml() {
    htmlNavigation = webView.loadHTMLString(htmlString, baseURL: Bundle.main.resourceURL)
  }

// for WKNavigationDelegate
  public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation) {
    guard htmlNavigation == navigation else {
      return
    }
    renderer.PDFFromWebView(webView: webView) { data, pagesCount, error -> Void in
      self.onRenderingFinished(data, pagesCount, error, self)
    }
  }

  public func webView(webView: WKWebView, navigation: WKNavigation) {
    guard htmlNavigation == navigation else {
      return
    }
    renderer.PDFFromWebView(webView: webView, completionHandler: { (data: Data, pagesCount: Int, error: Error?) -> Void in
      self.onRenderingFinished(data, pagesCount, error, self)
    })
  }

  public func webView(_ webView: WKWebView, didFail navigation: WKNavigation, withError error: Error) {
    self.onRenderingFinished(nil, 0, error, self)
  }

  private func createWebView() -> WKWebView {
    let configuration = WKWebViewConfiguration()
    let frame = CGRect(x: 0, y: 0, width: pageSize.width, height: pageSize.height)
    let webView = WKWebView(frame: frame, configuration: configuration)
    webView.navigationDelegate = self
    webView.backgroundColor = UIColor.clear
    webView.scrollView.showsHorizontalScrollIndicator = false
    webView.scrollView.showsVerticalScrollIndicator = false

    return webView
  }
}
