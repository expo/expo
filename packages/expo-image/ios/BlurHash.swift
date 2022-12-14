// The blurhash algorithm was entirely created by Wolt Enterprises.
// This implementation was inspired by:
// - https://github.com/woltapp/blurhash/blob/master/Swift/BlurHashDecode.swift
// - https://github.com/woltapp/blurhash/blob/master/Swift/BlurHashEncode.swift
// See https://blurha.sh for more details about the blurhash.

import UIKit

// swiftlint:disable force_unwrapping

internal func image(fromBlurhash blurhash: String, size: CGSize, punch: Float = 1.0) -> CGImage? {
  guard blurhash.count >= 6 else {
    return nil
  }

  let sizeFlag = decode83(String(blurhash[0]))
  let numY = (sizeFlag / 9) + 1
  let numX = (sizeFlag % 9) + 1

  let quantisedMaximumValue = decode83(String(blurhash[1]))
  let maximumValue = Float(quantisedMaximumValue + 1) / 166

  guard blurhash.count == 4 + 2 * numX * numY else {
    return nil
  }

  let colors: [(Float, Float, Float)] = (0 ..< numX * numY).map { i in
    if i == 0 {
      let value = decode83(String(blurhash[2 ..< 6]))
      return decodeDC(value)
    } else {
      let value = decode83(String(blurhash[4 + i * 2 ..< 4 + i * 2 + 2]))
      return decodeAC(value, maximumValue: maximumValue * punch)
    }
  }

  let width = Int(size.width)
  let height = Int(size.height)
  let bytesPerRow = width * 3

  guard let data = CFDataCreateMutable(kCFAllocatorDefault, bytesPerRow * height) else {
    return nil
  }

  CFDataSetLength(data, bytesPerRow * height)

  guard let pixels = CFDataGetMutableBytePtr(data) else {
    return nil
  }

  for y in 0 ..< height {
    for x in 0 ..< width {
      var r: Float = 0
      var g: Float = 0
      var b: Float = 0

      for j in 0 ..< numY {
        for i in 0 ..< numX {
          let basis = cos(Float.pi * Float(x) * Float(i) / Float(width)) * cos(Float.pi * Float(y) * Float(j) / Float(height))
          let color = colors[i + j * numX]
          r += color.0 * basis
          g += color.1 * basis
          b += color.2 * basis
        }
      }

      let intR = UInt8(linearTosRGB(r))
      let intG = UInt8(linearTosRGB(g))
      let intB = UInt8(linearTosRGB(b))

      pixels[3 * x + 0 + y * bytesPerRow] = intR
      pixels[3 * x + 1 + y * bytesPerRow] = intG
      pixels[3 * x + 2 + y * bytesPerRow] = intB
    }
  }

  let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue)

  guard let provider = CGDataProvider(data: data), let cgImage = CGImage(
    width: width,
    height: height,
    bitsPerComponent: 8,
    bitsPerPixel: 24,
    bytesPerRow: bytesPerRow,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: bitmapInfo,
    provider: provider,
    decode: nil,
    shouldInterpolate: true,
    intent: .defaultIntent
  ) else {
    return nil
  }

  return cgImage
}

internal func blurhash(fromImage image: UIImage, numberOfComponents components: (Int, Int)) -> String? {
  let size = image.size
  let scale = image.scale

  let pixelWidth = Int(round(size.width * scale))
  let pixelHeight = Int(round(size.height * scale))

  let context = CGContext(
    data: nil,
    width: pixelWidth,
    height: pixelHeight,
    bitsPerComponent: 8,
    bytesPerRow: pixelWidth * 4,
    space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
  )!
  context.scaleBy(x: scale, y: -scale)
  context.translateBy(x: 0, y: -size.height)

  UIGraphicsPushContext(context)
  image.draw(at: .zero)
  UIGraphicsPopContext()

  guard let cgImage = context.makeImage(),
    let dataProvider = cgImage.dataProvider,
    let data = dataProvider.data,
    let pixels = CFDataGetBytePtr(data) else {
    assertionFailure("Unexpected error!")
    return nil
  }

  let width = cgImage.width
  let height = cgImage.height
  let bytesPerRow = cgImage.bytesPerRow

  var factors: [(Float, Float, Float)] = []
  for y in 0 ..< components.1 {
    for x in 0 ..< components.0 {
      let normalisation: Float = (x == 0 && y == 0) ? 1 : 2
      let factor = multiplyBasisFunction(
        pixels: pixels,
        width: width,
        height: height,
        bytesPerRow: bytesPerRow,
        bytesPerPixel: cgImage.bitsPerPixel / 8,
        pixelOffset: 0
      ) {
        normalisation * cos(Float.pi * Float(x) * $0 / Float(width)) as Float * cos(Float.pi * Float(y) * $1 / Float(height)) as Float
      }
      factors.append(factor)
    }
  }

  let dc = factors.first!
  let ac = factors.dropFirst()

  var hash = ""

  let sizeFlag = (components.0 - 1) + (components.1 - 1) * 9
  hash += encode83(sizeFlag, length: 1)

  let maximumValue: Float
  if !ac.isEmpty {
    let actualMaximumValue = ac.map({ max(abs($0.0), abs($0.1), abs($0.2)) }).max()!
    let quantisedMaximumValue = Int(max(0, min(82, floor(actualMaximumValue * 166 - 0.5))))
    maximumValue = Float(quantisedMaximumValue + 1) / 166
    hash += encode83(quantisedMaximumValue, length: 1)
  } else {
    maximumValue = 1
    hash += encode83(0, length: 1)
  }

  hash += encode83(encodeDC(dc), length: 4)

  for factor in ac {
    hash += encode83(encodeAC(factor, maximumValue: maximumValue), length: 2)
  }

  return hash
}

