import UIKit

protocol OnDocumentInteractionResult {
  func didDismissOpenInMenu()
}

internal class SharingDelegate: NSObject, UIDocumentInteractionControllerDelegate {
  private let resultHandler: OnDocumentInteractionResult

  init(resultHandler: OnDocumentInteractionResult) {
    self.resultHandler = resultHandler
  }

  func documentInteractionControllerDidDismissOpenInMenu(_ controller: UIDocumentInteractionController) {
    self.resultHandler.didDismissOpenInMenu()
  }
}
