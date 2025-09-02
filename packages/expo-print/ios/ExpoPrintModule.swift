import ExpoModulesCore

public class ExpoPrintModule: Module {
  var renderTasks: [ExpoWKPDFRenderer] = []
  var delegate = ExpoPrintModuleDelegate()

  lazy var printerSelector = {
    ExpoPrinterSelector(delegate: self.delegate, addPrinterToCache: { key, printer in
      self.printWithPrinter.cachedPrinters[key] = printer
    })
  }()

  lazy var printToFile = {
    ExpoPrintToFile(appContext: self.appContext)
  }()

  lazy var printWithPrinter = {
    ExpoPrintWithPrinter(delegate: self.delegate)
  }()

  public func definition() -> ModuleDefinition {
    Name("ExpoPrint")

    Constant("Orientation") {
      [
        "portrait": PrintOrientation.portrait.rawValue,
        "landscape": PrintOrientation.landscape.rawValue
      ]
    }

    AsyncFunction("print") { (options: PrintOptions, promise: Promise) in
      printWithPrinter.startPrint(options: options, promise: promise)
    }
    .runOnQueue(.main)

    AsyncFunction("selectPrinter") { (promise: Promise) in
      self.printerSelector.selectPrinter(promise: promise)
    }
    .runOnQueue(.main)

    AsyncFunction("printToFileAsync") { (options: PrintOptions, promise: Promise) in
      printToFile.printToFile(options: options, promise: promise)
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
