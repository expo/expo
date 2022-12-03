import ExpoModulesCore
import UIKit
import MobileCoreServices
import Foundation

/**
 Helper struct storing single picking operation context variables that have their own non-sharable state.
 */
struct PickingContext {
  let promise: Promise
  let options: DocumentPickerOptions
  let documentPickerHandler: DocumentPickerHandler
}

public class DocumentPickerModule: Module, DocumentPickingResultHandler {
  public func definition() -> ModuleDefinition {
    Name("ExpoDocumentPicker")

    AsyncFunction("getDocumentAsync") { (options: DocumentPickerOptions, promise: Promise) -> Void in
      // TODO: do we need this?
      //  if (promise.resolver != nil) {
      //    promise.reject(DocumentPickingInProgressException())
      //  }

      guard let utilities = self.appContext?.utilities else {
        throw UtilitiesInterfaceNotFoundException()
      }

      self.launchDocumentPicker(options: options, promise: promise)

      // TODO: ADD try catch above for catching errors about icloud entitlement

    }.runOnQueue(.main)
  }

  private var currentPickingContext: PickingContext?

  private func launchDocumentPicker(options: DocumentPickerOptions, promise: Promise) {
    guard let currentViewController = self.appContext?.utilities?.currentViewController() else {
      return promise.reject(MissingCurrentViewControllerException())
    }

    let documentPickerDelegate = DocumentPickerHandler(documentPickingResultHandler: self)
    let picker: UIDocumentPickerViewController

    let mimeTypes = options.type

    if mimeTypes.count == 0 {
      return promise.reject(IncorrectTypeArgumentException())
    }

    let shouldCopyToCacheDirectory = options.copyToCacheDirectory

    if #available(iOS 14, *) {
      var utTypes: [UTType] = []

      for mimeType in mimeTypes {
        if let convertedUTType = mimeTypeToUTType(mimeType: mimeType) {
          utTypes.append(convertedUTType)
        }
      }
      picker = UIDocumentPickerViewController.init(forOpeningContentTypes: utTypes)
    } else {
      var utiTypes: [String] = []

      for mimeType in mimeTypes {
        let convertedUtiType = mimeTypeToUTI(mimeType: mimeType)
        utiTypes.append(convertedUtiType)
      }

      picker = UIDocumentPickerViewController.init(documentTypes: utiTypes, in: UIDocumentPickerMode.import)
    }

    // Because of the way iPad works with Actionsheets such as this one, we need to provide a source view and set it's position.
    if UIDevice.current.userInterfaceIdiom == UIUserInterfaceIdiom.pad {
      let currentVCViewFrame = currentViewController.view.frame
      picker.popoverPresentationController?.sourceRect = CGRect(x: currentVCViewFrame.midX, y: currentVCViewFrame.maxY, width: 0, height: 0)
    }

    let pickingContext = PickingContext(promise: promise, options: options, documentPickerHandler: documentPickerDelegate)

    picker.delegate = pickingContext.documentPickerHandler

    // Store picking context as we're navigating to the different view controller (starting asynchronous flow)
    self.currentPickingContext = pickingContext
    currentViewController.present(picker, animated: true)
  }

  // MARK: - DocumentPickingResultHandler
  func didCancelPicking() {
    self.currentPickingContext?.promise.resolve(["type": "cancel"])
  }

  func didPickDocument(documentUrl: URL) {
    guard let options = self.currentPickingContext?.options,
    let promise = self.currentPickingContext?.promise else {
      NSLog("Picking operation context has been lost.")
      return
    }

    guard let fileSystem = self.appContext?.fileSystem else {
      return promise.reject(Exceptions.FileSystemModuleNotFound())
    }

    // Cleanup the currently stored picking context
    self.currentPickingContext = nil

    do {
      documentUrl.startAccessingSecurityScopedResource()

      let fileSize = try getFileSize(url: documentUrl)
      var newUrl = documentUrl

      if options.copyToCacheDirectory == true {

        let directory = URL(fileURLWithPath: fileSystem.cachesDirectory).appendingPathComponent("DocumentPicker")
        let fileExtension = documentUrl.pathExtension
        let path = fileSystem.generatePath(inDirectory: directory.absoluteString, withExtension: fileExtension == "" ? fileExtension : ".\(fileExtension)")

        newUrl = URL.init(fileURLWithPath: path)

        do {
          try FileManager.default.copyItem(atPath: documentUrl.path, toPath: newUrl.path)
        } catch {
          return promise.reject(UnableToCopyToCachesDirectoryException())
        }
      }

      let filePathExtension = documentUrl.pathExtension

      let mimeType = getMimeType(pathExtension: filePathExtension)

      documentUrl.stopAccessingSecurityScopedResource()

      return promise.resolve([
        "type": "success",
        "uri": newUrl.absoluteString,
        "name": documentUrl.lastPathComponent,
        "size": fileSize,
        "mimeType": mimeType
      ])
    } catch {
      return promise.reject(UnableToGetFileSizeException())
    }
  }
}

func getFileSize(url: URL) throws -> Int? {
  let resources = try url.resourceValues(forKeys: [.fileSizeKey])
  return resources.fileSize

}

func getMimeType(pathExtension: String) -> String {
  if let uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, pathExtension as NSString, nil)?.takeRetainedValue() {
    if let mimetype = UTTypeCopyPreferredTagWithClass(uti, kUTTagClassMIMEType)?.takeRetainedValue() {
      return mimetype as String
    }
  }

  return "application/octet-stream"
}

func mimeTypeToUTI(mimeType: String) -> String {
  let uti: CFString

  if mimeType == "*/*" {
    uti = kUTTypeItem
  } else if mimeType == "image/*" {
    uti = kUTTypeImage
  } else if mimeType == "video/*" {
    uti = kUTTypeVideo
  } else if mimeType == "audio/*" {
    uti = kUTTypeAudio
  } else if mimeType == "text/*" {
    uti = kUTTypeText
  } else {
    let mimeTypeRef = mimeType as CFString

    if let createdIdentifier = UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, mimeTypeRef, nil)?.takeRetainedValue() {
      uti = createdIdentifier
    } else {
      uti = kUTTypeItem
    }
  }

  return uti as String
}

@available(iOS 14, *)
func mimeTypeToUTType(mimeType: String) -> UTType? {
  if mimeType == "*/*" {
    return UTType.item
  } else if mimeType == "image/*" {
    return UTType.image
  } else if mimeType == "video/*" {
    return UTType.video
  } else if mimeType == "audio/*" {
    return UTType.audio
  } else if mimeType == "text/*" {
    return UTType.text
  } else {
    return UTType.init(mimeType: mimeType)
  }
}
