// Copyright 2026-present 650 Industries. All rights reserved.

import CoreGraphics
import Testing
import UIKit

@testable import ExpoImageManipulator

@Suite("ImageFixOrientationTransformer")
struct ImageFixOrientationTransformerTests {
  @Test(arguments: [
    UIImage.Orientation.up, .upMirrored, .down, .downMirrored,
    .left, .leftMirrored, .right, .rightMirrored
  ], [CGFloat(1), 3])
  func `normalizes all orientations at full pixel resolution`(orientation: UIImage.Orientation, scale: CGFloat) async throws {
    let source = try makeImage()
    let image = UIImage(cgImage: source, scale: scale, orientation: orientation)

    let result = try await ImageFixOrientationTransformer().transform(image: image)
    let pixels = try #require(result.cgImage)
    let swapsDimensions = [UIImage.Orientation.left, .leftMirrored, .right, .rightMirrored].contains(orientation)

    #expect(result.imageOrientation == .up)
    #expect(result.scale == 1)
    #expect(pixels.width == (swapsDimensions ? 40 : 60))
    #expect(pixels.height == (swapsDimensions ? 60 : 40))
    #expect(result.size == CGSize(width: pixels.width, height: pixels.height))

    // Displayed tile order per orientation.
    let expected: [UIImage.Orientation: [Int]] = [
      .up: [0, 1, 2, 3, 4, 5],
      .upMirrored: [2, 1, 0, 5, 4, 3],
      .down: [5, 4, 3, 2, 1, 0],
      .downMirrored: [3, 4, 5, 0, 1, 2],
      .left: [2, 5, 1, 4, 0, 3],
      .leftMirrored: [0, 3, 1, 4, 2, 5],
      .right: [3, 0, 4, 1, 5, 2],
      .rightMirrored: [5, 2, 4, 1, 3, 0]
    ]
    try expectTiles(pixels, columns: swapsDimensions ? 2 : 3, expected: #require(expected[orientation]))
  }

  @Test
  func `returns an upright scale one image without redrawing`() async throws {
    let image = UIImage(cgImage: try makeImage())

    let result = try await ImageFixOrientationTransformer().transform(image: image)

    #expect(result === image)
  }

  @Test(arguments: [CGFloat(1), 3])
  func `preserves the upright high bit depth bitmap without redrawing`(scale: CGFloat) async throws {
    let colorSpace = try #require(CGColorSpace(name: CGColorSpace.displayP3))
    let context = try #require(CGContext(
      data: nil, width: 60, height: 40, bitsPerComponent: 16, bytesPerRow: 0,
      space: colorSpace,
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ))
    let source = try #require(context.makeImage())
    let image = UIImage(cgImage: source, scale: scale, orientation: .up)

    let result = try await ImageFixOrientationTransformer().transform(image: image)
    let pixels = try #require(result.cgImage)

    #expect(pixels === source)
    #expect(pixels.bitsPerComponent == 16)
    #expect(pixels.colorSpace?.name == CGColorSpace.displayP3)
    #expect(result.scale == 1)
    #expect(result.size == CGSize(width: 60, height: 40))
  }

  @Test(arguments: [
    UIImage.Orientation.up, .upMirrored, .down, .downMirrored,
    .left, .leftMirrored, .right, .rightMirrored
  ])
  func `accepts a ten bit bitmap in every orientation`(orientation: UIImage.Orientation) async throws {
    // Built directly so the test does not depend on the HEIC decoder's output format. All bytes 255 = opaque white.
    let colorSpace = try #require(CGColorSpace(name: CGColorSpace.displayP3))
    let provider = try #require(CGDataProvider(data: Data(repeating: 255, count: 60 * 40 * 4) as CFData))
    let source = try #require(CGImage(
      width: 60, height: 40, bitsPerComponent: 10, bitsPerPixel: 32, bytesPerRow: 60 * 4,
      space: colorSpace,
      bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue | CGImagePixelFormatInfo.RGB101010.rawValue),
      provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent
    ))
    #expect(source.bitsPerComponent == 10)
    let image = UIImage(cgImage: source, scale: 1, orientation: orientation)

    let result = try await ImageFixOrientationTransformer().transform(image: image)
    let pixels = try #require(result.cgImage)

    #expect(result.imageOrientation == .up)
    #expect(result.size == image.size)
    #expect(CGSize(width: pixels.width, height: pixels.height) == image.size)
    try expectTiles(pixels, columns: 1, expected: [6])
    if orientation == .up {
      #expect(pixels === source)
    }
  }

  @Test
  func `can crop the rightmost pixels of an upright scaled image`() async throws {
    let image = UIImage(cgImage: try makeImage(), scale: 3, orientation: .up)
    let normalized = try await ImageFixOrientationTransformer().transform(image: image)
    var rect = CropRect()
    rect.originX = 40
    rect.width = 20
    rect.height = 40

    let result = try await ImageCropTransformer(options: rect).transform(image: normalized)
    let pixels = try #require(result.cgImage)

    #expect(pixels.width == 20)
    #expect(pixels.height == 40)
    try expectTiles(pixels, columns: 1, expected: [2, 5])
  }

  @Test
  func `rejects an image without a bitmap`() async {
    await #expect(throws: ImageNotFoundException.self) {
      try await ImageFixOrientationTransformer().transform(image: UIImage())
    }
  }

  // A 3x2 grid of 20-pixel tiles: red, green, blue / yellow, magenta, cyan.
  private let colors: [[UInt8]] = [
    [255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255],
    [255, 255, 0, 255], [255, 0, 255, 255], [0, 255, 255, 255],
    [255, 255, 255, 255]
  ]

  private func makeImage() throws -> CGImage {
    var bytes: [UInt8] = []
    for row in 0..<40 {
      for column in 0..<60 {
        bytes.append(contentsOf: colors[(row / 20) * 3 + column / 20])
      }
    }
    let provider = try #require(CGDataProvider(data: Data(bytes) as CFData))
    let colorSpace = try #require(CGColorSpace(name: CGColorSpace.sRGB))
    return try #require(CGImage(
      width: 60, height: 40, bitsPerComponent: 8, bitsPerPixel: 32, bytesPerRow: 60 * 4,
      space: colorSpace,
      bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
      provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent
    ))
  }

  private func expectTiles(_ image: CGImage, columns: Int, expected: [Int]) throws {
    let colorSpace = try #require(CGColorSpace(name: CGColorSpace.sRGB))
    let context = try #require(CGContext(
      data: nil, width: image.width, height: image.height, bitsPerComponent: 8, bytesPerRow: image.width * 4,
      space: colorSpace,
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue
    ))
    context.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
    let bytes = try #require(context.data).assumingMemoryBound(to: UInt8.self)
    let rows = expected.count / columns
    for (index, color) in expected.enumerated() {
      let x = (2 * (index % columns) + 1) * image.width / (2 * columns)
      let y = (2 * (index / columns) + 1) * image.height / (2 * rows)
      let offset = y * context.bytesPerRow + x * 4
      for channel in 0..<4 {
        #expect(abs(Int(bytes[offset + channel]) - Int(colors[color][channel])) <= 1)
      }
    }
  }
}
