import CoreImage
import CoreText
import Foundation
import ImageIO
import Testing

#if !LANGUAGE_MODELS_INTEGRATION_RUNNER
@testable import ExpoAI
#endif

// These integration checks invoke OS-provided recognition backends, without mocks.
// Enable them explicitly on a host or device with the required Vision backend.
@Suite(
  "Vision extraction with generated images",
  .serialized,
  .enabled(if: ProcessInfo.processInfo.environment["EXPO_LOCAL_LANGUAGE_MODELS_VISION_TESTS"] == "1")
)
struct LanguageModelVisionTests {
  @Test
  func recognizesText() async throws {
    guard #available(iOS 18.0, macOS 15.0, *) else { return }
    let context = try #require(
      CGContext(
        data: nil,
        width: 640,
        height: 160,
        bitsPerComponent: 8,
        bytesPerRow: 640 * 4,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
      )
    )
    context.setFillColor(CGColor(gray: 1, alpha: 1))
    context.fill(CGRect(x: 0, y: 0, width: 640, height: 160))
    let text = NSAttributedString(
      string: "EXPO LOCAL MODELS",
      attributes: [
        NSAttributedString.Key(kCTFontAttributeName as String): CTFontCreateWithName("Helvetica" as CFString, 40, nil),
        NSAttributedString.Key(kCTForegroundColorAttributeName as String): CGColor(gray: 0, alpha: 1)
      ]
    )
    context.textPosition = CGPoint(x: 30, y: 70)
    CTLineDraw(CTLineCreateWithAttributedString(text), context)
    let content = try fixture(try #require(context.makeImage()))
    defer { try? FileManager.default.removeItem(at: content.url) }
    let json = try await LanguageModelVision.perform(kind: .ocr, content: content.image)
    let result = try #require(JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: String])
    #expect(result["text"] == "EXPO LOCAL MODELS")
  }

  @Test
  func recognizesBarcode() async throws {
    guard #available(iOS 18.0, macOS 15.0, *) else { return }
    let payload = "expo-ai-synthetic-fixture"
    let filter = try #require(CIFilter(name: "CIQRCodeGenerator", parameters: ["inputMessage": Data(payload.utf8), "inputCorrectionLevel": "M"]))
    let qr = try #require(filter.outputImage).transformed(by: CGAffineTransform(scaleX: 8, y: 8))
    let image = try #require(CIContext(options: [.useSoftwareRenderer: true]).createCGImage(qr, from: qr.extent))
    let content = try fixture(image)
    defer { try? FileManager.default.removeItem(at: content.url) }
    let json = try await LanguageModelVision.perform(kind: .barcode, content: content.image)
    let result = try #require(JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: [[String: String]]])
    #expect(result["barcodes"]?.contains(["payload": payload, "symbology": "qr"]) == true)
  }

  @Test
  func preservesImageOrientation() throws {
    let context = try #require(CGContext(data: nil, width: 2, height: 4, bitsPerComponent: 8, bytesPerRow: 8,
      space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
    let content = try fixture(try #require(context.makeImage()), orientation: .right)
    defer { try? FileManager.default.removeItem(at: content.url) }
    #expect(content.image.orientation == .right)
    #expect(content.image.image.width == 2)
    #expect(content.image.image.height == 4)
  }

  @Test
  func cancelledVisionTaskDoesNotReturnResults() async throws {
    guard #available(iOS 18.0, macOS 15.0, *) else { return }
    let context = try #require(
      CGContext(
        data: nil,
        width: 1,
        height: 1,
        bitsPerComponent: 8,
        bytesPerRow: 4,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
      )
    )
    let content = try fixture(try #require(context.makeImage()))
    defer { try? FileManager.default.removeItem(at: content.url) }
    let started = AsyncStream<Void>.makeStream()
    let resume = AsyncStream<Void>.makeStream()
    let task = Task {
      started.continuation.yield(())
      for await _ in resume.stream { break }
      return try await LanguageModelVision.perform(kind: .ocr, content: content.image)
    }
    for await _ in started.stream { break }
    task.cancel()
    resume.continuation.yield(())
    resume.continuation.finish()
    started.continuation.finish()
    await #expect(throws: CancellationError.self) { try await task.value }
  }

  private func fixture(_ image: CGImage, orientation: CGImagePropertyOrientation = .up) throws -> (image: LanguageModelImageContent, url: URL) {
    let url = FileManager.default.temporaryDirectory.appendingPathComponent("local-models-\(UUID().uuidString).png")
    let destination = try #require(CGImageDestinationCreateWithURL(url as CFURL, "public.png" as CFString, 1, nil))
    CGImageDestinationAddImage(destination, image, [kCGImagePropertyOrientation: orientation.rawValue] as CFDictionary)
    try #require(CGImageDestinationFinalize(destination))
    return (try LanguageModelImageContent(url: url), url)
  }
}
