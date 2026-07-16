import Testing
import UIKit
import AVFoundation

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
}
