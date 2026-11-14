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

internal final class FileSystemPreviewController: QLPreviewController {
  // Keep the data source and file access alive for the native viewer's lifetime.
  var session: FileSystemPreviewSession?
  var onPresentationFailure: (() -> Void)?

  deinit {
    onPresentationFailure?()
  }
}

internal final class FileSystemPreviewSession: NSObject, QLPreviewControllerDataSource, QLPreviewControllerDelegate {
  private let items: [FileSystemPreviewItem]
  // Retain security-scoped access while Quick Look is open.
  private let scopedAccesses: [FileSystemScopedAccess]
  // The view the source item zooms out of and back into. React Native owns it, so it may unmount while Quick Look is open.
  private weak var sourceView: UIView?
  private let sourceItem: FileSystemPreviewItem
  private let onFinish: () -> Void

  init(
    items: [FileSystemPreviewItem],
    scopedAccesses: [FileSystemScopedAccess],
    sourceView: UIView?,
    sourceItemIndex: Int,
    onFinish: @escaping () -> Void
  ) {
    self.items = items
    self.scopedAccesses = scopedAccesses
    self.sourceView = sourceView
    self.sourceItem = items[sourceItemIndex]
    self.onFinish = onFinish
  }

  func numberOfPreviewItems(in controller: QLPreviewController) -> Int {
    return items.count
  }

  func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
    return items[index]
  }

  func previewController(_ controller: QLPreviewController, transitionViewFor item: QLPreviewItem) -> UIView? {
    // Zooming another item back into the source view would point at the wrong file.
    guard item === sourceItem, let sourceView, sourceView.window != nil else {
      return nil
    }
    return sourceView
  }

  func previewControllerDidDismiss(_ controller: QLPreviewController) {
    (controller as? FileSystemPreviewController)?.session = nil
    onFinish()
  }
}
#endif
