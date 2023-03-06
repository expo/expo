import ExpoModulesCore

public class ExpoPrintModule: Module {
  var renderTasks: [ExpoWKPDFRenderer] = []
  var delegate = ExpoPrintModuleDelegate()
  var printers: [String: UIPrinter] = [:]

  lazy var printerSelector = {
    ExpoPrinterSelector(delegate: &self.delegate, addPrinterToCache: { key, printer in
      self.printers[key] = printer
    })
  }()

  lazy var printToFile = {
    ExpoPrintToFile(appContext: self.appContext)
  }()

  lazy var printToPrinter = {
    ExpoPrintToPrinter(delegate: self.delegate, appContext: self.appContext)
  }()

  public func definition() -> ModuleDefinition {
    Name("ExpoPrint")

    AsyncFunction("print") { (options: PrintOptions, promise: Promise) in
      printToPrinter.startPrint(promise: promise, options: options, printers: self.printers)
    }
    .runOnQueue(.main)

    AsyncFunction("selectPrinter") { (promise: Promise) in
      self.printerSelector.selectPrinter(promise: promise)
    }
    .runOnQueue(.main)

    AsyncFunction("printToFileAsync") { (options: PrintOptions, promise: Promise) in
      printToFile.printToFile(promise: promise, options: options)
    }
    .runOnQueue(.main)
  }
}

// ExpoPrintModule cannot inherit from UIPrinterPickerControllerDelegate due to inheritance conflicts with Module. Create a helper class
class ExpoPrintModuleDelegate: NSObject, UIPrinterPickerControllerDelegate, UIPrintInteractionControllerDelegate {
  private func getViewController() -> UIViewController? {
    let provider = ModuleRegistryProvider()
    let moduleRegistry = provider.moduleRegistry()
    let utils = moduleRegistry.getModuleImplementingProtocol(EXUtilitiesInterface.self) as? EXUtilitiesInterface
    return utils?.currentViewController()
  }

  func printerPickerControllerParentViewController(_ printerPickerController: UIPrinterPickerController) -> UIViewController? {
    return getViewController()
  }

  // UIPrintInteractionControllerDelegate
  func printInteractionControllerParentViewController(_ printInteractionController: UIPrintInteractionController) -> UIViewController? {
    return getViewController()
  }
}
