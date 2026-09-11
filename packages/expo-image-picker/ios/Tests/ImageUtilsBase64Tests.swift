import Foundation
import Testing
import UIKit

@testable import ExpoImagePicker

// A 1x1 red PNG - a non-JPEG source we can decode and re-encode.
private let pngData = Data(
  base64Encoded: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)!

// JPEG files always start with the SOI marker 0xFF 0xD8.
private func isJpeg(_ data: Data) -> Bool {
  return data.count >= 2 && data[0] == 0xFF && data[1] == 0xD8
}

@Suite("ImageUtils base64")
struct ImageUtilsBase64Tests {
  @Test
  func `encodes an in-memory image as JPEG`() throws {
    let image = try #require(UIImage(data: pngData))

    let base64 = try #require(try ImageUtils.readJpegBase64From(image: image, compressionQuality: 1.0))
    let decoded = try #require(Data(base64Encoded: base64))

    #expect(isJpeg(decoded))
  }

  @Test
  func `re-encodes a non-JPEG file as JPEG`() throws {
    let fileUrl = FileManager.default.temporaryDirectory
      .appendingPathComponent("expo-image-picker-test-\(UUID().uuidString).png")
    try pngData.write(to: fileUrl)
    defer { try? FileManager.default.removeItem(at: fileUrl) }

    let base64 = try #require(try ImageUtils.readJpegBase64From(fileUrl: fileUrl, compressionQuality: 1.0))
    let decoded = try #require(Data(base64Encoded: base64))

    // The source file is PNG; the output must not preserve that format.
    #expect(isJpeg(decoded))
  }
}
