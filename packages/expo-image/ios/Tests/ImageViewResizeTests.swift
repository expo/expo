import Foundation
import Testing
import UIKit

internal import SDWebImage

@testable import ExpoImage

/// Writes a square PNG of the given size in pixels to a new temporary file.
private func makeImageFile(pixels: CGFloat) throws -> URL {
  let format = UIGraphicsImageRendererFormat()
  format.scale = 1
  let data = UIGraphicsImageRenderer(size: CGSize(width: pixels, height: pixels), format: format).pngData { context in
    UIColor.red.setFill()
    context.fill(CGRect(x: 0, y: 0, width: pixels, height: pixels))
  }
  let url = FileManager.default.temporaryDirectory.appendingPathComponent("expo-image-test-\(UUID().uuidString).png")
  try data.write(to: url)
  return url
}

@MainActor
private func waitUntil(_ condition: () -> Bool) async throws {
  for _ in 0..<500 where !condition() {
    try await Task.sleep(for: .milliseconds(10))
  }
}

@MainActor
@Suite("ImageView resizing")
struct ImageViewResizeTests {
  @Test
  func `keeps the rendered image when the view shrinks`() async throws {
    let url = try makeImageFile(pixels: 400)
    defer { try? FileManager.default.removeItem(at: url) }
    var source = ImageSource()
    source.uri = url
    let view = ImageView()
    view.sources = [source]

    // The view downscales the image for its size, which needs fewer pixels than the file has.
    view.bounds = CGRect(x: 0, y: 0, width: 100, height: 100)
    try await waitUntil { view.sourceImage != nil }
    let image = try #require(view.sourceImage)
    let operation = view.pendingOperation

    view.bounds = CGRect(x: 0, y: 0, width: 80, height: 80)

    #expect(view.pendingOperation === operation)
    #expect(view.sourceImage === image)
  }
}
