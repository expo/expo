// Copyright 2026-present 650 Industries. All rights reserved.

#if os(iOS)
import QuickLook

internal final class FileSystemPreviewItem: NSObject, QLPreviewItem {
  let previewItemURL: URL?
  let previewItemTitle: String?

  init(url: URL, title: String?) {
    self.previewItemURL = url
    self.previewItemTitle = title
  }
}

internal final class FileSystemPreviewSession: NSObject, QLPreviewControllerDataSource, QLPreviewControllerDelegate {
  private let item: FileSystemPreviewItem
  // Retain security-scoped access while Quick Look is open.
  private let scopedAccess: FileSystemScopedAccess
  private let onFinish: () -> Void

  init(item: FileSystemPreviewItem, scopedAccess: FileSystemScopedAccess, onFinish: @escaping () -> Void) {
    self.item = item
    self.scopedAccess = scopedAccess
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
#endif
