import Foundation
import Testing
import UIKit

internal import SDWebImage

@testable import ExpoImage

private func makeImageFile(pixelSize: CGSize) throws -> URL {
  let format = UIGraphicsImageRendererFormat()
  format.scale = 1
  let data = UIGraphicsImageRenderer(size: pixelSize, format: format).pngData { context in
    UIColor.red.setFill()
    context.fill(CGRect(origin: .zero, size: pixelSize))
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

@MainActor
private struct LoadedView {
  let view: ImageView
  let url: URL
  let image: UIImage
  let operation: SDWebImageCombinedOperation?

  init(imageSize: CGSize, bounds: CGRect, contentFit: ContentFit = .cover) async throws {
    view = ImageView()
    url = try makeImageFile(pixelSize: imageSize * view.screenScale)
    var source = ImageSource()
    source.uri = url
    view.contentFit = contentFit
    view.sources = [source]
    view.bounds = bounds
    try await waitUntil { [view] in return view.sourceImage != nil }
    image = try #require(view.sourceImage)
    operation = view.pendingOperation
  }

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
    let loaded = try await LoadedView(imageSize: square(200).size, bounds: square(100))
    defer { loaded.removeFile() }

    loaded.view.bounds = square(80)

    #expect(loaded.keptImage)
  }

  @Test
  func `keeps the full-size image when the view grows`() async throws {
    let loaded = try await LoadedView(imageSize: square(100).size, bounds: square(100))
    defer { loaded.removeFile() }

    loaded.view.bounds = square(150)

    #expect(loaded.keptImage)
  }

  @Test
  func `keeps a scale-down image when its size does not change`() async throws {
    let loaded = try await LoadedView(imageSize: square(200).size, bounds: square(100), contentFit: .scaleDown)
    defer { loaded.removeFile() }

    loaded.view.bounds = CGRect(x: 0, y: 0, width: 100, height: 150)

    #expect(loaded.keptImage)
  }

  @Test
  func `keeps a full-size scale-down image when the view grows`() async throws {
    let loaded = try await LoadedView(imageSize: square(100).size, bounds: square(150), contentFit: .scaleDown)
    defer { loaded.removeFile() }

    loaded.view.bounds = square(200)

    #expect(loaded.keptImage)
  }

  @Test
  func `keeps a none image when the view resizes`() async throws {
    let loaded = try await LoadedView(imageSize: square(200).size, bounds: square(100), contentFit: .none)
    defer { loaded.removeFile() }

    loaded.view.bounds = square(80)

    #expect(loaded.keptImage)
  }

  @Test
  func `keeps the aspect ratio of the source when it downscales`() async throws {
    let loaded = try await LoadedView(
      imageSize: CGSize(width: 400, height: 4),
      bounds: CGRect(x: 0, y: 0, width: 101, height: 1)
    )
    defer { loaded.removeFile() }

    let aspectRatio = loaded.image.size.width / loaded.image.size.height
    #expect(abs(aspectRatio - 100) < 2)
  }
}
