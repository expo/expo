import ExpoModulesCore
import QuickLook

internal final class FilePreviewSession: NSObject, QLPreviewControllerDataSource, QLPreviewControllerDelegate {
  private let item: FilePreviewItem
  private let onFinish: () -> Void

  init(item: FilePreviewItem, onFinish: @escaping () -> Void) {
    self.item = item
    self.onFinish = onFinish
  }

  func numberOfPreviewItems(in controller: QLPreviewController) -> Int {
    return 1
  }

  func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
    return item
  }

  func previewControllerDidDismiss(_ controller: QLPreviewController) {
    onFinish()
  }
}
