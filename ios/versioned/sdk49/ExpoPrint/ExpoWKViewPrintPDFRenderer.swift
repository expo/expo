import Foundation
import WebKit

public class ExpoWKViewPrintPDFRenderer {
  private let pageSize: CGSize
  private let printableRect: CGRect

  init(pageSize: CGSize, printableRect: CGRect) {
    self.pageSize = pageSize
    self.printableRect = printableRect
  }

  public func PDFFromWebView(webView: WKWebView, completionHandler: @escaping (_: Data, _: Int, _: Error?) -> Void) {
    webView.evaluateJavaScript("document.body.scrollHeight", completionHandler: { _, error in
      let renderer = UIPrintPageRenderer()
      renderer.addPrintFormatter(webView.viewPrintFormatter(), startingAtPageAt: 0)

      // Setting paperRect has no effect on actual page size, but HTML will not render
      // without both paperRect and printableRect.
      let paperRect = CGRect(x: 0, y: 0, width: self.pageSize.width, height: self.pageSize.height)
      renderer.setValue(paperRect, forKey: "paperRect")

      renderer.setValue(self.printableRect, forKey: "printableRect")

      let data = NSMutableData()
      UIGraphicsBeginPDFContextToData(data, CGRect.zero, nil)
      renderer.prepare(forDrawingPages: NSRange(location: 0, length: renderer.numberOfPages))
      if renderer.numberOfPages > 0 {
        for i in 0...renderer.numberOfPages - 1 {
          UIGraphicsBeginPDFPageWithInfo(paperRect, nil)
          renderer.drawPage(at: i, in: UIGraphicsGetPDFContextBounds())
        }
      }
      UIGraphicsEndPDFContext()

      completionHandler(data as Data, renderer.numberOfPages, error)
    })
  }
}