internal func isBlurhash(_ str: String) -> Bool {
  return str.allSatisfy { char in decodeCharacters[char] != nil }
}

// MARK: - Encode

// swiftlint:disable:next function_parameter_count
private func multiplyBasisFunction(
  pixels: UnsafePointer<UInt8>,
  width: Int,
  height: Int,
  bytesPerRow: Int,
  bytesPerPixel: Int,
  pixelOffset: Int,
  basisFunction: (Float, Float) -> Float
) -> (Float, Float, Float) {
  var r: Float = 0
  var g: Float = 0
  var b: Float = 0

  let buffer = UnsafeBufferPointer(start: pixels, count: height * bytesPerRow)

  for x in 0 ..< width {
    for y in 0 ..< height {
      let basis = basisFunction(Float(x), Float(y))
      r += basis * sRGBToLinear(buffer[bytesPerPixel * x + pixelOffset + 0 + y * bytesPerRow])
      g += basis * sRGBToLinear(buffer[bytesPerPixel * x + pixelOffset + 1 + y * bytesPerRow])
      b += basis * sRGBToLinear(buffer[bytesPerPixel * x + pixelOffset + 2 + y * bytesPerRow])
    }
  }

  let scale = 1 / Float(width * height)

  return (r * scale, g * scale, b * scale)
}

private let encodeCharacters: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~")

private func encodeDC(_ value: (Float, Float, Float)) -> Int {
  let roundedR = linearTosRGB(value.0)
  let roundedG = linearTosRGB(value.1)
  let roundedB = linearTosRGB(value.2)
  return (roundedR << 16) + (roundedG << 8) + roundedB
}

private func encodeAC(_ value: (Float, Float, Float), maximumValue: Float) -> Int {
  let quantR = Int(max(0, min(18, floor(signPow(value.0 / maximumValue, 0.5) * 9 + 9.5))))
  let quantG = Int(max(0, min(18, floor(signPow(value.1 / maximumValue, 0.5) * 9 + 9.5))))
  let quantB = Int(max(0, min(18, floor(signPow(value.2 / maximumValue, 0.5) * 9 + 9.5))))

  return quantR * 19 * 19 + quantG * 19 + quantB
}

private func encode83(_ value: Int, length: Int) -> String {
  var result = ""
  for i in 1 ... length {
    let digit = (value / pow(83, length - i)) % 83
    result += String(encodeCharacters[Int(digit)])
  }
  return result
}

// MARK: - Decode

private func decodeDC(_ value: Int) -> (Float, Float, Float) {
  let intR = value >> 16
  let intG = (value >> 8) & 255
  let intB = value & 255
  return (sRGBToLinear(intR), sRGBToLinear(intG), sRGBToLinear(intB))
}

private func decodeAC(_ value: Int, maximumValue: Float) -> (Float, Float, Float) {
  let quantR = value / (19 * 19)
  let quantG = (value / 19) % 19
  let quantB = value % 19

  let rgb = (
    signPow((Float(quantR) - 9) / 9, 2) * maximumValue,
    signPow((Float(quantG) - 9) / 9, 2) * maximumValue,
    signPow((Float(quantB) - 9) / 9, 2) * maximumValue
  )

  return rgb
}

private let decodeCharacters: [Character: Int] = {
  var dict: [Character: Int] = [:]
  for (index, character) in encodeCharacters.enumerated() {
    dict[character] = index
  }
  return dict
}()

private func decode83(_ str: String) -> Int {
  var value: Int = 0
  for character in str {
    if let digit = decodeCharacters[character] {
      value = value * 83 + digit
    }
  }
  return value
}

// MARK: - Helpers

private func signPow(_ value: Float, _ exp: Float) -> Float {
  return copysign(pow(abs(value), exp), value)
}

private func linearTosRGB(_ value: Float) -> Int {
  let v = max(0, min(1, value))
  if v <= 0.0031308 {
    return Int(v * 12.92 * 255 + 0.5)
  } else {
    return Int((1.055 * pow(v, 1 / 2.4) - 0.055) * 255 + 0.5)
  }
}

private func sRGBToLinear<Type: BinaryInteger>(_ value: Type) -> Float {
  let v = Float(Int64(value)) / 255
  if v <= 0.04045 {
    return v / 12.92
  } else {
    return pow((v + 0.055) / 1.055, 2.4)
  }
}

private func pow(_ base: Int, _ exponent: Int) -> Int {
  return (0 ..< exponent).reduce(1) { value, _ in value * base }
}

private extension String {
  subscript (offset: Int) -> Character {
    return self[index(startIndex, offsetBy: offset)]
  }

  subscript (bounds: CountableClosedRange<Int>) -> Substring {
    let start = index(startIndex, offsetBy: bounds.lowerBound)
    let end = index(startIndex, offsetBy: bounds.upperBound)
    return self[start...end]
  }

  subscript (bounds: CountableRange<Int>) -> Substring {
    let start = index(startIndex, offsetBy: bounds.lowerBound)
    let end = index(startIndex, offsetBy: bounds.upperBound)
    return self[start..<end]
  }
}
