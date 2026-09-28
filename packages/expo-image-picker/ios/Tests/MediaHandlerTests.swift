import Foundation
import Testing
import UIKit
import UniformTypeIdentifiers

@testable import ExpoImagePicker

private func makeSquareImage(side: Int) -> UIImage {
  let format = UIGraphicsImageRendererFormat()
  format.scale = 1
  let size = CGSize(width: side, height: side)
  return UIGraphicsImageRenderer(size: size, format: format).image { context in
    UIColor.red.setFill()
    context.fill(CGRect(origin: .zero, size: size))
  }
}

@Suite("MediaHandler")
struct MediaHandlerTests {
  @Test
  func `throws FailedToReadImageException when a requested crop produced no image`() async {
    var options = ImagePickerOptions()
    options.allowsEditing = true
    let handler = MediaHandler(fileSystem: nil, options: options)

    let mediaInfo: MediaInfo = [
      .mediaType: UTType.image.identifier,
      .originalImage: makeSquareImage(side: 10),
      .cropRect: CGRect(x: 100, y: 100, width: 6, height: 6)
    ]

    await #expect(throws: FailedToReadImageException.self) {
      try await handler.handleMedia(mediaInfo)
    }
  }
}
