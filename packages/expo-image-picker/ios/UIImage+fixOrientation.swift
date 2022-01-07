// Copyright 2022-present 650 Industries. All rights reserved.

import UIKit

extension UIImage {
  func fixOrientation() -> UIImage {
    if (self.imageOrientation == UIImage.Orientation.up) {
      return self
    }
    
    var transform = CGAffineTransform.identity
    
    // rotation
    switch (self.imageOrientation) {
    case .down,
         .downMirrored:
      transform = transform
        .translatedBy(x: self.size.width, y: self.size.width)
        .rotated(by: .pi)
      break
    case .left,
         .leftMirrored:
      transform = transform
        .translatedBy(x: self.size.width, y: 0)
        .rotated(by: .pi / 2)
      break
    case .right,
         .rightMirrored:
      transform = transform
        .translatedBy(x: 0, y: self.size.height)
        .rotated(by: -.pi / 2)
      break
    default:
      break
    }
    
    // mirroring
    switch (self.imageOrientation) {
    case .upMirrored,
         .downMirrored:
      transform = transform
        .translatedBy(x: self.size.width, y: 0)
        .scaledBy(x: -1, y: 1)
      break
    case .leftMirrored,
         .rightMirrored:
      transform = transform
        .translatedBy(x: self.size.height, y: 0)
        .scaledBy(x: -1, y: 1)
      break
    default:
      break
    }
    
    let ctx = CGContext.init(data: nil,
                             width: Int(self.size.width),
                             height: Int(self.size.height),
                             bitsPerComponent: self.cgImage!.bitsPerComponent,
                             bytesPerRow: 0,
                             space: self.cgImage!.colorSpace!,
                             bitmapInfo: self.cgImage!.bitmapInfo.rawValue)!
    ctx.concatenate(transform)
    
    switch(self.imageOrientation) {
    case .left,
        .leftMirrored,
        .right,
        .rightMirrored:
      ctx.draw(self.cgImage!, in: CGRect.init(x: 0, y: 0, width: self.size.height, height: self.size.width))
      break
    default:
      ctx.draw(self.cgImage!, in: CGRect.init(x: 0, y: 0, width: self.size.width, height: self.size.height))
    }
    
    let cgImage = ctx.makeImage()!
    let result = UIImage.init(cgImage: cgImage)
    
    return result
  }
}
