import ExpoModulesCore
import UIKit

internal class FilePickingHandler: FilePickingResultHandler {
  private weak var module: FileSystemModule?
  internal var filePickingContext: FilePickingContext?

  init(module: FileSystemModule) {
    self.module = module
  }

  func presentDocumentPicker(
    picker: UIDocumentPickerViewController,
    isDirectory: Bool,
    options: FilePickerOptions?,
    promise: Promise
  ) {
    guard let module = module else {
      promise.reject(MissingViewControllerException())
      return
    }

    if filePickingContext != nil {
      promise.reject(PickingInProgressException())
      return
    }

    guard let currentVc = module.appContext?.utilities?.currentViewController() else {
      promise.reject(MissingViewControllerException())
      return
    }

    let pickerDelegate = FilePickingDelegate(resultHandler: self, isDirectory: isDirectory)
    filePickingContext = FilePickingContext(
      promise: promise,
      delegate: pickerDelegate
    )

    picker.delegate = pickerDelegate
    picker.presentationController?.delegate = pickerDelegate
    picker.allowsMultipleSelection = options?.allowsMultipleSelection ?? false

    if UIDevice.current.userInterfaceIdiom == .pad {
      let viewFrame = currentVc.view.frame
      picker.popoverPresentationController?.sourceRect = CGRect(
        x: viewFrame.midX,
        y: viewFrame.maxY,
        width: 0,
        height: 0
      )
      picker.popoverPresentationController?.sourceView = currentVc.view
      picker.modalPresentationStyle = .pageSheet
    }

    currentVc.present(picker, animated: true)
  }

  func didPickFilesAt(urls: [URL]) {
    handlePickingResult { context in
      let files = urls.map { FileSystemFile(url: $0) }
      context.promise.resolve(files)
    }
  }

  func didPickDirectoryAt(url: URL) {
    handlePickingResult { context in
      let directory = FileSystemDirectory(url: url)
      context.promise.resolve(directory)
    }
  }

  func didCancelPicking() {
    handlePickingResult { context in
      context.promise.reject(FilePickingCancelledException())
    }
  }

  private func handlePickingResult(_ handler: (FilePickingContext) -> Void) {
    guard let context = filePickingContext else {
      return
    }
    filePickingContext = nil

    handler(context)
  }
}
