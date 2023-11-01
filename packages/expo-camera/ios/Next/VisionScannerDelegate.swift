import UIKit
import VisionKit

protocol ScannerResultHandler {
  func onItemScanned(result: [String: Any])
}

@available(iOS 16.0, *)
class VisionScannerDelegate: NSObject, DataScannerViewControllerDelegate {
  private let handler: ScannerResultHandler
  
  init(handler: ScannerResultHandler) {
    self.handler = handler
  }
  
  func dataScannerDidZoom(_ dataScanner: DataScannerViewController) {
    print("dataScannerDidZoom")
  }
  
  func dataScanner(_ dataScanner: DataScannerViewController, didAdd addedItems: [RecognizedItem], allItems: [RecognizedItem]) {
    print("addedItems")
  }
  
  func dataScanner(_ dataScanner: DataScannerViewController, didUpdate updatedItems: [RecognizedItem], allItems: [RecognizedItem]) {
    if let item = updatedItems.first {
      switch item {
      case .barcode(let code):
        handler.onItemScanned(result: BarCodeScannerUtils.visionDataScannerObjectToDictionary(item: code))
      case .text(let text):
        return
      }
    }
  }
  
  func dataScanner(_ dataScanner: DataScannerViewController, didTapOn item: RecognizedItem) {
    print("didTapOn")
  }
  
  func dataScanner(_ dataScanner: DataScannerViewController, didRemove removedItems: [RecognizedItem], allItems: [RecognizedItem]) {
    print("didRemove")
  }
}
