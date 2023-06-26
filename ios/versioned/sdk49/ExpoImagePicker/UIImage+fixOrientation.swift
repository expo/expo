// Copyright 2022-present 650 Industries. All rights reserved.

import UIKit

extension UIImage {
  func fixOrientation() -> UIImage? {
    if self.imageOrientation == UIImage.Orientation.up {
      return self
    }

    var transform = CGAffineTransform.identity

    // rotation
    switch self.imageOrientation {
    case .down,
         .downMirrored:
      transform = transform
        .translatedBy(x: self.size.width, y: self.size.height)
        .rotated(by: .pi)
    case .left,
         .leftMirrored:
      transform = transform
        .translatedBy(x: self.size.width, y: 0)
        .rotated(by: .pi / 2)
    case .right,
         .rightMirrored:
      transform = transform
        .translatedBy(x: 0, y: self.size.height)
        .rotated(by: -.pi / 2)
    default:
      break
    }

    // mirroring
    switch self.imageOrientation {
    case .upMirrored,
         .downMirrored:
      transform = transform
        .translatedBy(x: self.size.width, y: 0)
        .scaledBy(x: -1, y: 1)
    case .leftMirrored,
         .rightMirrored:
      transform = transform
        .translatedBy(x: self.size.height, y: 0)
        .scaledBy(x: -1, y: 1)
    default:
      break
    }

    guard let cgImage = self.cgImage,
          let colorSpace = cgImage.colorSpace,
          let ctx = CGContext(data: nil,
                              width: Int(self.size.width),
                              height: Int(self.size.height),
                              bitsPerComponent: cgImage.bitsPerComponent,
                              bytesPerRow: 0,
                              space: colorSpace,
                              bitmapInfo: cgImage.bitmapInfo.rawValue)
    else {
      return nil
    }

    ctx.concatenate(transform)

    switch self.imageOrientation {
    case .left,
        .leftMirrored,
        .right,
        .rightMirrored:
      ctx.draw(cgImage, in: CGRect(x: 0, y: 0, width: self.size.height, height: self.size.width))
    default:
      ctx.draw(cgImage, in: CGRect(x: 0, y: 0, width: self.size.width, height: self.size.height))
    }

    guard let resultCgImage = ctx.makeImage() else {
      return nil
    }
    let result = UIImage(cgImage: resultCgImage)

    return result
  }
}
