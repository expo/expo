import VisionKit
import ExpoModulesCore

protocol ScannerResultHandler {
  func onItemScanned(result: [String: Any])
}

@available(iOS 16.0, *)
class VisionScannerDelegate: NSObject, DataScannerViewControllerDelegate {
  private let handler: ScannerResultHandler

  init(handler: ScannerResultHandler) {
    self.handler = handler
  }

  func dataScanner(_ dataScanner: DataScannerViewController, didUpdate updatedItems: [RecognizedItem], allItems: [RecognizedItem]) {
    if let item = updatedItems.first {
      switch item {
      case .barcode(let code):
        handler.onItemScanned(result: BarcodeScannerUtils.visionDataScannerObjectToDictionary(item: code))
      case .text(let text):
        return
      @unknown default:
        log.error("Unhandled `RecognizedItem` value: \(item), returning `nil` as fallback. Add the missing case as soon as possible.")
        return
      }
    }
  }
}
