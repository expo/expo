import Testing
import UIKit
import AVFoundation
import ImageIO

@testable import ExpoCamera

@Suite("ExpoCameraUtils")
struct ExpoCameraUtilsTests {
  @Test(arguments: [
    (UIImage.Orientation.up, 1),
    (.down, 3),
    (.left, 8),
    (.right, 6),
    (.upMirrored, 2),
    (.downMirrored, 4),
    (.leftMirrored, 5),
    (.rightMirrored, 7),
  ] as [(UIImage.Orientation, Int)])
  func `maps UIImage orientation to EXIF orientation`(orientation: UIImage.Orientation, expected: Int) {
    #expect(ExpoCameraUtils.toExifOrientation(orientation: orientation) == expected)
  }

  @Test(arguments: [
    (UIImage.Orientation.up, 0),
    (.left, 90),
    (.right, -90),
    (.down, 180),
  ] as [(UIImage.Orientation, Int)])
  func `maps UIImage orientation to export rotation degrees`(orientation: UIImage.Orientation, expected: Int) {
    #expect(ExpoCameraUtils.exportImage(orientation: orientation) == expected)
  }

  @Test(arguments: [
    (UIDeviceOrientation.portrait, AVCaptureVideoOrientation.portrait),
    (.portraitUpsideDown, .portraitUpsideDown),
    (.landscapeLeft, .landscapeRight),
    (.landscapeRight, .landscapeLeft),
    (.faceUp, .portrait),
  ] as [(UIDeviceOrientation, AVCaptureVideoOrientation)])
  func `maps device orientation to capture orientation reversing landscape`(
    device: UIDeviceOrientation,
    expected: AVCaptureVideoOrientation
  ) {
    #expect(ExpoCameraUtils.videoOrientation(for: device) == expected)
  }

  @Test(arguments: [
    (UIInterfaceOrientation.portrait, AVCaptureVideoOrientation.portrait),
    (.landscapeLeft, .landscapeLeft),
    (.landscapeRight, .landscapeRight),
    (.portraitUpsideDown, .portraitUpsideDown),
    (.unknown, .portrait),
  ] as [(UIInterfaceOrientation, AVCaptureVideoOrientation)])
  func `maps interface orientation to capture orientation`(
    interface: UIInterfaceOrientation,
    expected: AVCaptureVideoOrientation
  ) {
    #expect(ExpoCameraUtils.videoOrientation(for: interface) == expected)
  }

  @Test(arguments: [
    (UIInterfaceOrientation.portrait, UIDeviceOrientation.portrait),
    (.portraitUpsideDown, .portraitUpsideDown),
    (.landscapeLeft, .landscapeRight),
    (.landscapeRight, .landscapeLeft),
    (.unknown, .unknown),
  ] as [(UIInterfaceOrientation, UIDeviceOrientation)])
  func `maps interface orientation to physical device orientation reversing landscape`(
    interface: UIInterfaceOrientation,
    expected: UIDeviceOrientation
  ) {
    #expect(ExpoCameraUtils.physicalOrientation(for: interface) == expected)
  }

