import ExpoModulesCore

public class ExpoPrintWithPrinter {
  var renderTasks: [ExpoWKPDFRenderer] = []
  var cachedPrinters: [String: UIPrinter] = [:]
  let delegate: ExpoPrintModuleDelegate
  let printURLSession = URLSession(configuration: .default)
  var dataTask: URLSessionDataTask?

  init(delegate: ExpoPrintModuleDelegate) {
    self.delegate = delegate
  }

  func startPrint(options: PrintOptions, promise: Promise) {
    if let uri = options.uri {
      dataFromUri(uri: uri) { [weak self] data in
        if let self = self, let printingData = data {
          self.printWithData(printingData: printingData, options: options, promise: promise)
        } else {
          promise.reject(InvalidUrlException())
        }
      }
      return
    }

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
      if error == nil {
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
      // Found by @tsapeta
      // In older versions of iOS there is a bug, where finding the printer using UIPrinter(url:) will fail
      // https://stackoverflow.com/questions/34602302/creating-a-working-uiprinter-object-from-url-for-dialogue-free-printing
      // the workaround is to use a printer saved during picking, fall back to this method if the regular one fails

      // Also on ios 16 there is a bug when printing multiple files https://github.com/expo/expo/issues/19399.
      // Caching the previously used printer fixes the bug
      let printer = self.cachedPrinters[printerUrl] ?? UIPrinter(url: candidateUrl)
      self.cachedPrinters[printerUrl] = printer

      printer.contactPrinter { available in
        if available {
          printInteractionController.print(to: printer, completionHandler: completionHandler)
        } else {
          promise.reject(PrintingJobFailedException("Provided printer is not available."))
        }
      }
    } else if UIDevice.current.userInterfaceIdiom == UIUserInterfaceIdiom.pad {
      printInteractionController.present(from: rootController.view.frame, in: rootController.view, animated: true, completionHandler: completionHandler)
    } else {
      printInteractionController.present(animated: true, completionHandler: completionHandler)
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

  private func dataFromUri(uri: String, completion: @escaping (Data?) -> Void) {
    guard var url = URL(string: uri) else {
      completion(nil)
      return
    }

    // Assume that URLs without a scheme eq. /home/user/file.pdf will be local file urls
    if url.scheme == nil {
      url = URL(fileURLWithPath: uri)
    }

    // process http and https requests asynchronously
    if url.scheme == "http" || url.scheme == "https" {
      dataTask = printURLSession.dataTask(with: URLRequest(url: url)) { [weak self] data, response, error in
        defer {
          self?.dataTask = nil
        }

        if error == nil, let response = response as? HTTPURLResponse, response.statusCode == 200 {
          DispatchQueue.main.async {
            completion(data)
          }
          return
        }
        completion(nil)
      }
      dataTask?.resume()
    } else {
      let data = try? Data(contentsOf: url)
      completion(data)
    }
  }
}
