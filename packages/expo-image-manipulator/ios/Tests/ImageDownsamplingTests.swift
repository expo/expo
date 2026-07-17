// Copyright 2026-present 650 Industries. All rights reserved.

import CoreGraphics
import ImageIO
import Testing
import UIKit
import UniformTypeIdentifiers

@testable import ExpoImageManipulator

@Suite("ImageDownsampling")
struct ImageDownsamplingTests {
  // MARK: - downsampledMaxPixelSize

  @Test
  func `returns nil when no bounds are given`() {
    #expect(downsampledMaxPixelSize(width: 100, height: 50, maxWidth: nil, maxHeight: nil) == nil)
  }

  @Test
  func `returns nil when the image fits within the bounds`() {
    #expect(downsampledMaxPixelSize(width: 100, height: 50, maxWidth: 100, maxHeight: 50) == nil)
    #expect(downsampledMaxPixelSize(width: 100, height: 50, maxWidth: 200, maxHeight: nil) == nil)
    #expect(downsampledMaxPixelSize(width: 100, height: 50, maxWidth: nil, maxHeight: 80) == nil)
  }

  @Test
  func `caps the longest side when maxWidth requires downscaling`() {
    // 100×50 bounded to maxWidth 50 → scale 0.5 → longest side 50
    #expect(downsampledMaxPixelSize(width: 100, height: 50, maxWidth: 50, maxHeight: nil) == 50)
  }

  @Test
  func `caps the longest side when maxHeight requires downscaling`() {
    // 100×50 bounded to maxHeight 25 → scale 0.5 → longest side 50
    #expect(downsampledMaxPixelSize(width: 100, height: 50, maxWidth: nil, maxHeight: 25) == 50)
  }

  @Test
  func `uses the most restrictive bound when both are given`() {
    // maxWidth 50 → scale 0.5, maxHeight 10 → scale 0.2 → longest side 100 * 0.2 = 20
    #expect(downsampledMaxPixelSize(width: 100, height: 50, maxWidth: 50, maxHeight: 10) == 20)
  }

  @Test
  func `ignores non-positive bounds`() {
    #expect(downsampledMaxPixelSize(width: 100, height: 50, maxWidth: 0, maxHeight: -10) == nil)
  }

  // MARK: - decodeDownsampledImage

  @Test
  func `decodes a file to at most the given bounds`() throws {
    let url = try makeJpegFile(width: 100, height: 50)
    defer { try? FileManager.default.removeItem(at: url) }

    let image = try #require(decodeDownsampledImage(at: url, maxWidth: 50, maxHeight: nil))
    let cgImage = try #require(image.cgImage)

    #expect(cgImage.width == 50)
    #expect(cgImage.height == 25)
    #expect(image.imageOrientation == .up)
  }

  @Test
  func `returns nil when the file already fits within the bounds`() throws {
    let url = try makeJpegFile(width: 100, height: 50)
    defer { try? FileManager.default.removeItem(at: url) }

    #expect(decodeDownsampledImage(at: url, maxWidth: 200, maxHeight: 200) == nil)
    #expect(decodeDownsampledImage(at: url, maxWidth: nil, maxHeight: nil) == nil)
  }

  @Test
  func `applies bounds to the oriented dimensions of a rotated image`() throws {
    // Physical pixels are 100×50, but EXIF orientation 6 (90° CW) makes the displayed image 50×100.
    let url = try makeJpegFile(width: 100, height: 50, exifOrientation: 6)
    defer { try? FileManager.default.removeItem(at: url) }

    let image = try #require(decodeDownsampledImage(at: url, maxWidth: nil, maxHeight: 50))
    let cgImage = try #require(image.cgImage)

    // Oriented 50×100 bounded to maxHeight 50 → 25×50, with the rotation baked into the pixels.
    #expect(cgImage.width == 25)
    #expect(cgImage.height == 50)
    #expect(image.imageOrientation == .up)
  }

  @Test
  func `decodes a data url to at most the given bounds`() throws {
    let data = try makeJpegData(width: 100, height: 50)
    let image = try #require(decodeDownsampledImage(data: data, maxWidth: nil, maxHeight: 25))
    let cgImage = try #require(image.cgImage)

    #expect(cgImage.width == 50)
    #expect(cgImage.height == 25)
  }

  // MARK: - downscaledIfExceedsBounds

  @Test
  func `downscales an already decoded image that exceeds the bounds`() throws {
    let image = makeImage(width: 100, height: 50)
    let result = downscaledIfExceedsBounds(image, maxWidth: 40, maxHeight: nil)
    let cgImage = try #require(result.cgImage)

    #expect(cgImage.width == 40)
    #expect(cgImage.height == 20)
  }

  @Test
  func `returns the same image when it fits within the bounds`() {
    let image = makeImage(width: 100, height: 50)

    #expect(downscaledIfExceedsBounds(image, maxWidth: nil, maxHeight: nil) === image)
    #expect(downscaledIfExceedsBounds(image, maxWidth: 100, maxHeight: 50) === image)
  }

  // MARK: - Helpers

  private func makeImage(width: Int, height: Int) -> UIImage {
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1
    return UIGraphicsImageRenderer(size: CGSize(width: width, height: height), format: format).image { context in
      UIColor.red.setFill()
      context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    }
  }

  private func makeJpegData(width: Int, height: Int, exifOrientation: Int? = nil) throws -> Data {
    let image = makeImage(width: width, height: height)
    guard let cgImage = image.cgImage else {
      throw TestError.imageCreationFailed
    }
    let data = NSMutableData()
    guard let destination = CGImageDestinationCreateWithData(data, UTType.jpeg.identifier as CFString, 1, nil) else {
      throw TestError.imageCreationFailed
    }
    var properties: [CFString: Any] = [:]
    if let exifOrientation {
      properties[kCGImagePropertyOrientation] = exifOrientation
    }
    CGImageDestinationAddImage(destination, cgImage, properties as CFDictionary)
    guard CGImageDestinationFinalize(destination) else {
      throw TestError.imageCreationFailed
    }
    return data as Data
  }

  private func makeJpegFile(width: Int, height: Int, exifOrientation: Int? = nil) throws -> URL {
    let data = try makeJpegData(width: width, height: height, exifOrientation: exifOrientation)
    let url = FileManager.default.temporaryDirectory
      .appendingPathComponent(UUID().uuidString)
      .appendingPathExtension("jpg")
    try data.write(to: url)
    return url
  }

  private enum TestError: Error {
    case imageCreationFailed
  }
}
