import Foundation
import Testing
import UIKit

@testable import ExpoImage

/// `ImageView2` relies on these rules of the pipeline. Another backend must keep them.
@Suite("SDWebImage pipeline")
struct SDWebImagePipelineTests {
  private let pipeline = SDWebImagePipeline.shared

  private func makeImageFile() throws -> URL {
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1
    let data = UIGraphicsImageRenderer(size: CGSize(width: 20, height: 10), format: format).pngData { context in
      UIColor.blue.setFill()
      context.fill(CGRect(x: 0, y: 0, width: 20, height: 10))
    }
    let url = FileManager.default.temporaryDirectory.appendingPathComponent("expo-image-pipeline-\(UUID().uuidString).png")
    try data.write(to: url)
    return url
  }

  private func request(_ url: URL, cachePolicy: ImageCachePolicy) -> ImagePipelineRequest {
    return ImagePipelineRequest(
      uri: url, width: 0, height: 0, scale: 1, headers: nil, cacheKey: nil, cachePolicy: cachePolicy
    )
  }

  @Test
  func `returns a loaded image from the memory cache without a load`() async throws {
    let url = try makeImageFile()
    defer { try? FileManager.default.removeItem(at: url) }
    #expect(pipeline.cachedImage(for: request(url, cachePolicy: .memory)) == nil)

    let loaded = try await pipeline.image(for: request(url, cachePolicy: .memory), progress: nil)
    #expect(loaded.cacheType == ImageCacheType.none)

    let cached = pipeline.cachedImage(for: request(url, cachePolicy: .memory))
    #expect(cached?.cacheType == .memory)
  }

  @Test
  func `doesn't read the memory cache for the disk policy`() async throws {
    let url = try makeImageFile()
    defer { try? FileManager.default.removeItem(at: url) }

    _ = try await pipeline.image(for: request(url, cachePolicy: .memory), progress: nil)

    #expect(pipeline.cachedImage(for: request(url, cachePolicy: .disk)) == nil)
  }

  @Test
  func `throws CancellationError for a canceled load`() async throws {
    let url = try makeImageFile()
    defer { try? FileManager.default.removeItem(at: url) }

    let uncachedRequest = request(url, cachePolicy: .none)
    let task = Task { [pipeline] in
      try await pipeline.image(for: uncachedRequest, progress: nil)
    }
    task.cancel()

    await #expect(throws: CancellationError.self) {
      try await task.value
    }
  }
}
