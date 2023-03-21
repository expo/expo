import UIKit

protocol PickingResultHandler {
  func didPickDocumentsAt(urls: [URL])
  func didCancelPicking()
}

internal class DocumentPickingDelegate: NSObject, UIDocumentPickerDelegate, UIAdaptivePresentationControllerDelegate {
  private let resultHandler: PickingResultHandler

  init(resultHandler: PickingResultHandler) {
    self.resultHandler = resultHandler
  }

  func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    self.resultHandler.didPickDocumentsAt(urls: urls)
  }

  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
    self.resultHandler.didCancelPicking()
  }

  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    self.resultHandler.didCancelPicking()
  }
}