  @Test(arguments: [
    (UIDeviceOrientation.landscapeLeft, AVCaptureVideoOrientation.landscapeRight),
    (.landscapeRight, .landscapeLeft),
    (.portrait, .portrait),
    (.portraitUpsideDown, .portraitUpsideDown),
  ] as [(UIDeviceOrientation, AVCaptureVideoOrientation)])
  func `capture follows the physical orientation when responsive orientation is enabled`(
    physical: UIDeviceOrientation,
    expected: AVCaptureVideoOrientation
  ) {
    #expect(ExpoCameraUtils.captureOrientation(
      responsiveWhenOrientationLocked: true,
      physicalOrientation: physical,
      interfaceOrientation: .portrait
    ) == expected)
  }

  @Test(arguments: [
    (UIInterfaceOrientation.portrait, UIDeviceOrientation.landscapeLeft, AVCaptureVideoOrientation.portrait),
    (.portrait, .landscapeRight, .portrait),
    (.landscapeLeft, .portrait, .landscapeLeft),
    (.landscapeRight, .faceUp, .landscapeRight),
    (.portraitUpsideDown, .landscapeLeft, .portraitUpsideDown),
  ] as [(UIInterfaceOrientation, UIDeviceOrientation, AVCaptureVideoOrientation)])
  func `capture follows the interface orientation when responsive orientation is disabled`(
    interface: UIInterfaceOrientation,
    physical: UIDeviceOrientation,
    expected: AVCaptureVideoOrientation
  ) {
    #expect(ExpoCameraUtils.captureOrientation(
      responsiveWhenOrientationLocked: false,
      physicalOrientation: physical,
      interfaceOrientation: interface
    ) == expected)
  }

  @Test(arguments: [
    (UIDeviceOrientation.portrait, "portrait"),
    (.landscapeLeft, "landscapeLeft"),
    (.landscapeRight, "landscapeRight"),
    (.portraitUpsideDown, "portraitUpsideDown"),
    (.faceUp, "faceUp"),
    (.faceDown, "faceDown"),
    (.unknown, "unknown"),
  ] as [(UIDeviceOrientation, String)])
  func `maps device orientation to string`(orientation: UIDeviceOrientation, expected: String) {
    #expect(ExpoCameraUtils.toOrientationString(orientation: orientation) == expected)
  }

  @Test
  func `crops to the given rect and preserves scale and orientation`() throws {
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1
    let base = UIGraphicsImageRenderer(size: CGSize(width: 100, height: 80), format: format).image { context in
      UIColor.gray.setFill()
      context.fill(CGRect(x: 0, y: 0, width: 100, height: 80))
    }
    let image = UIImage(cgImage: base.cgImage!, scale: 1, orientation: .right)

    let cropped = ExpoCameraUtils.crop(image: image, to: CGRect(x: 0, y: 0, width: 40, height: 30))

    #expect(cropped.cgImage?.width == 40)
    #expect(cropped.cgImage?.height == 30)
    #expect(cropped.imageOrientation == .right)
    #expect(cropped.scale == 1)
  }

  @Test(arguments: [
    UIImage.Orientation.down,
    .left,
    .right,
    .upMirrored,
    .downMirrored,
    .leftMirrored,
    .rightMirrored
  ] as [UIImage.Orientation])
  func `bakeOrientation returns an upright image at display dimensions`(orientation: UIImage.Orientation) {
    let image = makeImage(bufferWidth: 400, bufferHeight: 300, orientation: orientation)

    let baked = ExpoCameraUtils.bakeOrientation(image: image)

    let swaps = [UIImage.Orientation.left, .leftMirrored, .right, .rightMirrored].contains(orientation)
    #expect(baked.imageOrientation == .up)
    #expect(baked.cgImage?.width == (swaps ? 300 : 400))
    #expect(baked.cgImage?.height == (swaps ? 400 : 300))
    // UIImage.size is display-oriented, so it must not change across the bake.
    #expect(baked.size == image.size)
  }

  @Test
  func `bakeOrientation returns the same instance when already upright`() {
    let image = makeImage(bufferWidth: 100, bufferHeight: 80, orientation: .up)

    #expect(ExpoCameraUtils.bakeOrientation(image: image) === image)
  }

  @Test
  func `bakeOrientation rotates the pixels, not just the tag`() throws {
    // Displayed via .right (EXIF 6), the buffer's white left half is at the
    // top — so it must end up at the top of the baked pixels.
    let image = makeHalfWhiteImage(orientation: .right)

    let baked = try #require(ExpoCameraUtils.bakeOrientation(image: image).cgImage)

    #expect(baked.width == 2)
    #expect(baked.height == 4)
    let pixels = try #require(rgba(of: baked))
    #expect(pixels[0] == 255) // top-left is white
    #expect(pixels[(baked.height - 1) * baked.width * 4] == 0) // bottom-left is black
  }

  @Test
  func `bakeOrientation applies mirrored orientations`() throws {
    // .upMirrored (EXIF 2) flips horizontally: the buffer's white left half
    // displays on the right.
    let image = makeHalfWhiteImage(orientation: .upMirrored)

    let baked = try #require(ExpoCameraUtils.bakeOrientation(image: image).cgImage)

    #expect(baked.width == 4)
    #expect(baked.height == 2)
    let pixels = try #require(rgba(of: baked))
    #expect(pixels[0] == 0) // top-left is black
    #expect(pixels[(baked.width - 1) * 4] == 255) // top-right is white
  }

  @Test
  func `encodeForSave writes the capture orientation and returns display dimensions`() throws {
    let image = makeImage(bufferWidth: 400, bufferHeight: 300, orientation: .right)

    let encoded = try ExpoCameraUtils.encodeForSave(image: image, metadata: nil, quality: 1, includeBase64: false)

    #expect(encoded.width == 300)
    #expect(encoded.height == 400)
    #expect(encoded.base64 == nil)

    let source = try #require(CGImageSourceCreateWithData(encoded.data as CFData, nil))
    let props = try #require(CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any])
    #expect(props[kCGImagePropertyOrientation] as? Int == 6)
  }

  @Test
  func `encodeForSave includes base64 only when requested`() throws {
    let image = makeImage(bufferWidth: 100, bufferHeight: 100, orientation: .up)

    let withBase64 = try ExpoCameraUtils.encodeForSave(image: image, metadata: nil, quality: 1, includeBase64: true)
    let withoutBase64 = try ExpoCameraUtils.encodeForSave(image: image, metadata: nil, quality: 1, includeBase64: false)

    #expect(withBase64.base64?.isEmpty == false)
    #expect(withoutBase64.base64 == nil)
  }

  private func makeImage(bufferWidth: Int, bufferHeight: Int, orientation: UIImage.Orientation) -> UIImage {
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1
    let base = UIGraphicsImageRenderer(
      size: CGSize(width: bufferWidth, height: bufferHeight),
      format: format
    ).image { context in
      UIColor.gray.setFill()
      context.fill(CGRect(x: 0, y: 0, width: bufferWidth, height: bufferHeight))
    }
    return UIImage(cgImage: base.cgImage!, scale: 1, orientation: orientation)
  }

  // A 4x2 buffer with the left half white and the right half black.
  private func makeHalfWhiteImage(orientation: UIImage.Orientation) -> UIImage {
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1
    let base = UIGraphicsImageRenderer(size: CGSize(width: 4, height: 2), format: format).image { context in
      UIColor.black.setFill()
      context.fill(CGRect(x: 0, y: 0, width: 4, height: 2))
      UIColor.white.setFill()
      context.fill(CGRect(x: 0, y: 0, width: 2, height: 2))
    }
    return UIImage(cgImage: base.cgImage!, scale: 1, orientation: orientation)
  }

  // RGBA8 bytes of the image, rows top to bottom.
  private func rgba(of cgImage: CGImage) -> [UInt8]? {
    let width = cgImage.width
    let height = cgImage.height
    var data = [UInt8](repeating: 0, count: width * height * 4)
    let drawn = data.withUnsafeMutableBytes { buffer -> Bool in
      guard let context = CGContext(
        data: buffer.baseAddress,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: width * 4,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
      ) else {
        return false
      }
      context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
      return true
    }
    return drawn ? data : nil
  }
}
