import Foundation
import Testing
import UIKit

@testable import ExpoImagePicker

private func makeImage(width: Int, height: Int, orientation: UIImage.Orientation = .up) -> UIImage {
  let format = UIGraphicsImageRendererFormat()
  // Pin the scale so point and pixel dimensions match, keeping crop rects easy to reason about.
  format.scale = 1
  let size = CGSize(width: width, height: height)
  let image = UIGraphicsImageRenderer(size: size, format: format).image { context in
    UIColor.red.setFill()
    context.fill(CGRect(origin: .zero, size: size))
  }

  guard orientation != .up, let cgImage = image.cgImage else {
    return image
  }
  // `width`/`height` stay the pixel dimensions; the tag is what makes `size` differ from them.
  return UIImage(cgImage: cgImage, scale: 1, orientation: orientation)
}

@Suite("ImageUtils.readImageFrom")
struct ImageUtilsReadImageTests {
  @Test
  func `returns nil when editing was requested but cropping failed`() {
    // A rect that does not intersect the image makes `CGImage.cropping(to:)` fail,
    // standing in for any editor failure that leaves us without a cropped bitmap.
    let mediaInfo: MediaInfo = [
      .originalImage: makeImage(width: 10, height: 10),
      .cropRect: CGRect(x: 100, y: 100, width: 6, height: 6)
    ]

    #expect(ImageUtils.readImageFrom(mediaInfo: mediaInfo, shouldReadCroppedImage: true) == nil)
  }

  @Test
  func `returns nil when editing was requested but no crop information exists`() {
    let mediaInfo: MediaInfo = [.originalImage: makeImage(width: 10, height: 10)]

    #expect(ImageUtils.readImageFrom(mediaInfo: mediaInfo, shouldReadCroppedImage: true) == nil)
  }

  @Test
  func `crops the original when cropRect is usable`() throws {
    let mediaInfo: MediaInfo = [
      .originalImage: makeImage(width: 10, height: 10),
      .cropRect: CGRect(x: 0, y: 0, width: 6, height: 6)
    ]

    let image = try #require(ImageUtils.readImageFrom(mediaInfo: mediaInfo, shouldReadCroppedImage: true))

    #expect(image.size == CGSize(width: 6, height: 6))
  }

  @Test
  func `returns the original when editing was not requested`() throws {
    let mediaInfo: MediaInfo = [.originalImage: makeImage(width: 10, height: 10)]

    let image = try #require(ImageUtils.readImageFrom(mediaInfo: mediaInfo, shouldReadCroppedImage: false))

    #expect(image.size == CGSize(width: 10, height: 10))
  }

  @Test
  func `applies cropRect in the original pixel space before fixing orientation`() throws {
    // 10x20 pixels tagged `.right`, so `size` reports the upright 20x10.
    let original = makeImage(width: 10, height: 20, orientation: .right)
    #expect(original.size == CGSize(width: 20, height: 10))

    let mediaInfo: MediaInfo = [
      .originalImage: original,
      .cropRect: CGRect(x: 0, y: 0, width: 10, height: 5)
    ]

    let image = try #require(ImageUtils.readImageFrom(mediaInfo: mediaInfo, shouldReadCroppedImage: true))

    // Cropping first gives 10x5 pixels, which uprights to 5x10. Fixing orientation
    // first would upright to 20x10 and then crop to 10x5, misplacing the crop (#37810).
    #expect(image.size == CGSize(width: 5, height: 10))
  }
}
