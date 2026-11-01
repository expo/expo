// Copyright 2026-present 650 Industries. All rights reserved.

import CoreGraphics
import Testing
import UIKit

@testable import ExpoImageManipulator

@Suite("ImageResizeTransformer")
struct ImageResizeTransformerTests {
  // Calculated heights: 13.33 → 13, 5.63 → 6, 0.25 → 1
  @Test(arguments: [(30, 40, 13), (16, 9, 6), (40, 1, 1)])
  func `rounds the calculated height to whole pixels`(sourceWidth: Int, sourceHeight: Int, expectedHeight: Int) async throws {
    var options = ResizeOptions()
    options.width = 10

    let result = await ImageResizeTransformer(options: options).transform(image: try makeImage(width: sourceWidth, height: sourceHeight))
    let pixels = try #require(result.cgImage)

    #expect(pixels.width == 10)
    #expect(pixels.height == expectedHeight)
    try expectOpaque(pixels)
  }

  // Calculated widths: 13.33 → 13, 5.63 → 6, 0.25 → 1
  @Test(arguments: [(40, 30, 13), (9, 16, 6), (1, 40, 1)])
  func `rounds the calculated width to whole pixels`(sourceWidth: Int, sourceHeight: Int, expectedWidth: Int) async throws {
    var options = ResizeOptions()
    options.height = 10

    let result = await ImageResizeTransformer(options: options).transform(image: try makeImage(width: sourceWidth, height: sourceHeight))
    let pixels = try #require(result.cgImage)

    #expect(pixels.width == expectedWidth)
    #expect(pixels.height == 10)
    try expectOpaque(pixels)
  }

  private func makeImage(width: Int, height: Int) throws -> UIImage {
    let provider = try #require(CGDataProvider(data: Data(repeating: 255, count: width * height * 4) as CFData))
    let colorSpace = try #require(CGColorSpace(name: CGColorSpace.sRGB))
    let image = try #require(CGImage(
      width: width, height: height, bitsPerComponent: 8, bitsPerPixel: 32, bytesPerRow: width * 4,
      space: colorSpace,
      bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
      provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent
    ))
    return UIImage(cgImage: image)
  }

  private func expectOpaque(_ image: CGImage) throws {
    let colorSpace = try #require(CGColorSpace(name: CGColorSpace.sRGB))
    let context = try #require(CGContext(
      data: nil, width: image.width, height: image.height, bitsPerComponent: 8, bytesPerRow: image.width * 4,
      space: colorSpace,
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue
    ))
    context.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
    let bytes = try #require(context.data).assumingMemoryBound(to: UInt8.self)
    for y in 0..<image.height {
      for x in 0..<image.width {
        #expect(bytes[y * context.bytesPerRow + x * 4 + 3] == 255, "pixel (\(x), \(y)) is not opaque")
      }
    }
  }
}
