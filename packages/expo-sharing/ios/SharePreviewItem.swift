import LinkPresentation
import QuickLookThumbnailing
import UIKit

/**
 Shares the file at `url`, heading the share sheet with `title` and a thumbnail of the file
 instead of the file's name and size.
 */
internal final class SharePreviewItem: NSObject, UIActivityItemSource {
  private let url: URL
  private let metadata = LPLinkMetadata()

  init(url: URL, title: String) {
    self.url = url
    metadata.title = title

    let thumbnail = NSItemProvider()
    thumbnail.registerObject(ofClass: UIImage.self, visibility: .all) { completion in
      let request = QLThumbnailGenerator.Request(
        fileAt: url,
        size: CGSize(width: 256, height: 256),
        scale: UITraitCollection.current.displayScale,
        representationTypes: .thumbnail
      )
      QLThumbnailGenerator.shared.generateBestRepresentation(for: request) { representation, error in
        completion(representation?.uiImage, error)
      }
      return nil
    }
    metadata.imageProvider = thumbnail
    metadata.iconProvider = thumbnail
  }

  func activityViewControllerPlaceholderItem(_ activityViewController: UIActivityViewController) -> Any {
    return url
  }

  func activityViewController(
    _ activityViewController: UIActivityViewController,
    itemForActivityType activityType: UIActivity.ActivityType?
  ) -> Any? {
    return url
  }

  func activityViewControllerLinkMetadata(_ activityViewController: UIActivityViewController) -> LPLinkMetadata? {
    return metadata
  }
}
