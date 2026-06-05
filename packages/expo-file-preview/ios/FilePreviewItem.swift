import QuickLook

internal final class FilePreviewItem: NSObject, QLPreviewItem {
  let previewItemURL: URL?
  let previewItemTitle: String?

  init(url: URL, title: String?) {
    self.previewItemURL = url
    self.previewItemTitle = title
  }
}
