import ExpoModulesCore

public class ExpoPrintToPrinter {
  var renderTasks: [ExpoWKPDFRenderer] = []
  var printers: [String: UIPrinter] = [:]
  let delegate: ExpoPrintModuleDelegate
  let appContext: AppContext?

  init(delegate: ExpoPrintModuleDelegate, appContext: AppContext?) {
    self.delegate = delegate
    self.appContext = appContext
  }

  func startPrint(promise: Promise, options: PrintOptions, printers: [String: UIPrinter]) {
    self.printers = printers
    print(self.printers)
    if let uri = options.uri {
      guard let printingData = dataFromUri(uri: uri) else {
        promise.reject(InvalidUrlException())
        return
      }
      printWithData(printingData: printingData, options: options, promise: promise)
    }

    let pageSize = options.toPageSize()
    let printableRect = options.toPrintableRect()
    // Do this for compatibility with deprecated markup formatter option
    guard let htmlString = options.markupFormatterIOS ?? options.html else {
      promise.reject(NoPrintDataException())
      return
    }

    if !options.useMarkupFormatter {
      printFromHtmlWithoutMarkupFormatter(htmlString: htmlString, options: options, promise: promise)
    } else {
      printFromHtmlWithMarkupFormatter(htmlString: htmlString, options: options, promise: promise)
    }
  }

  private func printFromHtmlWithoutMarkupFormatter(htmlString: String, options: PrintOptions, promise: Promise) {
    let renderTask = ExpoWKPDFRenderer(
      htmlString: htmlString,
      pageSize: options.toPageSize(),
      printableRect: options.toPrintableRect()
    ) { pdfData, _, error, task in
      self.renderTasks.removeAll {
        $0 == task
      }
      guard let pdfData = pdfData, error == nil else {
        promise.reject(PdfNotRenderedException(error?.localizedDescription))
        return
      }
      self.printWithData(printingData: pdfData, options: options, promise: promise)
    }
    self.renderTasks.append(renderTask)
    renderTask.pdfWithHtml()
  }

  private func printFromHtmlWithMarkupFormatter(htmlString: String, options: PrintOptions, promise: Promise) {
    ExpoPrintToFile.pdfWithHtmlMarkupFormatter(
      htmlString: htmlString,
      pageSize: options.toPageSize(),
      printableRect: options.toPrintableRect()
    ) { pdfData, _, error, task in
      self.renderTasks.removeAll {
        $0 == task
      }
      if error != nil {
        self.printWithData(printingData: pdfData, options: options, promise: promise)
      } else {
        promise.reject(PdfNotRenderedException(error?.localizedDescription))
      }
    }
  }

  private func printWithData(printingData: Data, options: PrintOptions, promise: Promise) {
    let printerUrl = options.printerUrl ?? ""
    let candidateUrl = URL(string: printerUrl) ?? URL(fileURLWithPath: printerUrl)

    guard let rootController = UIApplication.shared.keyWindow?.rootViewController else {
      promise.reject(ViewControllerNotFoundException())
      return
    }

    let printInteractionController = makePrintInteractionController(options: options)
    printInteractionController.printingItem = printingData

    let completionHandler = { (_: UIPrintInteractionController, completed: Bool, error: Error?) in
      if error != nil {
        promise.reject(PrintingJobFailedException(error?.localizedDescription))
      }
      if completed {
        promise.resolve()
      } else {
        promise.reject(PrintIncompleteException())
      }
    }

    if !printerUrl.isEmpty {
      let printer = UIPrinter(url: candidateUrl)
      printer.contactPrinter { available in
        if available {
          //          printInteractionController.print(to: printer, completionHandler: completionHandler)

        } else {
          // Found by @tsapeta
          // In older versions of iOS there is a bug, where finding the printer using UIPrinter(url:) will fail
          // https://stackoverflow.com/questions/34602302/creating-a-working-uiprinter-object-from-url-for-dialogue-free-printing
          // the workaround is to use a printer saved during picking, fall back to this method if the regular one fails
          self.findCachedPrinter(printerUrl: printerUrl, promise: promise) { _ in
            // printInteractionController.print(to: cachedPrinter, completionHandler: completionHandler)
          }
        }
      }
    } else if UIDevice.current.userInterfaceIdiom == UIUserInterfaceIdiom.pad {
      printInteractionController.present(from: rootController.view.frame, in: rootController.view, animated: true, completionHandler: completionHandler)
    } else {
      printInteractionController.present(animated: true, completionHandler: completionHandler)
    }
  }

  private func findCachedPrinter(printerUrl: String, promise: Promise, completionHandler: @escaping (_ printer: UIPrinter) -> Void) {
    guard let cachedPrinter = self.printers[printerUrl] else {
      promise.reject(PrintingJobFailedException("Provided printer is not available."))
      return
    }

    cachedPrinter.contactPrinter { available in
      if available {
        completionHandler(cachedPrinter)
      } else {
        promise.reject(PrintingJobFailedException("Provided printer is not available."))
      }
    }
  }

  private func makePrintInteractionController(options: PrintOptions) -> UIPrintInteractionController {
    let uri = options.uri ?? ""
    let printInteractionController = UIPrintInteractionController()
    printInteractionController.delegate = self.delegate

    let printInfo = UIPrintInfo.printInfo()
    printInfo.outputType = UIPrintInfo.OutputType.general
    if let uri = options.uri {
      printInfo.jobName = uri.components(separatedBy: "/").last ?? uri
    }
    printInfo.duplex = UIPrintInfo.Duplex.longEdge
    printInfo.orientation = options.toUIPrintInfoOrientation()

    printInteractionController.printInfo = printInfo
    printInteractionController.showsNumberOfCopies = true
    printInteractionController.showsPaperSelectionForLoadedPapers = true

    return printInteractionController
  }

  private func dataFromUri(uri: String) -> Data? {
    do {
      return try Data(contentsOf: URL(fileURLWithPath: uri))
    } catch {
      return nil
    }
  }
}
