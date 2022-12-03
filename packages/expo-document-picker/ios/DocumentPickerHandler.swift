import ExpoModulesCore

/**
 Protocol that describes scenarios we care about while the user is picking documents.
 */
protocol DocumentPickingResultHandler {
  func didPickDocument(documentUrl: URL)
  func didCancelPicking()
}

internal class DocumentPickerHandler: NSObject, UIDocumentPickerDelegate {
  private let documentPickingResultHandler: DocumentPickingResultHandler

  init(documentPickingResultHandler: DocumentPickingResultHandler) {
    self.documentPickingResultHandler = documentPickingResultHandler
  }

  func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    let pickedFileUrl = urls[0]
    documentPickingResultHandler.didPickDocument(documentUrl: urls[0])
  }

  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
    documentPickingResultHandler.didCancelPicking()
  }
}
