import Foundation
import Testing
import ExpoModulesCore

internal import SDWebImage

@testable import ExpoImage

@Suite("generatePlaceholder")
struct GeneratePlaceholderTests {
  @Test(.timeLimit(.minutes(1)))
  func `fails when the loader fails with an unfinished load`() async {
    let source = Either<Image, URL>(URL(string: "blurhash:/LEHV6nWB2yk8pyo0adR*.7kCMdnj"))

    let failed = await withCheckedContinuation { continuation in
      ImageModule.generatePlaceholder(source: source, loader: BlurhashLoader(), onFailure: {
        continuation.resume(returning: true)
      }, generator: { _ in
        continuation.resume(returning: false)
      })
    }

    #expect(failed)
  }
}
