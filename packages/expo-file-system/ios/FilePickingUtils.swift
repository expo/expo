// UIDocumentPickerViewController is unavailable on tvOS
#if os(iOS)
import ExpoModulesCore
import MobileCoreServices
import UIKit
import UniformTypeIdentifiers

internal protocol FilePickingResultHandler {
  func didPickFilesAt(urls: [URL])
  func didPickFileAt(url: URL)
  func didPickDirectoryAt(url: URL)
  func didCancelPicking()
}

internal struct FilePickingContext {
  let promise: Promise
  let initialUri: URL?
  let mimeTypes: [String]
  let isDirectory: Bool
  let multipleDocuments: Bool
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
    guard let firstUrl = urls.first else {
      self.resultHandler.didCancelPicking()
      return
    }

    if isDirectory {
      // For directory access, we need to start accessing the security-scoped resource
      let didStartAccessing = firstUrl.startAccessingSecurityScopedResource()
      if didStartAccessing {
        // Store the picked URL for proper cleanup
        if let pickingHandler = pickingHandler {
          pickingHandler.filePickingContext?.pickedUrl = firstUrl
        }
        self.resultHandler.didPickDirectoryAt(url: firstUrl)
      } else {
        // If we can't access the directory, treat as cancellation
        self.resultHandler.didCancelPicking()
      }
    } else if controller.allowsMultipleSelection {
      self.resultHandler.didPickFilesAt(urls: urls)
    } else {
      self.resultHandler.didPickFileAt(url: firstUrl)
    }
  }

  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
    self.resultHandler.didCancelPicking()
  }

  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    self.resultHandler.didCancelPicking()
  }
}

internal func createFilePicker(initialUri: URL?, mimeTypes: [String]) -> UIDocumentPickerViewController {
  var utTypes: [UTType] = mimeTypes.compactMap { mimeType in
    toUTType(mimeType: mimeType)
  }
  if utTypes.isEmpty {
    utTypes = [UTType.item]
  }

  let picker = UIDocumentPickerViewController(forOpeningContentTypes: utTypes, asCopy: true)

  if let initialUri = initialUri {
    picker.directoryURL = initialUri
  }

  return picker
}

internal func createDirectoryPicker(initialUri: URL?) -> UIDocumentPickerViewController {
  if #available(iOS 14.0, *) {
    // Use UTType.folder for directory access as per Apple's documentation
    let picker = UIDocumentPickerViewController(forOpeningContentTypes: [UTType.folder], asCopy: false)
    if let initialUri = initialUri {
      picker.directoryURL = initialUri
    }
    return picker
  }
  // For iOS 13 and earlier, use kUTTypeFolder
  let picker = UIDocumentPickerViewController(documentTypes: [kUTTypeFolder as String], in: .open)
  if let initialUri = initialUri {
    picker.directoryURL = initialUri
  }
  return picker
}

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
#endif
