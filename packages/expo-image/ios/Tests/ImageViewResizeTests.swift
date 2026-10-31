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

private func square(_ points: CGFloat) -> CGRect {
  return CGRect(x: 0, y: 0, width: points, height: points)
}

/// A view that rendered a square image from a temporary file.
@MainActor
private struct LoadedView {
  let view: ImageView
  let url: URL
  let image: UIImage
  let operation: SDWebImageCombinedOperation?

  /// Loads an image of `imagePoints` at the screen scale into a view of `viewPoints`.
  init(imagePoints: CGFloat, viewPoints: CGFloat, contentFit: ContentFit = .cover) async throws {
    view = ImageView()
    url = try makeImageFile(pixels: imagePoints * view.screenScale)
    var source = ImageSource()
    source.uri = url
    view.contentFit = contentFit
    view.sources = [source]
    view.bounds = square(viewPoints)
    try await waitUntil { [view] in view.sourceImage != nil }
    image = try #require(view.sourceImage)
    operation = view.pendingOperation
  }

  /// Whether the view still shows the same image and did not start a new load.
  var keptImage: Bool {
    return view.pendingOperation === operation && view.sourceImage === image
  }

  func removeFile() {
    try? FileManager.default.removeItem(at: url)
  }
}

@MainActor
@Suite("ImageView resizing")
struct ImageViewResizeTests {
  @Test
  func `keeps the rendered image when the view shrinks`() async throws {
    let loaded = try await LoadedView(imagePoints: 200, viewPoints: 100)
    defer { loaded.removeFile() }

    loaded.view.bounds = square(80)

    #expect(loaded.keptImage)
  }

  @Test
  func `reloads when the view grows past the downscaled image`() async throws {
    let loaded = try await LoadedView(imagePoints: 200, viewPoints: 100)
    defer { loaded.removeFile() }

    loaded.view.bounds = square(150)

    #expect(!loaded.keptImage)
  }

  @Test
  func `keeps the full-size image when the view grows`() async throws {
    let loaded = try await LoadedView(imagePoints: 100, viewPoints: 100)
    defer { loaded.removeFile() }

    loaded.view.bounds = square(150)

    #expect(loaded.keptImage)
  }

  @Test
  func `reloads a scale-down image when the view shrinks`() async throws {
    // `scale-down` shows the image at its own size, so a kept image would not shrink with the view.
    let loaded = try await LoadedView(imagePoints: 200, viewPoints: 100, contentFit: .scaleDown)
    defer { loaded.removeFile() }

    loaded.view.bounds = square(80)

    #expect(!loaded.keptImage)
  }

  @Test
  func `reloads after the sources change`() async throws {
    let loaded = try await LoadedView(imagePoints: 200, viewPoints: 100)
    defer { loaded.removeFile() }

    loaded.view.sources = loaded.view.sources
    loaded.view.bounds = square(80)

    #expect(!loaded.keptImage)
  }
}
