import Foundation
import Testing
import UIKit

internal import SDWebImage

@testable import ExpoImage

@MainActor
@Suite("Disk cache policy")
struct DiskOnlyImageCacheTests {
  @Test
  func `doesn't keep a disk cache hit in the memory cache`() async throws {
    // The image comes from the disk cache, so the view never downloads it.
    let url = try #require(URL(string: "https://expo.invalid/\(UUID().uuidString).png"))
    let key = url.absoluteString
    let imageData = UIGraphicsImageRenderer(size: CGSize(width: 1, height: 1)).pngData { context in
      UIColor.red.setFill()
      context.fill(CGRect(x: 0, y: 0, width: 1, height: 1))
    }
    await withCheckedContinuation { continuation in
      SDImageCache.shared.storeImageData(imageData, forKey: key) {
        continuation.resume()
      }
    }
    defer { SDImageCache.shared.removeImage(forKey: key, fromDisk: true, withCompletion: nil) }

    let view = ImageView()
    var source = ImageSource()
    source.uri = url
    view.cachePolicy = .disk
    view.sources = [source]
    view.bounds = CGRect(x: 0, y: 0, width: 100, height: 100)
    for _ in 0..<500 where view.sourceImage == nil {
      try await Task.sleep(for: .milliseconds(10))
    }

    #expect(view.sourceImage != nil)
    #expect(SDImageCache.shared.imageFromMemoryCache(forKey: key) == nil)
  }
}
