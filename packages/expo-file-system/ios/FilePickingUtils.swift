import ExpoModulesCore
import MobileCoreServices
import UIKit
import UniformTypeIdentifiers

internal protocol FilePickingResultHandler {
  func didPickFileAt(url: URL)
  func didCancelPicking()
}

internal struct FilePickingContext {
  let promise: Promise
  let initialUri: URL?
  let mimeType: String?
  let isDirectory: Bool
  let delegate: FilePickingDelegate
  var pickedUrl: URL?
}

internal class FilePickingDelegate: NSObject, UIDocumentPickerDelegate, UIAdaptivePresentationControllerDelegate {
  private let resultHandler: FilePickingResultHandler
  private let isDirectory: Bool
  private weak var pickingHandler: FilePickingHandler?

  init(resultHandler: FilePickingResultHandler, isDirectory: Bool = false) {
    self.resultHandler = resultHandler
    self.isDirectory = isDirectory
    self.pickingHandler = resultHandler as? FilePickingHandler
  }

  func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    guard let url = urls.first else {
      self.resultHandler.didCancelPicking()
      return
    }

    self.resultHandler.didPickFileAt(url: url)
  }

  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
    self.resultHandler.didCancelPicking()
  }

  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    self.resultHandler.didCancelPicking()
  }
}

internal func createFilePicker(initialUri: URL?, mimeType: String?) -> UIDocumentPickerViewController {
  if #available(iOS 14.0, *) {
    let utTypes: [UTType]
    if let mimeType = mimeType {
      if let utType = UTType(mimeType: mimeType) {
        utTypes = [utType]
      } else {
        utTypes = [UTType.item]
      }
    } else {
      utTypes = [UTType.item]
    }

    let picker = UIDocumentPickerViewController(forOpeningContentTypes: utTypes, asCopy: true)

    if let initialUri = initialUri {
      picker.directoryURL = initialUri
    }

    return picker
  } else {
    let utiTypes: [String]
    if let mimeType = mimeType {
      utiTypes = [toUTI(mimeType: mimeType)]
    } else {
      utiTypes = [kUTTypeItem as String]
    }

    let picker = UIDocumentPickerViewController(documentTypes: utiTypes, in: .import)

    if let initialUri = initialUri {
      picker.directoryURL = initialUri
    }

    return picker
  }
}

@available(iOS 14.0, *)
private func toUTType(mimeType: String) -> UTType? {
  switch mimeType {
  case "*/*":
    return UTType.item
  case "image/*":
    return UTType.image
  case "video/*":
    return UTType.movie
  case "audio/*":
    return UTType.audio
  case "text/*":
    return UTType.text
  default:
    return UTType(mimeType: mimeType)
  }
}

private func toUTI(mimeType: String) -> String {
  var uti: CFString

  switch mimeType {
  case "*/*":
    uti = kUTTypeItem
  case "image/*":
    uti = kUTTypeImage
  case "video/*":
    uti = kUTTypeVideo
  case "audio/*":
    uti = kUTTypeAudio
  case "text/*":
    uti = kUTTypeText
  default:
    if let ref = UTTypeCreatePreferredIdentifierForTag(
      kUTTagClassMIMEType,
      mimeType as CFString,
      nil
    )?.takeRetainedValue() {
      uti = ref
    } else {
      uti = kUTTypeItem
    }
  }
  return uti as String
}
