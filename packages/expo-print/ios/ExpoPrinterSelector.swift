import ExpoModulesCore

public class ExpoPrinterSelector {
  let delegate: ExpoPrintModuleDelegate
  let addPrinterToCache: (_: String, _: UIPrinter) -> Void

  init(delegate: ExpoPrintModuleDelegate, addPrinterToCache: @escaping (_: String, _: UIPrinter) -> Void) {
    self.addPrinterToCache = addPrinterToCache
    self.delegate = delegate
  }

  func selectPrinter(promise: Promise) {
    guard let rootController = UIApplication.shared.keyWindow?.rootViewController else {
      promise.reject(ViewControllerNotFoundException())
      return
    }

    let picker = UIPrinterPickerController()
    picker.delegate = delegate

    let completionHandler = { (picker: UIPrinterPickerController, userDidSelect: Bool, err: Error?) -> Void in
      if !userDidSelect && err != nil {
        promise.reject(PrinterPickerException(err?.localizedDescription))
      }

      guard let selectedPrinter = picker.selectedPrinter, userDidSelect else {
        promise.reject(PickerCanceledException())
        return
      }

      self.addPrinterToCache(selectedPrinter.url.absoluteString, selectedPrinter)
      promise.resolve(PrinterSelectResult(
        url: selectedPrinter.url.absoluteString,
        name: selectedPrinter.displayName))
    }

    if UIDevice.current.userInterfaceIdiom == UIUserInterfaceIdiom.pad { // iPad
      picker.present(from: rootController.view.frame, in: rootController.view, animated: true, completionHandler: completionHandler)
    } else { // iPhone
      picker.present(animated: true, completionHandler: completionHandler)
    }
  }
}
