import Testing
import UIKit
import ImageIO

@testable import ExpoCamera

@Suite("CapturedPhotoProcessor")
struct CapturedPhotoProcessorTests {
  // A UIImage whose CGImage is the sensor buffer; `orientation` is the display transform.
  private func makeImage(bufferWidth: Int, bufferHeight: Int, orientation: UIImage.Orientation) -> UIImage {
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1
    let renderer = UIGraphicsImageRenderer(
      size: CGSize(width: bufferWidth, height: bufferHeight),
      format: format
    )
    let base = renderer.image { context in
      UIColor.darkGray.setFill()
      context.fill(CGRect(x: 0, y: 0, width: bufferWidth, height: bufferHeight))
    }
    return UIImage(cgImage: base.cgImage!, scale: 1, orientation: orientation)
  }

  @Test
  func `portrait capture keeps the real orientation tag and buffer pixel dimensions`() throws {
    // Portrait: landscape sensor buffer tagged .right (EXIF 6).
    let image = makeImage(bufferWidth: 400, bufferHeight: 300, orientation: .right)
    let request = CaptureRequest(exif: true, quality: 1, imageType: .jpg, additionalExif: nil)

    let result = try CapturedPhotoProcessor().process(
      image: image,
      sourceMetadata: [kCGImagePropertyExifDictionary as String: [String: Any]()],
      request: request
    )

    #expect(result.width == 300)
    #expect(result.height == 400)

    let exif = try #require(result.exif)
    #expect(exif["Orientation"] as? Int == 6)
    #expect(exif[kCGImagePropertyExifPixelXDimension as String] as? Int == 400)
    #expect(exif[kCGImagePropertyExifPixelYDimension as String] as? Int == 300)
  }

  // Orientation tag varies by device orientation; pixel dimensions always describe the 400x300 buffer.
  @Test(arguments: [
    (UIImage.Orientation.up, 1, 400.0, 300.0),
    (.down, 3, 400.0, 300.0),
    (.left, 8, 300.0, 400.0),
    (.upMirrored, 2, 400.0, 300.0),
    (.downMirrored, 4, 400.0, 300.0),
    (.leftMirrored, 5, 300.0, 400.0),
    (.rightMirrored, 7, 300.0, 400.0),
  ] as [(UIImage.Orientation, Int, Double, Double)])
  func `orientation tag varies and pixel dimensions are never transposed`(
    orientation: UIImage.Orientation,
    exifOrientation: Int,
    expectedWidth: Double,
    expectedHeight: Double
  ) throws {
    let image = makeImage(bufferWidth: 400, bufferHeight: 300, orientation: orientation)
    let request = CaptureRequest(exif: true, quality: 1, imageType: .jpg, additionalExif: nil)

    let result = try CapturedPhotoProcessor().process(
      image: image,
      sourceMetadata: [kCGImagePropertyExifDictionary as String: [String: Any]()],
      request: request
    )

    #expect(result.width == expectedWidth)
    #expect(result.height == expectedHeight)

    let exif = try #require(result.exif)
    #expect(exif["Orientation"] as? Int == exifOrientation)
    #expect(exif[kCGImagePropertyExifPixelXDimension as String] as? Int == 400)
    #expect(exif[kCGImagePropertyExifPixelYDimension as String] as? Int == 300)
  }

  @Test
  func `capture without exif returns display dimensions and no exif dictionary`() throws {
    let image = makeImage(bufferWidth: 400, bufferHeight: 300, orientation: .right)
    let request = CaptureRequest(exif: false, quality: 1, imageType: .jpg, additionalExif: nil)

    let result = try CapturedPhotoProcessor().process(image: image, sourceMetadata: [:], request: request)

    #expect(result.width == 300)
    #expect(result.height == 400)
    #expect(result.exif == nil)
    #expect(!result.data.isEmpty)
  }

  @Test
  func `encoded file matches the reported buffer dimensions and orientation tag`() throws {
    let image = makeImage(bufferWidth: 400, bufferHeight: 300, orientation: .right)
    let request = CaptureRequest(exif: true, quality: 1, imageType: .jpg, additionalExif: nil)

    let result = try CapturedPhotoProcessor().process(
      image: image,
      sourceMetadata: [kCGImagePropertyExifDictionary as String: [String: Any]()],
      request: request
    )

    let source = try #require(CGImageSourceCreateWithData(result.data as CFData, nil))
    let props = try #require(CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any])

    #expect(props[kCGImagePropertyPixelWidth] as? Int == 400)
    #expect(props[kCGImagePropertyPixelHeight] as? Int == 300)
    #expect(props[kCGImagePropertyOrientation] as? Int == 6)
  }

  @Test
  func `additionalExif is reflected in the returned exif and encoded as GPS metadata`() throws {
    let image = makeImage(bufferWidth: 400, bufferHeight: 300, orientation: .right)
    let additionalExif: [String: Any] = ["GPSLatitude": 37.33, "GPSLongitude": -122.03]
    let request = CaptureRequest(exif: true, quality: 1, imageType: .jpg, additionalExif: additionalExif)

    let result = try CapturedPhotoProcessor().process(
      image: image,
      sourceMetadata: [kCGImagePropertyExifDictionary as String: [String: Any]()],
      request: request
    )

    // The returned exif reflects the additional keys, so the response and the file agree.
    let exif = try #require(result.exif)
    #expect(exif["GPSLatitude"] as? Double == 37.33)

    // The encoded file carries a GPS dictionary with the mapped coordinates and hemisphere refs.
    let source = try #require(CGImageSourceCreateWithData(result.data as CFData, nil))
    let props = try #require(CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any])
    let gps = try #require(props[kCGImagePropertyGPSDictionary] as? [CFString: Any])
    #expect(gps[kCGImagePropertyGPSLatitude] as? Double == 37.33)
    #expect(gps[kCGImagePropertyGPSLatitudeRef] as? String == "N")
    #expect(gps[kCGImagePropertyGPSLongitude] as? Double == 122.03)
    #expect(gps[kCGImagePropertyGPSLongitudeRef] as? String == "W")
  }
}
