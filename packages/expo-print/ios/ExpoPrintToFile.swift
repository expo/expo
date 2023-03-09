import ExpoModulesCore

public class ExpoPrintToFile {
  var renderTasks: [ExpoWKPDFRenderer] = []
  weak var appContext: AppContext?

  init(appContext: AppContext?) {
    self.appContext = appContext
  }

  func printToFile(options: PrintOptions, promise: Promise) {
    let htmlString = options.html ?? ""
    let pageSize = options.toPageSize()
    let printableRect = options.toPrintableRect()

    guard options.format != "pdf" else {
      promise.reject(UnsupportedFormatException(options.format))
      return
    }

    let completionHandler = { (data: Data?, pagesNumber: Int, error: Error?, task: ExpoWKPDFRenderer?) in
      self.renderTasks.removeAll {
        $0 == task
      }
      if error != nil {
        promise.reject(PdfNotRenderedException(error?.localizedDescription))
        return
      }

      guard let filePath = self.generatePath() else {
        promise.reject(PdfSavingException())
        return
      }

      let uri = URL(fileURLWithPath: filePath)
      let error: Error

      guard let data = data else {
        promise.resolve(PdfSavingException())
        return
      }
      do {
        let success = try data.write(to: uri)
        let base64Data = options.base64 ? data.base64EncodedString(options: Data.Base64EncodingOptions.endLineWithLineFeed) : nil
        let result = FilePrintResult(uri: uri.absoluteString, numberOfPages: pagesNumber, base64: base64Data)
        promise.resolve(result)
      } catch let error {
        promise.reject(PdfSavingException())
      }
    }

    if options.useMarkupFormatter {
      ExpoPrintToFile.pdfWithHtmlMarkupFormatter(
        htmlString: htmlString,
        pageSize: pageSize,
        printableRect: printableRect,
        onFinished: completionHandler
      )
    } else {
      let renderTask = ExpoWKPDFRenderer(
        htmlString: htmlString,
        pageSize: pageSize,
        printableRect: printableRect,
        completionHandler: completionHandler
      )
      renderTasks.append(renderTask)
      renderTask.pdfWithHtml()
    }
  }

  static func pdfWithHtmlMarkupFormatter(
    htmlString: String,
    pageSize: CGSize,
    printableRect: CGRect,
    onFinished: @escaping (_: Data, _: Int, _: Error?, _: ExpoWKPDFRenderer?) -> Void
  ) {
    let formatter = UIMarkupTextPrintFormatter(markupText: htmlString ?? "")
    let renderer = UIPrintPageRenderer()
    renderer.addPrintFormatter(formatter, startingAtPageAt: 0)

    let paperRect = CGRect(x: 0, y: 0, width: pageSize.width, height: pageSize.height)
    renderer.setValue(paperRect, forKey: "paperRect")

    renderer.setValue(printableRect, forKey: "printableRect")

    let data = NSMutableData()
    UIGraphicsBeginPDFContextToData(data, printableRect, nil)
    for i in 0...renderer.numberOfPages - 1 {
      UIGraphicsBeginPDFPageWithInfo(paperRect, nil)
      renderer.drawPage(at: i, in: UIGraphicsGetPDFContextBounds())
    }
    UIGraphicsEndPDFContext()
    onFinished(data as Data, renderer.numberOfPages, nil, nil)
  }

  private func generatePath() -> String? {
    guard let fileSystem = appContext?.fileSystem else {
      return nil
    }
    let fileManager = FileManager()
    let directory = fileSystem.cachesDirectory + "/Print/"

    // It might be necessary to create the print directory
    do {
      try fileManager.createDirectory(atPath: directory, withIntermediateDirectories: true)
    } catch {
      return nil
    }

    let fileName = UUID().uuidString + ".pdf"
    return directory + fileName
  }
}
