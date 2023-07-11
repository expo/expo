import ABI49_0_0ExpoModulesCore
import UIKit
import MobileCoreServices

struct PickingContext {
  let promise: Promise
  let options: DocumentPickerOptions
  let delegate: DocumentPickingDelegate
}

public class DocumentPickerModule: Module, PickingResultHandler {
  private var pickingContext: PickingContext?

  public func definition() -> ModuleDefinition {
    Name("ExpoDocumentPicker")

    AsyncFunction("getDocumentAsync") { (options: DocumentPickerOptions, promise: Promise) in
      if pickingContext != nil {
        throw PickingInProgressException()
      }

      guard let currentVc = appContext?.utilities?.currentViewController() else {
        throw MissingViewControllerException()
      }

      let documentPickerVC = createDocumentPicker(with: options)
      let pickerDelegate = DocumentPickingDelegate(resultHandler: self)

      pickingContext = PickingContext(promise: promise, options: options, delegate: pickerDelegate)

      documentPickerVC.delegate = pickerDelegate
      documentPickerVC.presentationController?.delegate = pickerDelegate
      documentPickerVC.allowsMultipleSelection = options.multiple

      if UIDevice.current.userInterfaceIdiom == .pad {
        let viewFrame = currentVc.view.frame
        documentPickerVC.popoverPresentationController?.sourceRect = CGRect(
          x: viewFrame.midX,
          y: viewFrame.maxY,
          width: 0,
          height: 0
        )
        documentPickerVC.popoverPresentationController?.sourceView = currentVc.view
        documentPickerVC.modalPresentationStyle = .pageSheet
      }
      currentVc.present(documentPickerVC, animated: true)
    }.runOnQueue(.main)
  }

  func didPickDocumentsAt(urls: [URL]) {
    guard let options = self.pickingContext?.options,
    let promise = self.pickingContext?.promise else {
      log.error("Picking context has been lost.")
      return
    }
    pickingContext = nil

    do {
      if options.multiple {
        let assets = try urls.map {
          try readDocumentDetails(
            documentUrl: $0,
            copy: options.copyToCacheDirectory
          )
        }
        promise.resolve(DocumentPickerResponse(assets: assets))
      } else {
        let asset = try readDocumentDetails(
          documentUrl: urls[0],
          copy: options.copyToCacheDirectory
        )
        promise.resolve(DocumentPickerResponse(assets: [asset]))
      }
    } catch {
      promise.reject(error)
    }
  }

  func didCancelPicking() {
    guard let context = pickingContext else {
      log.error("Picking context lost")
      return
    }

    pickingContext = nil
    context.promise.resolve(DocumentPickerResponse(canceled: true))
  }

  private func getFileSize(path: URL) -> Int? {
    guard let resource = try? path.resourceValues(forKeys: [.fileSizeKey, .isDirectoryKey]) else {
      return 0
    }

    if let isDirectory = resource.isDirectory {
      if !isDirectory {
        return resource.fileSize
      }
    }

    guard let contents = try? FileManager.default.contentsOfDirectory(atPath: path.absoluteString) else {
      return 0
    }

    let folderSize = contents.reduce(0) { currentSize, file in
      let fileSize = getFileSize(path: path.appendingPathComponent(file)) ?? 0
      return currentSize + fileSize
    }

    return folderSize
  }

  private func readDocumentDetails(documentUrl: URL, copy: Bool) throws -> DocumentInfo {
    var newUrl = documentUrl

    guard let fileSystem = self.appContext?.fileSystem else {
      throw Exceptions.FileSystemModuleNotFound()
    }

    guard let fileSize = try? getFileSize(path: documentUrl) else {
      throw InvalidFileException()
    }

    if copy {
      let cacheDirURL = URL(fileURLWithPath: fileSystem.cachesDirectory)
      let directory = cacheDirURL.appendingPathComponent("DocumentPicker", isDirectory: true).path
      let fileExtension = "." + documentUrl.pathExtension
      let path = fileSystem.generatePath(inDirectory: directory, withExtension: fileExtension)
      newUrl = URL(fileURLWithPath: path)

      try FileManager.default.copyItem(at: documentUrl, to: newUrl)
    }

    let mimeType = self.getMimeType(from: documentUrl.pathExtension)

    return DocumentInfo(
      uri: newUrl.absoluteString,
      name: documentUrl.lastPathComponent,
      size: fileSize,
      mimeType: mimeType
    )
  }

  private func getMimeType(from pathExtension: String) -> String? {
    if #available(iOS 14, *) {
      return UTType(filenameExtension: pathExtension)?.preferredMIMEType
    } else {
      if let uti = UTTypeCreatePreferredIdentifierForTag(
        kUTTagClassFilenameExtension,
        pathExtension as NSString, nil
      )?.takeRetainedValue() {
        if let mimetype = UTTypeCopyPreferredTagWithClass(uti, kUTTagClassMIMEType)?.takeRetainedValue() {
          return mimetype as String
        }
      }
      return nil
    }
  }

  private func createDocumentPicker(with options: DocumentPickerOptions) -> UIDocumentPickerViewController {
    if #available(iOS 14.0, *) {
      let utTypes = options.type.compactMap { $0.toUTType() }
      return UIDocumentPickerViewController(
        forOpeningContentTypes: utTypes,
        asCopy: true
      )
    } else {
      let utiTypes = options.type.map { $0.toUTI() }
      return UIDocumentPickerViewController(
        documentTypes: utiTypes,
        in: .import
      )
    }
  }
}
